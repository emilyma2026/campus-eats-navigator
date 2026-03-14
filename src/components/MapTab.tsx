import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Tag, Zap, ThumbsUp, Utensils, Coffee, Star, Clock,
  MapPin, LocateFixed, Footprints, Bike, Car, Search, X,
} from 'lucide-react';
import ScheduleTimeline from './ScheduleTimeline';
import AMapContainer, { POIRestaurant } from './AMapContainer';
import StoreDrawer, { EnrichedRestaurant, CrowdLevel } from './StoreDrawer';
import MeituanLogo from './MeituanLogo';
import { getActiveClass, getClassStatus } from '@/data/scheduleData';

// ── Transport config ─────────────────────────────────────────────────────────
type TransportMode = 'walk' | 'bike' | 'drive';

const TRANSPORT: Record<TransportMode, { label: string; icon: React.ElementType; speed: number; unit: string }> = {
  walk:  { label: '步行', icon: Footprints, speed: 80,  unit: '步行' }, // ≈3.2 km/40 min
  bike:  { label: '骑行', icon: Bike,       speed: 250, unit: '骑行' }, // ≈7.5 km/30 min
  drive: { label: '驾车', icon: Car,        speed: 500, unit: '驾车' }, // ≈10 km/20 min
};

const MAX_TIME: Record<TransportMode, number> = {
  walk:  40,
  bike:  30,
  drive: 20,
};

const FILTERS = [
  { label: '学生优惠', icon: Tag },
  { label: '折扣',     icon: Zap },
  { label: '高评分',   icon: ThumbsUp },
  { label: '快餐',     icon: Utensils },
  { label: '咖啡',     icon: Coffee },
];

const getDealFlags = (id: string) => {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { studentDeal: h % 3 === 0, meituanVoucher: h % 4 === 0 };
};

/** Deterministic crowd level — base from ID hash, scaled up during peak hours. */
function getCrowdInfo(id: string): { crowdLevel: CrowdLevel; waitMins: number } {
  const hash  = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hour  = new Date().getHours();
  const isPeak = (hour >= 11 && hour < 13) || (hour >= 17 && hour < 19);

  // During peak: slot 1-3 (min medium), off-peak: slot 0-2 (mostly low)
  const slot  = isPeak ? (hash % 3) + 1 : hash % 3;
  const crowdLevel: CrowdLevel = slot <= 1 ? 'low' : slot === 2 ? 'medium' : 'high';
  const waitMins = crowdLevel === 'low' ? 0
    : crowdLevel === 'medium' ? 5  + (hash % 6)
    :                           10 + (hash % 11);

  return { crowdLevel, waitMins };
}

const CROWD_LABEL: Record<CrowdLevel, string> = {
  low:    '🟢 客少',
  medium: '🟡 一般',
  high:   '🔴 人多',
};
const CROWD_CLASS: Record<CrowdLevel, string> = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-700',
};

interface Props {
  onRestaurantsLoaded: (restaurants: POIRestaurant[]) => void;
  highlightId: string | null;
  onHighlightClear: () => void;
  onLocationChange?: (loc: [number, number]) => void;
  onRadiusChange?: (radiusM: number) => void;
  /** Lift the geocoded address string up to Index → DiscoveryTab header */
  onAddressChange?: (addr: string) => void;
}

export default function MapTab({
  onRestaurantsLoaded,
  highlightId,
  onHighlightClear,
  onLocationChange,
  onRadiusChange,
  onAddressChange: onAddressChangeProp,
}: Props) {
  const [walkTime,           setWalkTime]           = useState(10);
  const [transportMode,      setTransportMode]      = useState<TransportMode>('walk');
  const [selectedId,         setSelectedId]         = useState<string | null>(null);
  const [activeFilters,      setActiveFilters]      = useState<string[]>([]);
  const [restaurants,        setRestaurants]        = useState<POIRestaurant[]>([]);
  const [isRelocated,        setIsRelocated]        = useState(false);
  const [currentAddress,     setCurrentAddress]     = useState('');
  const [searchText,         setSearchText]         = useState('');
  const [autoCompleteCenter, setAutoCompleteCenter] = useState<[number, number] | undefined>(undefined);
  /** Incremented on slider mouse/touch-up to trigger an exact-radius API re-fetch */
  const [sliderFetchTrigger, setSliderFetchTrigger] = useState(0);

  // Tick every minute to keep smart-banner fresh without extra API calls
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const searchInputRef  = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<any>(null);

  const speedMPerMin  = TRANSPORT[transportMode].speed;
  const activeClass   = getActiveClass();
  const classStatus   = getClassStatus();
  const initialCenter = activeClass?.campusCoords ?? [121.5132, 31.2995] as [number, number];

  // ── AutoComplete init ─────────────────────────────────────────────────────
  useEffect(() => {
    const init = () => {
      if (!window.AMap || autoCompleteRef.current) return;
      try {
        autoCompleteRef.current = new window.AMap.AutoComplete({
          input: 'bb-map-search',
          city:  '上海',
        });
        autoCompleteRef.current.on('select', (e: any) => {
          if (e.poi?.location) {
            const loc: [number, number] = [e.poi.location.lng, e.poi.location.lat];
            setAutoCompleteCenter(loc);
            setSearchText(e.poi.name || '');
            setIsRelocated(true);
          }
        });
      } catch (_) { /* AMap not ready yet */ }
    };
    const t = setTimeout(init, 600);
    return () => clearTimeout(t);
  }, []);

  // ── Distance-preserving mode switch ──────────────────────────────────────
  const handleModeChange = useCallback((newMode: TransportMode) => {
    const distanceM = walkTime * TRANSPORT[transportMode].speed;
    const newTime   = Math.min(
      Math.max(1, Math.round(distanceM / TRANSPORT[newMode].speed)),
      MAX_TIME[newMode],
    );
    setTransportMode(newMode);
    setWalkTime(newTime);
  }, [walkTime, transportMode]);

  // ── Callbacks ────────────────────────────────────────────────────────────
  const handlePOIResults = useCallback((pois: POIRestaurant[]) => {
    setRestaurants(pois);
    onRestaurantsLoaded(pois);
  }, [onRestaurantsLoaded]);

  const handleLocationChange = useCallback((loc: [number, number]) => {
    setIsRelocated(true);
    onLocationChange?.(loc);
  }, [onLocationChange]);

  const handleRadiusChange = useCallback((radiusM: number) => {
    onRadiusChange?.(radiusM);
  }, [onRadiusChange]);

  const handleAddressChange = useCallback((addr: string) => {
    setCurrentAddress(addr);
    onAddressChangeProp?.(addr);
  }, [onAddressChangeProp]);

  useEffect(() => {
    if (highlightId) { setSelectedId(highlightId); onHighlightClear(); }
  }, [highlightId, onHighlightClear]);

  const toggleFilter = (label: string) =>
    setActiveFilters((prev) => prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]);

  // ── Enriched restaurants (crowd info computed client-side) ───────────────
  const enriched = useMemo<EnrichedRestaurant[]>(() =>
    restaurants.map((r) => ({
      ...r,
      walkMins: Math.max(1, Math.round(r.distance / speedMPerMin)),
      ...getDealFlags(r.id),
      ...getCrowdInfo(r.id),
    })),
    [restaurants, speedMPerMin],
  );

  const filtered = useMemo(() => {
    if (!activeFilters.length) return enriched;
    return enriched.filter((r) => {
      if (activeFilters.includes('学生优惠') && !r.studentDeal) return false;
      if (activeFilters.includes('高评分')   && r.rating < 4)    return false;
      return true;
    });
  }, [enriched, activeFilters]);

  const selectedRestaurant = enriched.find((r) => r.id === selectedId) ?? null;
  const distKm = Math.round(walkTime * speedMPerMin / 100) / 10;

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* ── LEFT: Map ──────────────────────────────────────────────────────── */}
      <section className="relative flex-1 bg-muted overflow-hidden">
        <AMapContainer
          walkTime={walkTime}
          speedMPerMin={speedMPerMin}
          initialCenter={initialCenter}
          externalCenter={autoCompleteCenter}
          triggerExactFetch={sliderFetchTrigger}
          onPOIResults={handlePOIResults}
          onAddressChange={handleAddressChange}
          onRadiusChange={handleRadiusChange}
          selectedId={selectedId}
          onPinClick={(id) => setSelectedId((prev) => prev === id ? null : id)}
          onLocationChange={handleLocationChange}
        />

        {/* Search bar overlay */}
        <div className="absolute top-3 left-3 right-3 z-20">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              id="bb-map-search"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索地点、学校、街道..."
              className="w-full pl-9 pr-9 py-2.5 bg-white/96 backdrop-blur-sm rounded-xl shadow-lg text-sm border border-transparent focus:outline-none focus:border-[#FFD000] focus:ring-2 focus:ring-[#FFD000]/30 placeholder-gray-400"
            />
            {searchText && (
              <button
                onClick={() => { setSearchText(''); setAutoCompleteCenter(undefined); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Relocated / hint badge */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
          {isRelocated ? (
            <div className="flex items-center gap-1.5 bg-[#FFD000] text-black text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              <LocateFixed size={11} /> 已切换位置 · 数据已更新
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-black/50 text-white text-[11px] font-medium px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
              <MapPin size={11} className="text-[#FFD000]" /> 点击地图或搜索更换位置锚点
            </div>
          )}
        </div>
      </section>

      {/* ── RIGHT: Feed ────────────────────────────────────────────────────── */}
      <aside className="w-[340px] h-full bg-card border-l border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Active-class campus tag */}
          {activeClass && (
            <div className="px-4 pt-3 pb-0">
              <div className="flex items-center gap-1.5 text-xs font-bold bg-[#FFD000]/10 text-[#6B4C00] px-3 py-1.5 rounded-full w-fit">
                <MapPin size={11} /> 当前课堂：{activeClass.campus}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="px-4 pt-3">
            <ScheduleTimeline isRelocated={isRelocated} />
          </div>

          {/* ── Smart Decision Banner ─────────────────────────────────────── */}
          {classStatus.type === 'in_class' && classStatus.timeLeft !== undefined && (
            <div className="px-4 pt-3">
              {classStatus.timeLeft > 30 ? (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl p-3">
                  <span className="text-base shrink-0">🛵</span>
                  <div>
                    <p className="text-xs font-black text-blue-700">外卖窗口已开启</p>
                    <p className="text-[11px] text-blue-600 leading-tight mt-0.5">
                      还有 <b>{classStatus.timeLeft}</b> 分钟下课，现在下单外卖刚好到
                    </p>
                  </div>
                </div>
              ) : classStatus.timeLeft <= 15 ? (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3">
                  <span className="text-base shrink-0">🏃</span>
                  <div>
                    <p className="text-xs font-black text-red-700">冲刺堂食！选🟢客少的</p>
                    <p className="text-[11px] text-red-600 leading-tight mt-0.5">
                      仅剩 <b>{classStatus.timeLeft}</b> 分钟，避开🔴人多餐厅
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-2xl p-3">
                  <span className="text-base shrink-0">🍽️</span>
                  <div>
                    <p className="text-xs font-black text-green-700">堂食黄金时段</p>
                    <p className="text-[11px] text-green-600 leading-tight mt-0.5">
                      还有 <b>{classStatus.timeLeft}</b> 分钟，步行范围内选一家吧
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Transport + Walk Time ─────────────────────────────────────── */}
          <div className="px-4 pt-4">
            <div className="flex gap-2 mb-3">
              {(Object.entries(TRANSPORT) as [TransportMode, typeof TRANSPORT[TransportMode]][]).map(([mode, cfg]) => {
                const Icon   = cfg.icon;
                const active = transportMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                      active
                        ? 'bg-[#FFD000] border-[#FFD000] text-black shadow-sm'
                        : 'bg-card border-border text-muted-foreground hover:border-[#FFD000]/60 hover:text-foreground'
                    }`}
                  >
                    <Icon size={13} /> {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Time slider */}
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-semibold">{TRANSPORT[transportMode].unit}时间</label>
              <span className="text-sm font-bold text-orange-500 tabular-nums">{walkTime} 分钟</span>
            </div>
            <input
              type="range" min="1" max={MAX_TIME[transportMode]} value={walkTime}
              onChange={(e) => { setWalkTime(parseInt(e.target.value)); setSelectedId(null); }}
              onMouseUp={() => setSliderFetchTrigger((n) => n + 1)}
              onTouchEnd={() => setSliderFetchTrigger((n) => n + 1)}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1 分钟</span>
              <span className="font-semibold text-[#B8860B]">≈ {distKm} km</span>
              <span>{MAX_TIME[transportMode]} 分钟</span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="px-4 pt-4 flex flex-wrap gap-2">
            {FILTERS.map(({ label, icon: Icon }) => {
              const active = activeFilters.includes(label);
              return (
                <button key={label} onClick={() => toggleFilter(label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    active ? 'bg-[#FFD000] border-[#FFD000] text-black' : 'bg-card border-border text-muted-foreground hover:border-yellow-300'
                  }`}
                >
                  <Icon size={12} />{label}
                </button>
              );
            })}
          </div>

          {/* Restaurant List */}
          <div className="px-4 pt-4 pb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              下课吃什么 · <span className="text-foreground">{filtered.length}</span> 家
            </p>
            <div className="space-y-2">
              {filtered.sort((a, b) => a.walkMins - b.walkMins).map((r) => {
                const isSel = selectedId === r.id;
                return (
                  <button key={r.id}
                    onClick={() => setSelectedId((prev) => prev === r.id ? null : r.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all border ${
                      isSel ? 'bg-[#FFD000]/5 border-[#FFD000]/50 shadow-elevated' : 'bg-card border-border shadow-card hover:shadow-elevated'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{r.address}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                        <div className="flex items-center gap-0.5">
                          <Star size={11} fill="#FFD000" className="text-[#FFD000]" />
                          <span className="text-xs font-bold">{r.rating.toFixed(1)}</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-bold">
                          <Clock size={10} /> {r.walkMins}min
                        </span>
                        {/* Crowd badge */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CROWD_CLASS[r.crowdLevel]}`}>
                          {CROWD_LABEL[r.crowdLevel]}
                        </span>
                        {r.studentDeal && (
                          <span className="text-[10px] font-bold bg-[#FFD000] text-black px-1.5 py-0.5 rounded">学生价</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{TRANSPORT[transportMode].unit} {walkTime} 分钟内暂无餐厅</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <StoreDrawer restaurant={selectedRestaurant} onClose={() => setSelectedId(null)} />
    </div>
  );
}
