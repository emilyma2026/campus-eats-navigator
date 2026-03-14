import React from 'react';
import { MapPin, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  restaurantCount: number;
  /** Called when user taps the primary "Go" button */
  onGo: () => void;
  /** Called when user dismisses without acting */
  onDismiss: () => void;
}

export default function NotificationModal({ restaurantCount, onGo, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-sm px-6">
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 24 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.9,  opacity: 0, y: 12  }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="w-full max-w-[300px] bg-background rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Yellow header */}
        <div className="bg-[#FFD000] px-5 pt-6 pb-5 flex flex-col items-center relative">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          >
            <X size={13} />
          </button>

          {/* Pulsing bell */}
          <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-inner">
            🔔
          </div>
          <h2 className="text-[22px] font-black text-black leading-tight text-center">
            即将下课！
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3 mb-5">
            <MapPin size={18} className="text-[#B8860B] shrink-0" />
            <p className="text-sm font-semibold leading-snug">
              为你探测到周边{' '}
              <span className="text-[#B8860B] font-black text-base">
                {restaurantCount}
              </span>{' '}
              家干饭圣地
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 py-3 rounded-2xl border-2 border-border text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors"
            >
              稍后
            </button>
            <button
              onClick={onGo}
              className="flex-2 px-6 py-3 rounded-2xl bg-[#FFD000] text-black text-sm font-black hover:bg-yellow-400 active:scale-[0.97] transition-all shadow-md"
            >
              去看看 →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
