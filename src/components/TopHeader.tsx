import React from 'react';
import { Bell } from 'lucide-react';

interface Props {
  username: string;
  remindMins: number;
}

function formatTime(mins: number): string {
  if (mins >= 60 && mins % 60 === 0) return `${mins / 60}小时`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60}m`;
  return `${mins}分`;
}

export default function TopHeader({ username, remindMins }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0 z-20">

      {/* Left: greeting + reminder badge */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">
          👋 {username || '同学'}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-secondary px-2 py-0.5 rounded-full text-muted-foreground shrink-0">
          <Bell size={9} className="text-[#B8860B]" />
          下课前 {formatTime(remindMins)}
        </span>
      </div>

      {/* Right: Bell & Bite logo mark */}
      <div className="flex items-center gap-2 select-none shrink-0">
        {/* Icon badge */}
        <div className="w-8 h-8 bg-[#FFD000] rounded-[10px] flex items-center justify-center shadow-sm">
          <span className="text-[17px] leading-none">🔔</span>
        </div>
        {/* Wordmark */}
        <div className="flex flex-col items-start leading-none">
          <span className="text-[14px] font-black tracking-tight text-foreground">Bell &amp; Bite</span>
          <span className="text-[9px] font-semibold text-muted-foreground tracking-widest uppercase">大学城美食</span>
        </div>
      </div>
    </header>
  );
}
