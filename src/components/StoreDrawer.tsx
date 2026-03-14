import React from 'react';
import { Star, Clock, Tag, MapPin, ExternalLink, Navigation, AlertTriangle, Camera } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import MeituanLogo from './MeituanLogo';

export interface EnrichedRestaurant {
  id: string;
  name: string;
  rating: number;
  address: string;
  type: string;
  distance: number;
  walkMins: number;
  studentDeal: boolean;
  meituanVoucher: boolean;
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
                <span>步行约 {restaurant.walkMins} 分钟 · {restaurant.distance} 米</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Navigation size={15} className="shrink-0 text-[#FFD000]" />
                <span>{restaurant.type || '餐饮'}</span>
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

            {/* CTA */}
            <button className="w-full bg-[#FFD000] text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors active:scale-[0.98]">
              <ExternalLink size={16} /> 在美团下单
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
