import { Heart } from "lucide-react";

interface CheckInButtonProps {
  onCheckIn: () => void;
  isCheckedInToday: boolean;
  isLoading?: boolean;
}

export function CheckInButton({ onCheckIn, isCheckedInToday, isLoading }: CheckInButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      {!isCheckedInToday && (
        <>
          <span className="absolute w-32 h-32 rounded-full gradient-primary opacity-30 animate-pulse-ring" />
          <span className="absolute w-32 h-32 rounded-full gradient-primary opacity-20 animate-pulse-ring [animation-delay:0.5s]" />
        </>
      )}

      {/* Main button */}
      <button
        onClick={onCheckIn}
        disabled={isCheckedInToday || isLoading}
        className={`
          relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center
          transition-all duration-300 ease-out
          ${isCheckedInToday
            ? 'gradient-success shadow-success cursor-default'
            : 'gradient-primary shadow-primary hover:scale-105 active:scale-95 cursor-pointer animate-heartbeat'
          }
          disabled:opacity-80
        `}
      >
        <Heart
          className={`w-10 h-10 text-primary-foreground mb-1 ${isLoading ? 'animate-pulse' : ''}`}
          fill={isCheckedInToday ? "currentColor" : "none"}
        />
        <span className="text-primary-foreground font-semibold text-sm">
          {isLoading ? "签到中..." : isCheckedInToday ? "已签到" : "我还活着"}
        </span>
      </button>
    </div>
  );
}
