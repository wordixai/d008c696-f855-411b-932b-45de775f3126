import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  lastCheckIn: Date | null;
  consecutiveDays: number;
  daysMissed: number;
}

export function StatusCard({ lastCheckIn, consecutiveDays, daysMissed }: StatusCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "从未签到";
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = () => {
    if (daysMissed >= 2) return "text-danger";
    if (daysMissed === 1) return "text-warning";
    return "text-success";
  };

  const getStatusMessage = () => {
    if (daysMissed >= 2) return "已超过2天未签到，紧急联系人将收到通知";
    if (daysMissed === 1) return "已有1天未签到，请尽快签到";
    return "状态良好";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
      <Card className="shadow-card">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">上次签到</p>
            <p className="text-sm font-medium text-card-foreground">{formatDate(lastCheckIn)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Calendar className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">连续签到</p>
            <p className="text-sm font-medium text-card-foreground">{consecutiveDays} 天</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${daysMissed >= 1 ? 'bg-warning/10' : 'bg-success/10'}`}>
            {daysMissed >= 1 ? (
              <AlertTriangle className={`w-5 h-5 ${getStatusColor()}`} />
            ) : (
              <CheckCircle className="w-5 h-5 text-success" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">状态</p>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
