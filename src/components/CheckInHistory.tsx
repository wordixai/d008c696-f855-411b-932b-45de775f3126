import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckInHistoryProps {
  history: Date[];
}

export function CheckInHistory({ history }: CheckInHistoryProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const isCheckedIn = (date: Date) => {
    return history.some(h => {
      const historyDate = new Date(h);
      return (
        historyDate.getFullYear() === date.getFullYear() &&
        historyDate.getMonth() === date.getMonth() &&
        historyDate.getDate() === date.getDate()
      );
    });
  };

  const formatDay = (date: Date) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <Card className="shadow-card w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">签到记录</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between gap-1">
          {last7Days.map((date, idx) => {
            const checked = isCheckedIn(date);
            const today = isToday(date);

            return (
              <div
                key={idx}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg flex-1
                  ${today ? 'bg-primary/10' : ''}
                `}
              >
                <span className="text-xs text-muted-foreground">
                  {formatDay(date)}
                </span>
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-200
                    ${checked
                      ? 'gradient-success'
                      : 'bg-muted border-2 border-dashed border-muted-foreground/30'
                    }
                  `}
                >
                  {checked && (
                    <CheckCircle className="w-4 h-4 text-success-foreground" />
                  )}
                </div>
                <span className={`text-xs ${today ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  {formatDate(date)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
