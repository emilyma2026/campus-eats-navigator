import React from 'react';

interface ClassBlock {
  name: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  color: string;
}

const CLASSES: ClassBlock[] = [
  { name: '计量经济学', startHour: 9, startMin: 0, endHour: 11, endMin: 0, color: 'hsl(var(--primary))' },
  { name: '市场营销', startHour: 11, startMin: 0, endHour: 12, endMin: 30, color: 'hsl(var(--accent))' },
  { name: '公司金融', startHour: 14, startMin: 0, endHour: 15, endMin: 50, color: 'hsl(48 80% 45%)' },
];

const TIMELINE_START = 8;
const TIMELINE_END = 20;
const TOTAL_HOURS = TIMELINE_END - TIMELINE_START;

const CURRENT_HOUR = 12;
const CURRENT_MIN = 15;

function timeToPercent(hour: number, min: number) {
  const totalMinutes = (hour - TIMELINE_START) * 60 + min;
  return (totalMinutes / (TOTAL_HOURS * 60)) * 100;
}

export default function ScheduleTimeline() {
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => TIMELINE_START + i);
  const currentPercent = timeToPercent(CURRENT_HOUR, CURRENT_MIN);

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">今日课表</p>
      <div className="relative" style={{ height: 240 }}>
        {hours.map(h => {
          const pct = timeToPercent(h, 0);
          const label = h <= 12 ? `${h}:00` : `${h}:00`;
          return (
            <div key={h} className="absolute left-0 right-0 flex items-center" style={{ top: `${pct}%` }}>
              <span className="text-[10px] text-muted-foreground w-10 text-right pr-2 shrink-0 -translate-y-1/2 tabular-nums">
                {label}
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
          );
        })}

        {CLASSES.map((cls) => {
          const top = timeToPercent(cls.startHour, cls.startMin);
          const bottom = timeToPercent(cls.endHour, cls.endMin);
          const height = bottom - top;
          return (
            <div
              key={cls.name}
              className="absolute left-11 right-1 rounded-lg px-2 py-1 flex flex-col justify-center overflow-hidden"
              style={{
                top: `${top}%`,
                height: `${height}%`,
                backgroundColor: cls.color,
              }}
            >
              <span className="text-[11px] font-bold text-foreground truncate">{cls.name}</span>
              <span className="text-[9px] text-foreground/70">
                {`${cls.startHour}:${String(cls.startMin).padStart(2, '0')} – ${cls.endHour}:${String(cls.endMin).padStart(2, '0')}`}
              </span>
            </div>
          );
        })}

        <div className="absolute left-10 right-0 flex items-center z-10" style={{ top: `${currentPercent}%` }}>
          <div className="w-2 h-2 rounded-full bg-destructive shrink-0 -ml-1" />
          <div className="flex-1 border-t-2 border-destructive" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          下节课 1小时45分钟后
        </span>
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          管院楼
        </span>
      </div>
    </div>
  );
}
