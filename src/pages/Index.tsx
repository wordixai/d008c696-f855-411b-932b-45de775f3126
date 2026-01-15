import { useCheckIn } from "@/hooks/useCheckIn";
import { CheckInButton } from "@/components/CheckInButton";
import { StatusCard } from "@/components/StatusCard";
import { ContactForm } from "@/components/ContactForm";
import { CheckInHistory } from "@/components/CheckInHistory";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

const Index = () => {
  const {
    history,
    contact,
    lastCheckIn,
    isCheckedInToday,
    daysMissed,
    consecutiveDays,
    isLoading,
    checkIn,
    updateContact,
  } = useCheckIn();

  const { toast } = useToast();

  const handleCheckIn = async () => {
    await checkIn();
    toast({
      title: "签到成功",
      description: "很高兴知道你还活着！",
    });
  };

  const handleSaveContact = (newContact: { name: string; email: string }) => {
    updateContact(newContact);
    toast({
      title: "联系人已保存",
      description: `紧急联系人设置为 ${newContact.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">死了么</h1>
          <span className="text-xs text-muted-foreground ml-1">生存确认系统</span>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8">
          {/* Check-in section */}
          <section className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              今天签到了吗？
            </h2>
            <p className="text-muted-foreground mb-8">
              每天点击签到，让关心你的人安心
            </p>
            <CheckInButton
              onCheckIn={handleCheckIn}
              isCheckedInToday={isCheckedInToday}
              isLoading={isLoading}
            />
          </section>

          {/* Status cards */}
          <StatusCard
            lastCheckIn={lastCheckIn}
            consecutiveDays={consecutiveDays}
            daysMissed={daysMissed}
          />

          {/* Bottom section */}
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
            <div className="flex-1">
              <CheckInHistory history={history} />
            </div>
            <div className="flex-1">
              <ContactForm contact={contact} onSave={handleSaveContact} />
            </div>
          </div>

          {/* Warning message */}
          {daysMissed >= 2 && contact.email && (
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-center max-w-md">
              <p className="text-danger font-medium">
                您已超过 {daysMissed} 天未签到
              </p>
              <p className="text-sm text-danger/80 mt-1">
                系统将自动通知 {contact.name}（{contact.email}）
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            每天签到，让爱你的人放心
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
};

export default Index;
