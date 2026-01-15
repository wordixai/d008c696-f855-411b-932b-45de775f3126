import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // 查找需要通知的用户（2天未签到）
    const { data: usersToNotify, error: queryError } = await supabaseClient
      .from('users')
      .select(`
        id,
        device_id,
        emergency_contacts!inner (
          id,
          name,
          email,
          notified_at
        ),
        check_ins (
          checked_at
        )
      `);

    if (queryError) {
      throw queryError;
    }

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const results: { userId: string; status: string; error?: string }[] = [];

    for (const user of usersToNotify || []) {
      const contact = user.emergency_contacts[0];
      if (!contact) continue;

      // 检查上次签到时间
      const checkIns = user.check_ins || [];
      const lastCheckIn = checkIns.length > 0
        ? new Date(Math.max(...checkIns.map((ci: { checked_at: string }) => new Date(ci.checked_at).getTime())))
        : null;

      // 如果在2天内签到过，跳过
      if (lastCheckIn && lastCheckIn > twoDaysAgo) {
        continue;
      }

      // 如果1天内已通知过，跳过
      if (contact.notified_at && new Date(contact.notified_at) > oneDayAgo) {
        continue;
      }

      // 计算未签到天数
      const daysSinceCheckIn = lastCheckIn
        ? Math.floor((now.getTime() - lastCheckIn.getTime()) / (24 * 60 * 60 * 1000))
        : '未知';

      // 发送邮件
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: '死了么 <onboarding@resend.dev>',
            to: [contact.email],
            subject: '紧急通知：您的朋友已超过2天未签到',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #e74c3c;">紧急通知</h1>
                <p>亲爱的 ${contact.name}，</p>
                <p>您被设置为紧急联系人的朋友已经 <strong>${daysSinceCheckIn} 天</strong> 没有在「死了么」应用上签到了。</p>
                <p>这可能意味着：</p>
                <ul>
                  <li>他们可能遇到了紧急情况</li>
                  <li>他们可能只是忘记了签到</li>
                  <li>他们可能需要您的关心</li>
                </ul>
                <p>建议您尽快联系他们确认安全。</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">
                  此邮件由「死了么」生存确认系统自动发送。
                  ${lastCheckIn ? `上次签到时间：${lastCheckIn.toLocaleString('zh-CN')}` : '该用户从未签到过'}
                </p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${errorData}`);
        }

        // 更新通知时间
        await supabaseClient
          .from('emergency_contacts')
          .update({ notified_at: now.toISOString() })
          .eq('id', contact.id);

        results.push({ userId: user.id, status: 'notified' });
      } catch (emailError) {
        results.push({
          userId: user.id,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
