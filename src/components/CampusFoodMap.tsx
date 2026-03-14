import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Star, Coffee, Tag, Zap, ThumbsUp, Utensils, X, ExternalLink, MapPinned } from 'lucide-react';
import ScheduleTimeline from './ScheduleTimeline';
import AMapContainer, { POIRestaurant } from './AMapContainer';
import MeituanLogo from './MeituanLogo';

const WALK_SPEED = 80; // meters per minute

const FILTERS = [
  { label: '学生优惠', icon: Tag },
  { label: '折扣', icon: Zap },
  { label: '高评分', icon: ThumbsUp },
  { label: '快餐', icon: Utensils },
  { label: '咖啡', icon: Coffee },
];

// Randomly assign deals to some restaurants for demo purposes
const getDealFlags = (id: string) => {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    studentDeal: hash % 3 === 0,
    meituanVoucher: hash % 4 === 0,
  };
};

export default function CampusFoodMap() {
  const [walkTime, setWalkTime] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<POIRestaurant[]>([]);

  const toggleFilter = (label: string) => {
    setActiveFilters(prev => prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]);
  };

  const handlePOIResults = useCallback((pois: POIRestaurant[]) => {
    setRestaurants(pois);
  }, []);

  const handlePinClick = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const enrichedRestaurants = useMemo(() => {
    return restaurants.map(r => ({
      ...r,
      walkMins: Math.max(1, Math.round(r.distance / WALK_SPEED)),
      ...getDealFlags(r.id),
    }));
  }, [restaurants]);

  const selectedRestaurant = enrichedRestaurants.find(r => r.id === selectedId) || null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* MAP AREA */}
      <section className="relative flex-[7] bg-muted overflow-hidden">
        <AMapContainer
          walkTime={walkTime}
          onPOIResults={handlePOIResults}
          selectedId={selectedId}
          onPinClick={handlePinClick}
        />

        {/* Floating info card */}
        <AnimatePresence>
          {selectedRestaurant && (
            <motion.div
              key="float"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute z-20 bg-card rounded-2xl shadow-elevated p-4 w-72 bottom-16 left-1/2 -translate-x-1/2"
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-2 right-2 p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
              <h4 className="font-bold text-sm">{selectedRestaurant.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5 text-accent text-xs font-bold">
                  <Star size={12} fill="currentColor" /> {selectedRestaurant.rating.toFixed(1)}
                </div>
                <span className="text-muted-foreground text-xs">{selectedRestaurant.address}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">{selectedRestaurant.type}</p>
              <div className="flex items-center gap-2 mt-2">
                {selectedRestaurant.studentDeal && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-foreground text-[10px] font-bold rounded-full">
                    <Tag size={10} /> 学生优惠
                  </span>
                )}
                {selectedRestaurant.meituanVoucher && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-foreground text-[10px] font-bold rounded-full">
                    <MeituanLogo size={10} /> 美团券
                  </span>
                )}
              </div>
              <button className="w-full mt-3 bg-accent text-accent-foreground text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                <ExternalLink size={12} /> 在美团下单
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map attribution */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-medium">
          <MapPinned size={10} /> Bell & Bite · 五角场
        </div>
      </section>

      {/* SIDEBAR */}
      <aside className="w-[360px] h-full bg-card border-l border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="p-5 pb-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-card">
                <Utensils size={16} className="text-primary-foreground" />
              </div>
              <h1 className="text-lg font-extrabold tracking-tight">Bell & Bite</h1>
            </div>
          </div>

          {/* Schedule Timeline */}
          <div className="px-5 pt-4">
            <ScheduleTimeline />
          </div>

          {/* Walk Time Slider */}
          <div className="px-5 pt-4">
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-semibold">步行时间</label>
              <span className="text-sm font-bold text-accent tabular-nums">{walkTime} 分钟</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={walkTime}
              onChange={(e) => { setWalkTime(parseInt(e.target.value)); setSelectedId(null); }}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1 分钟</span>
              <span>20 分钟</span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="px-5 pt-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ label, icon: Icon }) => {
                const active = activeFilters.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleFilter(label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      active
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-border text-muted-foreground hover:border-accent/30 hover:text-foreground'
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Restaurant List */}
          <div className="px-5 pt-5 pb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              下课吃什么 · {enrichedRestaurants.length} 家
            </p>
            <div className="space-y-2.5">
              {enrichedRestaurants
                .sort((a, b) => a.walkMins - b.walkMins)
                .map(r => {
                  const isSelected = selectedId === r.id;
                  return (
                    <motion.button
                      key={r.id}
                      onClick={() => handlePinClick(r.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all duration-200 border ${
                        isSelected
                          ? 'bg-accent/5 border-accent/30 shadow-elevated'
                          : 'bg-card border-border shadow-card hover:shadow-elevated'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{r.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-0.5 text-accent text-xs font-bold">
                              <Star size={12} fill="currentColor" /> {r.rating.toFixed(1)}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{r.address}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{r.type}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                          <span className="text-xs font-bold text-accent flex items-center gap-1">
                            <Clock size={11} /> {r.walkMins} 分钟
                          </span>
                          {r.studentDeal && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded">
                              <Tag size={10} />
                              学生价
                            </span>
                          )}
                          {r.meituanVoucher && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary-foreground bg-accent px-1.5 py-0.5 rounded">
                              <MeituanLogo size={10} />
                              美团券
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              {enrichedRestaurants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">步行 {walkTime} 分钟内暂无餐厅</p>
                  <p className="text-xs mt-1">试试增加步行时间</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
