import React from 'react';
import {
  CLASSES,
  getActiveClass,
  getClassStatus,
  curMins,
} from '@/data/scheduleData';
import { MapPin } from 'lucide-react';

// Crop the visible timeline to 9:00 AM – 5:00 PM for demo clarity
const TIMELINE_START = 9;
const TIMELINE_END   = 17;
const TOTAL_HOURS    = TIMELINE_END - TIMELINE_START;
const CANVAS_H       = 200; // px

function timeToPercent(hour: number, min: number) {
  const pct = ((hour - TIMELINE_START) * 60 + min) / (TOTAL_HOURS * 60) * 100;
  return Math.max(0, Math.min(100, pct)); // clamp so out-of-range classes don't overflow
}

interface Props {
  isRelocated?: boolean;
  remindMins?: number;
}

export default function ScheduleTimeline({ isRelocated = false, remindMins }: Props) {
  // Use fixed demo time (12:00) — no interval needed; time is static
  const nowMins        = curMins(); // always 720 (12:00 PM)
  const nowHour        = Math.floor(nowMins / 60);
  const nowMin         = nowMins % 60;
  const currentPercent = timeToPercent(nowHour, nowMin);

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => TIMELINE_START + i);

  const activeClass = getActiveClass();
  const status      = getClassStatus();

  // Reminder indicator: find the first class whose end is still in the future
  const remind = remindMins ?? parseInt(localStorage.getItem('bb-remind-mins') || '30');
  const reminderClass = CLASSES.find((c) => c.endHour * 60 + c.endMin > nowMins);
  const reminderAtMins = reminderClass
    ? reminderClass.endHour * 60 + reminderClass.endMin - remind
    : null;
  const reminderPct = reminderAtMins !== null
    ? timeToPercent(Math.floor(reminderAtMins / 60), reminderAtMins % 60)
    : null;
  const reminderLabel = reminderAtMins !== null
    ? `${Math.floor(reminderAtMins / 60)}:${String(reminderAtMins % 60).padStart(2, '0')}`
    : null;

  const footerCampus = isRelocated
    ? '当前地图锚点附近'
    : (activeClass?.campus ?? '复旦·邯郸');

  return (
    <div className="bg-secondary rounded-2xl p-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">今日课表</p>

      {/* ── Timeline grid ─────────────────────────────────────────────── */}
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

        {/* ── Class blocks ────────────────────────────────────────────── */}
        {CLASSES.map((cls) => {
          const top    = timeToPercent(cls.startHour, cls.startMin);
          const bottom = timeToPercent(cls.endHour,   cls.endMin);
          const height = bottom - top;
          if (height <= 0) return null; // fully outside 9-17 range
          const isActive = activeClass?.name === cls.name;
          const blockPx  = (height / 100) * CANVAS_H;

          return (
            <div
              key={cls.name}
              className={`absolute left-10 right-0 rounded-xl overflow-hidden flex flex-col ${
                isActive ? 'ring-2 ring-white/80 shadow-md' : ''
              }`}
              style={{ top: `${top}%`, height: `${height}%`, backgroundColor: cls.color }}
            >
              {/* Campus tag */}
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

              {/* Course name + time */}
              {blockPx >= 20 && (
                <div
                  className="px-2 pb-1 flex-1 flex flex-col justify-center overflow-hidden"
                  style={{ minHeight: Math.min(blockPx - 16, 32) }}
                >
                  <span
                    className="text-[10px] font-bold text-foreground/90 leading-tight"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                      wordBreak: 'break-all',
                    }}
                  >
                    {cls.name}
                  </span>
                  {blockPx >= 42 && (
                    <span className="text-[8px] text-foreground/60 leading-none mt-0.5 tabular-nums">
                      {`${cls.startHour}:${String(cls.startMin).padStart(2, '0')}–${cls.endHour}:${String(cls.endMin).padStart(2, '0')}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Orange dashed reminder line ──────────────────────────────── */}
        {reminderPct !== null && (
          <div
            className="absolute left-9 right-0 flex items-center z-10"
            style={{ top: `${reminderPct}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-orange-400 border-2 border-white shrink-0 -ml-1.5 flex items-center justify-center text-[6px]">🔔</div>
            <div className="flex-1 border-t-2 border-dashed border-orange-400 opacity-80" />
            <span className="text-[8px] font-black text-orange-500 tabular-nums ml-1 shrink-0">{reminderLabel}</span>
          </div>
        )}

        {/* ── Red current-time line (fixed demo 12:00) ────────────────── */}
        <div
          className="absolute left-9 right-0 flex items-center z-10"
          style={{ top: `${currentPercent}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-destructive shrink-0 -ml-1" />
          <div className="flex-1 border-t-2 border-destructive" />
        </div>
      </div>

      {/* ── Footer: campus / anchor location ──────────────────────────── */}
      <div className="mt-2 flex items-center justify-end border-t border-border pt-2">
        <span className={`flex items-center gap-1 shrink-0 text-[11px] transition-colors ${
          isRelocated ? 'text-[#B8860B] font-semibold' : 'text-muted-foreground'
        }`}>
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
