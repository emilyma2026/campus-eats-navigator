import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, BookOpen, MapPin, Check, ChevronDown } from 'lucide-react';
import { CLASSES } from '@/data/scheduleData';

interface Props {
  onComplete: (username: string, remindMins: number) => void;
}

// ── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? 'bg-[#FFD000]' : 'bg-border'}`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0px)' }}
      />
    </button>
  );
}

// ── Wheel Picker ─────────────────────────────────────────────────────────────
const PICK_ITEMS = [
  { label: '10分钟',  value: 10  },
  { label: '15分钟',  value: 15  },
  { label: '20分钟',  value: 20  },
  { label: '25分钟',  value: 25  },
  { label: '30分钟',  value: 30  },
  { label: '35分钟',  value: 35  },
  { label: '40分钟',  value: 40  },
  { label: '45分钟',  value: 45  },
  { label: '50分钟',  value: 50  },
  { label: '55分钟',  value: 55  },
  { label: '1小时',   value: 60  },
];
const ITEM_H = 44;

function WheelPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = PICK_ITEMS.findIndex((it) => it.value >= value);
    el.scrollTop = Math.max(0, idx) * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, PICK_ITEMS.length - 1));
    const newVal = PICK_ITEMS[clamped].value;
    setPicked(newVal);
    onChange(newVal);
  }, [onChange]);

  return (
    <div className="relative rounded-2xl bg-secondary overflow-hidden" style={{ height: ITEM_H * 3 }}>
      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{ height: ITEM_H * 1.2, background: 'linear-gradient(to bottom, hsl(var(--secondary)) 20%, transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{ height: ITEM_H * 1.2, background: 'linear-gradient(to top, hsl(var(--secondary)) 20%, transparent)' }} />
      {/* Center selection highlight */}
      <div className="absolute inset-x-4 pointer-events-none z-10 rounded-xl bg-[#FFD000]/15 border border-[#FFD000]/40"
        style={{ top: ITEM_H, height: ITEM_H }} />
      {/* Scrollable list */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        <div style={{ height: ITEM_H }} />
        {PICK_ITEMS.map(({ label, value: v }) => (
          <div
            key={v}
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            className={`flex items-center justify-center transition-all font-bold ${
              v === picked ? 'text-foreground text-lg' : 'text-muted-foreground/40 text-sm'
            }`}
          >
            {label}
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}

// ── Main Overlay ─────────────────────────────────────────────────────────────
export default function OnboardingOverlay({ onComplete }: Props) {
  const [username,        setUsername]        = useState('');
  const [remindMins,      setRemindMins]      = useState(30);
  const [useCustom,       setUseCustom]       = useState(false);
  const [enableNotifs,    setEnableNotifs]    = useState(true);
  const [uploading,       setUploading]       = useState(false);
  const [uploadDone,      setUploadDone]      = useState(false);

  // Two focused presets that map directly to dining strategies
  const PRESETS = [
    { label: '15分', sublabel: '堂食模式', value: 15 },
    { label: '30分', sublabel: '外卖模式', value: 30 },
  ];

  const handleUpload = () => {
    if (uploading || uploadDone) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadDone(true);
      localStorage.setItem('bb-schedule-uploaded', '1');
    }, 1600);
  };

  const handleEnter = () => onComplete(username.trim() || '同学', remindMins);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">

      {/* ── Brand Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-10 pb-5 px-6 shrink-0">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="w-20 h-20 bg-[#FFD000] rounded-[24px] flex items-center justify-center shadow-xl text-4xl mb-4"
        >
          🔔
        </motion.div>
        <h1 className="text-2xl font-black tracking-tight">Bell &amp; Bite</h1>
        <p className="text-sm text-muted-foreground mt-1 text-center leading-snug">你的校园饭点专属雷达，干饭不迷路</p>
      </div>

      {/* ── Form body ───────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-10 max-w-sm mx-auto w-full space-y-5">

        {/* Nickname */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold">你的昵称</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            placeholder="输入昵称（如：小明同学）"
            className="w-full border-2 border-border rounded-2xl px-4 py-3 text-sm font-medium bg-card focus:outline-none focus:border-[#FFD000] transition-colors"
          />
        </div>

        {/* ── Import Schedule (required) ─────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 bg-[#FFD000]/15 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen size={14} className="text-[#B8860B]" />
            </div>
            <div>
              <p className="text-sm font-semibold">导入课表</p>
              <p className="text-[11px] text-muted-foreground">AI 识别校区，自动定位</p>
            </div>
          </div>
          {!uploadDone ? (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full border-2 border-dashed border-[#FFD000]/60 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-[#FFD000]/5 transition-colors disabled:opacity-60"
            >
              {uploading ? (
                <div className="w-8 h-8 border-[3px] border-[#FFD000] border-t-transparent rounded-full animate-spin" />
              ) : (
                <BookOpen size={22} className="text-[#B8860B]" />
              )}
              <p className="text-sm font-semibold text-muted-foreground">
                {uploading ? 'AI 识别中…' : '点击上传课表截图'}
              </p>
              {!uploading && (
                <p className="text-xs text-muted-foreground/60">支持截图 / PDF / 照片</p>
              )}
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 mb-1">
                <Check size={13} /> 识别成功 · {CLASSES.length} 门课程
              </div>
              {CLASSES.map((cls) => (
                <div key={cls.name} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-xs font-bold">{cls.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {`${cls.startHour}:${String(cls.startMin).padStart(2, '0')} – ${cls.endHour}:${String(cls.endMin).padStart(2, '0')}`}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-[#FFD000]/20 text-[#6B4C00] px-2 py-1 rounded-full shrink-0 ml-2">
                    <MapPin size={8} /> {cls.campus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Enable Reminders — promoted toggle ───────────────────────── */}
        <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#FFD000]/15 rounded-xl flex items-center justify-center shrink-0">
              <Bell size={14} className="text-[#B8860B]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">开启下课提醒</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {enableNotifs ? '开启后可在设置中随时调整' : '关闭后跳过时间设置'}
              </p>
            </div>
          </div>
          <Toggle checked={enableNotifs} onChange={setEnableNotifs} />
        </div>

        {/* ── Time settings — only shown when reminders enabled ─────────── */}
        {enableNotifs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-2 overflow-hidden"
          >
            <label className="text-sm font-bold block">下课提醒时间</label>
            <div className="flex gap-2">
              {PRESETS.map(({ label, sublabel, value }) => (
                <button
                  key={value}
                  onClick={() => { setRemindMins(value); setUseCustom(false); }}
                  className={`flex-1 py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
                    !useCustom && remindMins === value
                      ? 'bg-[#FFD000] border-[#FFD000] text-black shadow-sm'
                      : 'border-border text-muted-foreground hover:border-yellow-300'
                  }`}
                >
                  <span className="font-black text-base leading-none">{label}</span>
                  <span className="text-[10px] font-semibold leading-none opacity-70">{sublabel}</span>
                </button>
              ))}
              <button
                onClick={() => setUseCustom((v) => !v)}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-0.5 ${
                  useCustom || (remindMins !== 15 && remindMins !== 30)
                    ? 'bg-[#FFD000] border-[#FFD000] text-black shadow-sm'
                    : 'border-border text-muted-foreground hover:border-yellow-300'
                }`}
              >
                {!useCustom && remindMins !== 15 && remindMins !== 30
                  ? `${remindMins >= 60 ? '1小时' : remindMins + '分'}`
                  : '自定义'}
                <ChevronDown size={12} className={`transition-transform ${useCustom ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {useCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-2"
              >
                <WheelPicker value={remindMins} onChange={setRemindMins} />
                {/* Confirm custom time */}
                <button
                  onClick={() => setUseCustom(false)}
                  className="w-full py-2.5 rounded-2xl bg-black/80 text-white text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={13} /> 确认选择 {remindMins >= 60 ? '1小时' : `${remindMins}分钟`}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}


        {/* ── Confirm & Enter CTA ──────────────────────────────────────── */}
        <button
          onClick={handleEnter}
          className="w-full bg-[#FFD000] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 active:scale-[0.98] transition-all text-base shadow-lg mt-2"
        >
          <Check size={16} /> 确认进入 Bell &amp; Bite
        </button>

        <p className="text-xs text-center text-muted-foreground pb-2">
          所有设置均可在 App 内随时修改
        </p>
      </div>
    </div>
  );
}
