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
    : (activeClass?.campus ?? nextClass?.campus ?? '管院楼');

  return (
    <div className="bg-secondary rounded-2xl p-4">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">今日课表</p>

      {/* Timeline grid */}
      <div className="relative" style={{ height: 300 }}>
        {hours.map((h) => (
          <div key={h} className="absolute left-0 right-0 flex items-center" style={{ top: `${timeToPercent(h, 0)}%` }}>
            <span className="text-[10px] text-muted-foreground w-10 text-right pr-2 shrink-0 -translate-y-1/2 tabular-nums">
              {h}:00
            </span>
            <div className="flex-1 border-t border-border" />
          </div>
        ))}

        {/* Class blocks */}
        {CLASSES.map((cls) => {
          const top    = timeToPercent(cls.startHour, cls.startMin);
          const bottom = timeToPercent(cls.endHour,   cls.endMin);
          const height = bottom - top;
          const isActive = activeClass?.name === cls.name;

          return (
            <div
              key={cls.name}
              className={`absolute left-11 right-1 rounded-xl px-2 py-1 flex flex-col justify-center overflow-hidden ${
                isActive ? 'ring-2 ring-white/70 shadow-lg' : ''
              }`}
              style={{ top: `${top}%`, height: `${height}%`, backgroundColor: cls.color }}
            >
              {isActive && (
                <span className="text-[9px] font-black text-black/60 uppercase tracking-wider mb-0.5">
                  ● 进行中
                </span>
              )}
              <span className="text-[11px] font-bold text-foreground truncate leading-tight">{cls.name}</span>
              <span className="text-[9px] text-foreground/70">
                {`${cls.startHour}:${String(cls.startMin).padStart(2, '0')} – ${cls.endHour}:${String(cls.endMin).padStart(2, '0')}`}
              </span>
              {/* Campus location tag */}
              <span className="mt-0.5 inline-flex items-center gap-0.5 text-[8px] font-bold bg-black/10 text-black/60 px-1.5 py-0.5 rounded-full self-start">
                <MapPin size={6} /> {cls.campus}
              </span>
            </div>
          );
        })}

        {/* Current time line */}
        <div className="absolute left-10 right-0 flex items-center z-10" style={{ top: `${currentPercent}%` }}>
          <div className="w-2 h-2 rounded-full bg-destructive shrink-0 -ml-1" />
          <div className="flex-1 border-t-2 border-destructive" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {footerTime()}
        </span>
        <span className={`flex items-center gap-1 transition-colors ${isRelocated ? 'text-[#B8860B] font-semibold' : ''}`}>
          {isRelocated ? (
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: '#FFD000', boxShadow: '0 0 0 2px rgba(255,208,0,0.35)',
              animation: 'bb-pulse 2s ease-out infinite', flexShrink: 0,
            }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          )}
          {footerCampus}
        </span>
      </div>
    </div>
  );
}
