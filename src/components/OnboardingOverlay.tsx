import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Bell, ChevronRight, Check, BookOpen, MapPin } from 'lucide-react';
import { CLASSES } from '@/data/scheduleData';

interface Props {
  onComplete: (username: string, remindMins: number) => void;
}

const SLIDE = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
  transition: { duration: 0.28 },
};

export default function OnboardingOverlay({ onComplete }: Props) {
  const [step, setStep]           = useState(1);
  const [username, setUsername]   = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [remindMins, setRemindMins] = useState<5 | 10 | 15>(10);

  const handleUpload = () => {
    if (uploading || uploadDone) return;
    setUploading(true);
    setTimeout(() => { setUploading(false); setUploadDone(true); }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-[#FFD000]"
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">

          {/* ── Step 1 : Welcome ─────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" {...SLIDE} className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                className="w-24 h-24 bg-[#FFD000] rounded-[28px] flex items-center justify-center shadow-xl text-5xl"
              >
                🔔
              </motion.div>

              <div>
                <h1 className="text-3xl font-black">Bell &amp; Bite</h1>
                <p className="text-muted-foreground mt-1 text-sm">欢迎来到五角星梦幻大学城</p>
                <p className="text-xs text-muted-foreground/70 mt-1">日程驱动 · 美食决策 · 一步到位</p>
              </div>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && username.trim() && setStep(2)}
                placeholder="输入你的昵称（如：小明同学）"
                className="w-full border-2 border-border rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#FFD000] transition-colors"
              />

              <button
                onClick={() => username.trim() && setStep(2)}
                disabled={!username.trim()}
                className="w-full bg-[#FFD000] text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-35 hover:bg-yellow-400 active:scale-[0.98] transition-all"
              >
                开始使用 <ChevronRight size={18} />
              </button>

              <p className="text-xs text-muted-foreground">步骤 1 / 3</p>
            </motion.div>
          )}

          {/* ── Step 2 : Schedule Upload ──────────────────── */}
          {step === 2 && (
            <motion.div key="s2" {...SLIDE} className="w-full max-w-sm flex flex-col gap-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#FFD000]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen size={26} className="text-[#B8860B]" />
                </div>
                <h2 className="text-2xl font-black">导入课表</h2>
                <p className="text-sm text-muted-foreground mt-1">上传截图，AI 自动识别校区信息</p>
              </div>

              {!uploadDone ? (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="border-2 border-dashed border-[#FFD000]/60 rounded-2xl p-8 flex flex-col items-center gap-3 hover:bg-[#FFD000]/5 transition-colors w-full"
                >
                  {uploading ? (
                    <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={30} className="text-[#B8860B]" />
                  )}
                  <p className="text-sm font-semibold text-muted-foreground">
                    {uploading ? 'AI 识别中…' : '点击上传课表截图'}
                  </p>
                  {!uploading && (
                    <p className="text-xs text-muted-foreground/60">支持截图 / PDF / 照片</p>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600 mb-2">
                    <Check size={16} /> 识别成功 · {CLASSES.length} 门课程
                  </div>
                  {CLASSES.map((cls) => (
                    <div key={cls.name} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-sm font-bold">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {`${cls.startHour}:${String(cls.startMin).padStart(2, '0')} – ${cls.endHour}:${String(cls.endMin).padStart(2, '0')}`}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold bg-[#FFD000]/20 text-[#6B4C00] px-2 py-1 rounded-full shrink-0 ml-2">
                        <MapPin size={10} /> {cls.campus}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => uploadDone && setStep(3)}
                disabled={!uploadDone}
                className="w-full bg-[#FFD000] text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-35 hover:bg-yellow-400 active:scale-[0.98] transition-all"
              >
                继续 <ChevronRight size={18} />
              </button>
              <p className="text-xs text-muted-foreground text-center">步骤 2 / 3</p>
            </motion.div>
          )}

          {/* ── Step 3 : Notification Prefs ───────────────── */}
          {step === 3 && (
            <motion.div key="s3" {...SLIDE} className="w-full max-w-sm flex flex-col gap-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#FFD000]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell size={26} className="text-[#B8860B]" />
                </div>
                <h2 className="text-2xl font-black">下课提醒</h2>
                <p className="text-sm text-muted-foreground mt-1">在下课前推送周边美食推荐</p>
              </div>

              <p className="text-sm font-semibold text-center text-muted-foreground">提前几分钟提醒？</p>

              <div className="grid grid-cols-3 gap-3">
                {([5, 10, 15] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRemindMins(m)}
                    className={`py-5 rounded-2xl font-black text-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      remindMins === m
                        ? 'bg-[#FFD000] border-[#FFD000] text-black shadow-md'
                        : 'border-border text-muted-foreground hover:border-yellow-300'
                    }`}
                  >
                    {m}
                    <span className="text-xs font-medium">分钟</span>
                  </button>
                ))}
              </div>

              <div className="bg-secondary rounded-2xl p-3 text-xs text-muted-foreground text-center">
                将在每节课结束前 <span className="font-bold text-[#B8860B]">{remindMins} 分钟</span> 推送周边 Top 5 餐厅
              </div>

              <button
                onClick={() => onComplete(username.trim(), remindMins)}
                className="w-full bg-[#FFD000] text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 active:scale-[0.98] transition-all text-base"
              >
                进入 Bell &amp; Bite 🎉
              </button>
              <p className="text-xs text-muted-foreground text-center">步骤 3 / 3</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
