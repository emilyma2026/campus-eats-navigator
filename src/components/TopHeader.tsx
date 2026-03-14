import React from 'react';
import { Utensils } from 'lucide-react';

interface Props {
  username: string;
  remindMins: number;
}

export default function TopHeader({ username, remindMins }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border shrink-0 z-20">
      <span className="text-sm font-semibold text-muted-foreground">
        👋&nbsp;{username || '同学'}
        <span className="ml-2 text-[11px] font-medium bg-secondary px-2 py-0.5 rounded-full">
          下课前 {remindMins} 分钟提醒
        </span>
      </span>
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 bg-[#FFD000] rounded-lg flex items-center justify-center shadow-sm">
          <Utensils size={13} className="text-black" />
        </div>
        <span className="text-base font-extrabold tracking-tight">Bell &amp; Bite</span>
      </div>
    </header>
  );
}
