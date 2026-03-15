import React, { useState } from 'react';
import { Star, Clock, Tag, MapPin, ExternalLink, AlertTriangle, Camera } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import MeituanLogo from './MeituanLogo';

export type CrowdLevel = 'low' | 'medium' | 'high';

export interface EnrichedRestaurant {
  id: string;
  name: string;
  lng: number;
  lat: number;
  rating: number;
  address: string;
  type: string;
  distance: number;
  walkMins: number;
  studentDeal: boolean;
  meituanVoucher: boolean;
  crowdLevel: CrowdLevel;
  waitMins: number;
  avgPrice?: number;
  cuisineCategory?: string;
}

interface Props {
  restaurant: EnrichedRestaurant | null;
  onClose: () => void;
}

const MOCK_REVIEWS = [
  { user: '学姐小林',   text: '份量足，价格实惠，学生友好 👍', stars: 5 },
  { user: '经济系大三', text: '中午人有点多，建议错峰去',       stars: 4 },
];

const PITFALL_TIPS = [
  { emoji: '🚫', tip: '高峰期 12:00–13:00 排队超 15 分钟，建议 12:30 后再来' },
  { emoji: '💸', tip: '外卖平台比堂食贵约 5 元，有美团券才划算' },
  { emoji: '🌶️', tip: '辣度标注参考性有限，重辣食客建议当面备注 +2 辣' },
];

// Placeholder photo colours for student picks
const PHOTO_COLORS = ['#FFE28A', '#FFCBA4', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB'];

export default function StoreDrawer({ restaurant, onClose }: Props) {
  const [selectedMode, setSelectedMode] = useState<'delivery' | 'dine' | null>(null);
  const remindMins = parseInt(localStorage.getItem('bb-remind-mins') || '30');

  return (
    <Drawer open={!!restaurant} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[75vh]">
        {restaurant && (
          <div className="px-5 pb-8 overflow-y-auto">
            {/* Header */}
            <DrawerHeader className="px-0 pt-2 pb-4">
              <div className="flex items-start justify-between gap-3">
                <DrawerTitle className="text-xl font-extrabold leading-tight">
                  {restaurant.name}
                </DrawerTitle>
                <div className="flex items-center gap-1 shrink-0 bg-[#FFD000]/15 px-2.5 py-1 rounded-full">
                  <Star size={14} fill="#FFD000" className="text-[#FFD000]" />
                  <span className="font-black text-sm">{restaurant.rating.toFixed(1)}</span>
                </div>
              </div>
            </DrawerHeader>

            {/* Info rows */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#FFD000]" />
                <span>{restaurant.address || '地址信息暂缺'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={15} className="shrink-0 text-[#FFD000]" />
                <span>步行约 {Math.max(1, Math.round(restaurant.distance / 80))} 分钟 · {restaurant.distance} 米</span>
              </div>

              {(restaurant.avgPrice || restaurant.cuisineCategory) && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {restaurant.cuisineCategory && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary rounded-full text-xs font-semibold">
                      🍽️ {restaurant.cuisineCategory}
                    </span>
                  )}
                  {restaurant.avgPrice && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <span className="text-[#B8860B] font-bold">¥</span> 人均 ¥{restaurant.avgPrice}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Crowd level + wait time badge */}
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 ${
              restaurant.crowdLevel === 'low'    ? 'bg-green-50  border border-green-200'  :
              restaurant.crowdLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                                                   'bg-red-50    border border-red-200'
            }`}>
              <span className="text-xl">
                {restaurant.crowdLevel === 'low' ? '🟢' : restaurant.crowdLevel === 'medium' ? '🟡' : '🔴'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black ${
                  restaurant.crowdLevel === 'low'    ? 'text-green-700'  :
                  restaurant.crowdLevel === 'medium' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {restaurant.crowdLevel === 'low'    ? '客流稀少 · 随时可去'  :
                   restaurant.crowdLevel === 'medium' ? '人流正常 · 无需等位'  : '人流较多 · 需要等位'}
                </p>
                <p className={`text-[11px] mt-0.5 ${
                  restaurant.crowdLevel === 'low'    ? 'text-green-600'  :
                  restaurant.crowdLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {restaurant.waitMins === 0
                    ? '建议：直接堂食 ✅'
                    : `预计等待约 ${restaurant.waitMins} 分钟 — 考虑外卖 🛵`}
                </p>
              </div>
            </div>

            {/* Deal badges */}
            {(restaurant.studentDeal || restaurant.meituanVoucher) && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {restaurant.studentDeal && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD000]/20 text-xs font-bold rounded-full">
                    <Tag size={11} /> 学生优惠
                  </span>
                )}
                {restaurant.meituanVoucher && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                    <MeituanLogo size={11} /> 美团券可用
                  </span>
                )}
              </div>
            )}

            {/* Meituan group buying */}
            {restaurant.meituanVoucher && (() => {
              const hash = restaurant.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
              const deals = [
                { name: '2人餐套餐', original: 58 + hash % 20, meituan: 38 + hash % 10, sold: 800 + hash % 500 },
                { name: '单人午餐套餐', original: 35 + hash % 10, meituan: 22 + hash % 8, sold: 400 + hash % 300 },
              ];
              return (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MeituanLogo size={15} />
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">美团团购</p>
                  </div>
                  <div className="space-y-2">
                    {deals.map((deal, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5">
                        <div>
                          <p className="text-xs font-bold">{deal.name}</p>
                          <p className="text-[10px] text-muted-foreground">已售 {deal.sold}+</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground line-through">¥{deal.original}</span>
                          <span className="text-sm font-black text-orange-600">¥{deal.meituan}</span>
                          <button className="text-[10px] font-bold bg-orange-500 text-white px-2 py-1 rounded-lg hover:bg-orange-600 transition-colors">
                            抢
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Reviews */}
            <div className="bg-secondary rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">同学评价</p>
              <div className="space-y-3">
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#FFD000]/30 flex items-center justify-center text-xs font-bold shrink-0">
                      {r.user[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold">{r.user}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: r.stars }).map((_, j) => (
                            <Star key={j} size={9} fill="#FFD000" className="text-[#FFD000]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 避雷指南 ──────────────────────────────────────── */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">避雷指南</p>
              </div>
              <div className="space-y-2">
                {PITFALL_TIPS.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sm shrink-0">{t.emoji}</span>
                    <p className="text-xs text-orange-800 leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 同学精选 Photos ───────────────────────────────── */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera size={14} className="text-muted-foreground shrink-0" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">同学精选</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PHOTO_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: color }}
                  >
                    {['🍜', '🥤', '🥗', '🍱', '☕', '🥐'][i]}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Delivery / Dine-in Mode Selector ─────────────────────── */}
            <div className="flex gap-3 mb-4">
              {/* 外卖 — 食堂不支持外卖 */}
              {restaurant.name.includes('食堂') ? (
                <div className="flex-1 py-3 rounded-2xl border-2 border-border bg-muted/50 flex flex-col items-center gap-0.5 opacity-50 cursor-not-allowed">
                  <span className="text-base leading-none">🛵</span>
                  <span className="text-xs font-black leading-none mt-1">外卖</span>
                  <span className="text-[10px] font-semibold mt-0.5 text-muted-foreground">暂不支持</span>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedMode(prev => prev === 'delivery' ? null : 'delivery')}
                  className={`flex-1 py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
                    selectedMode === 'delivery'
                      ? 'bg-[#FFD000] border-[#FFD000] text-black shadow-md'
                      : 'bg-card border-border text-foreground hover:border-[#FFD000]/60 hover:bg-[#FFD000]/5'
                  }`}
                >
                  <span className="text-base leading-none">🛵</span>
                  <span className="text-xs font-black leading-none mt-1">外卖</span>
                  {selectedMode === 'delivery' && (
                    <span className="text-[10px] font-semibold mt-0.5 opacity-80">
                      约 {remindMins} 分钟送达
                    </span>
                  )}
                </button>
              )}

              {/* 堂食 */}
              <button
                onClick={() => setSelectedMode(prev => prev === 'dine' ? null : 'dine')}
                className={`flex-1 py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
                  selectedMode === 'dine'
                    ? 'bg-[#FFD000] border-[#FFD000] text-black shadow-md'
                    : 'bg-card border-border text-foreground hover:border-[#FFD000]/60 hover:bg-[#FFD000]/5'
                }`}
              >
                <span className="text-base leading-none">🍽️</span>
                <span className="text-xs font-black leading-none mt-1">堂食</span>
                {selectedMode === 'dine' && restaurant && (
                  <span className="text-[10px] font-semibold mt-0.5 opacity-80">
                    步行 {restaurant.walkMins} 分钟
                  </span>
                )}
              </button>
            </div>

            {/* CTA */}
            <button className="w-full bg-[#FFD000] text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors active:scale-[0.98]">
              <ExternalLink size={16} /> 在美团下单
            </button>

            {/* Social sharing — 搭子属性 */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs text-muted-foreground shrink-0">分享给搭子：</span>
              <button className="w-9 h-9 bg-[#07C160] rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform" title="分享到微信">
                <span className="text-white text-[10px] font-black leading-none">微信</span>
              </button>
              <button className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform" style={{ background: 'linear-gradient(135deg,#FF2442,#FF6884)' }} title="分享到小红书">
                <span className="text-white text-[9px] font-black leading-none">小红书</span>
              </button>
              <button className="w-9 h-9 bg-[#E6162D] rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform" title="分享到微博">
                <span className="text-white text-[10px] font-black leading-none">微博</span>
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
