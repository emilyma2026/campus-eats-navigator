import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, Tag, MapPin, ChevronRight } from 'lucide-react';
import { POIRestaurant } from './AMapContainer';
import MeituanLogo from './MeituanLogo';

const WALK_SPEED = 80;

const SCENES = [
  { id: 'all', label: '全部' },
  { id: 'solo', label: '一人食 🍜' },
  { id: 'group', label: '聚餐 🥂' },
  { id: 'fast', label: '快餐 ⚡' },
  { id: 'latenight', label: '夜宵 🌙' },
  { id: 'cafe', label: '咖啡甜品 ☕' },
  { id: 'healthy', label: '轻食 🥗' },
];

const getDealFlags = (id: string) => {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { studentDeal: hash % 3 === 0, meituanVoucher: hash % 4 === 0 };
};

interface Props {
  restaurants: POIRestaurant[];
  onViewOnMap: (id: string) => void;
}

export default function DiscoveryTab({ restaurants, onViewOnMap }: Props) {
  const [activeScene, setActiveScene] = useState('all');

  const enriched = useMemo(() =>
    restaurants
      .map(r => ({
        ...r,
        walkMins: Math.max(1, Math.round(r.distance / WALK_SPEED)),
        ...getDealFlags(r.id),
      }))
      .sort((a, b) => b.rating - a.rating),
    [restaurants]
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-card border-b border-border">
        <h1 className="text-xl font-extrabold tracking-tight mb-0.5">发现美食</h1>
        <p className="text-xs text-muted-foreground mb-3">复旦管院周边 · 按口碑排名</p>

        {/* Scene chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SCENES.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveScene(s.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                activeScene === s.id
                  ? 'bg-[#FFD000] border-[#FFD000] text-black shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3">
        {enriched.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={28} className="opacity-30" />
            </div>
            <p className="text-sm font-medium">正在加载附近餐厅...</p>
            <p className="text-xs mt-1 opacity-60">切换至「地图决策」Tab 后自动加载</p>
          </div>
        ) : (
          enriched.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.2 }}
              className="bg-card rounded-2xl p-4 border border-border shadow-card"
            >
              <div className="flex items-start gap-3">
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 mt-0.5 ${
                  i === 0 ? 'bg-[#FFD000] text-black' :
                  i === 1 ? 'bg-slate-200 text-slate-600' :
                  i === 2 ? 'bg-amber-100 text-amber-700' :
                  'bg-muted text-muted-foreground text-xs'
                }`}>
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + rating */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-sm leading-tight">{r.name}</p>
                    <div className="flex items-center gap-0.5 shrink-0 bg-[#FFD000]/10 px-2 py-0.5 rounded-full">
                      <Star size={11} fill="#FFD000" className="text-[#FFD000]" />
                      <span className="text-xs font-black">{r.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground truncate mb-2">{r.address}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={10} /> {r.walkMins} 分钟步行
                    </span>
                    {r.studentDeal && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[#FFD000]/15 text-[10px] font-bold rounded-full">
                        <Tag size={9} /> 学生优惠
                      </span>
                    )}
                    {r.meituanVoucher && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full">
                        <MeituanLogo size={9} /> 美团券
                      </span>
                    )}
                  </div>

                  {/* View on Map CTA */}
                  <button
                    onClick={() => onViewOnMap(r.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#FFD000] text-xs font-bold text-black hover:bg-[#FFD000] transition-colors active:scale-[0.98]"
                  >
                    <MapPin size={11} />
                    在地图上看
                    <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
