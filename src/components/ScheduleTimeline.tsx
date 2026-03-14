import React from 'react';
import {
  CLASSES,
  CURRENT_HOUR,
  CURRENT_MIN,
  getActiveClass,
  getNextClass,
  minsUntilEnd,
  minsUntilStart,
} from '@/data/scheduleData';
import { MapPin } from 'lucide-react';

const TIMELINE_START = 8;
const TIMELINE_END   = 20;
const TOTAL_HOURS    = TIMELINE_END - TIMELINE_START;
const CANVAS_H       = 220; // px — reduced from 300 for compact view

function timeToPercent(hour: number, min: number) {
  return ((hour - TIMELINE_START) * 60 + min) / (TOTAL_HOURS * 60) * 100;
}

interface Props {
  isRelocated?: boolean;
}

export default function ScheduleTimeline({ isRelocated = false }: Props) {
  const hours          = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => TIMELINE_START + i);
  const currentPercent = timeToPercent(CURRENT_HOUR, CURRENT_MIN);
  const activeClass    = getActiveClass();
  const nextClass      = getNextClass();

  const footerTime = () => {
    if (activeClass) return `${activeClass.name} 还有 ${minsUntilEnd(activeClass)} 分钟`;
    if (nextClass)   return `下节课 ${minsUntilStart(nextClass)} 分钟后`;
    return '今日课程已结束';
  };

  const footerCampus = isRelocated
    ? '当前地图锚点附近'
    : (activeClass?.campus ?? nextClass?.campus ?? '复旦·邯郸');

  return (
    <div className="bg-secondary rounded-2xl p-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">今日课表</p>

      {/* Timeline grid */}
      <div className="relative" style={{ height: CANVAS_H }}>
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${timeToPercent(h, 0)}%` }}
          >
            <span className="text-[9px] text-muted-foreground/70 w-9 text-right pr-2 shrink-0 -translate-y-1/2 tabular-nums leading-none">
              {h}:00
            </span>
            <div className="flex-1 border-t border-border/60" />
          </div>
        ))}

        {/* Class blocks */}
        {CLASSES.map((cls) => {
          const top    = timeToPercent(cls.startHour, cls.startMin);
          const bottom = timeToPercent(cls.endHour,   cls.endMin);
          const height = bottom - top;
          const isActive = activeClass?.name === cls.name;
          const blockPx = (height / 100) * CANVAS_H;

          return (
            <div
              key={cls.name}
              className={`absolute left-10 right-0 rounded-xl overflow-hidden flex flex-col ${
                isActive ? 'ring-2 ring-white/80 shadow-md' : ''
              }`}
              style={{ top: `${top}%`, height: `${height}%`, backgroundColor: cls.color }}
            >
              {/* ── Campus tag – prominent top strip ── */}
              <div className="flex items-center gap-0.5 px-2 pt-1 pb-0 shrink-0">
                <MapPin size={8} className="text-black/70 shrink-0" />
                <span className="text-[9px] font-black text-black/75 truncate leading-none">
                  {cls.campus}
                </span>
                {isActive && (
                  <span className="ml-auto text-[8px] font-black text-black/60 bg-black/15 px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                    进行中
                  </span>
                )}
              </div>

              {/* ── Course name + time (only if block tall enough) ── */}
              {blockPx >= 30 && (
                <div className="px-2 pb-1 flex-1 flex flex-col justify-center min-h-0">
                  <span className="text-[10px] font-bold text-foreground/90 truncate leading-tight">
                    {cls.name}
                  </span>
                  {blockPx >= 38 && (
                    <span className="text-[8px] text-foreground/60 leading-none mt-0.5 tabular-nums">
                      {`${cls.startHour}:${String(cls.startMin).padStart(2, '0')}–${cls.endHour}:${String(cls.endMin).padStart(2, '0')}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Current-time line */}
        <div
          className="absolute left-9 right-0 flex items-center z-10"
          style={{ top: `${currentPercent}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-destructive shrink-0 -ml-1" />
          <div className="flex-1 border-t-2 border-destructive" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <span className="flex items-center gap-1 min-w-0 truncate">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="truncate">{footerTime()}</span>
        </span>
        <span className={`flex items-center gap-1 shrink-0 ml-2 transition-colors ${isRelocated ? 'text-[#B8860B] font-semibold' : ''}`}>
          {isRelocated ? (
            <span style={{
              display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: '#FFD000', boxShadow: '0 0 0 2px rgba(255,208,0,0.35)',
              animation: 'bb-pulse 2s ease-out infinite', flexShrink: 0,
            }} />
          ) : (
            <MapPin size={10} className="shrink-0" />
          )}
          {footerCampus}
        </span>
      </div>
    </div>
  );
}
