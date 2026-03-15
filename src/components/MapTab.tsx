import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Tag, Zap, Star,
  MapPin, Footprints, Bike, Car, Search, X, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import ScheduleTimeline from './ScheduleTimeline';
import AMapContainer, { POIRestaurant } from './AMapContainer';
import StoreDrawer, { EnrichedRestaurant, CrowdLevel } from './StoreDrawer';
import MeituanLogo from './MeituanLogo';
import { getActiveClass, getClassStatus, CLASSES, curMins } from '@/data/scheduleData';

// ── Transport config ─────────────────────────────────────────────────────────
type TransportMode = 'walk' | 'bike' | 'drive';

const TRANSPORT: Record<TransportMode, { label: string; icon: React.ElementType; speed: number; unit: string }> = {
  walk:  { label: '步行', icon: Footprints, speed: 80,  unit: '步行' },
  bike:  { label: '骑行', icon: Bike,       speed: 250, unit: '骑行' },
  drive: { label: '驾车', icon: Car,        speed: 500, unit: '驾车' },
};

const MAX_TIME: Record<TransportMode, number> = {
  walk:  40,
  bike:  30,
  drive: 20,
};

// 3 student-friendly filters
const FILTERS = [
  { label: '薅羊毛', icon: Tag    }, // student deals
  { label: '不踩雷', icon: Shield }, // rating >= 4.5
  { label: '不用等', icon: Zap    }, // crowd != high
];

const getDealFlags = (id: string) => {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { studentDeal: h % 3 === 0, meituanVoucher: h % 4 === 0 };
};

/** Deterministic crowd level — ~50% high, ~30% medium, ~20% low at peak hours. */
function getCrowdInfo(id: string): { crowdLevel: CrowdLevel; waitMins: number } {
  const hash   = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  // Use the demo clock (curMins=720 = 12:00) so peak detection is consistent
  const demoHour = Math.floor(curMins() / 60);
  const isPeak   = (demoHour >= 11 && demoHour < 13) || (demoHour >= 17 && demoHour < 19);

  // Off-peak: roughly equal thirds. Peak: bias heavily toward high.
  const r = hash % 10;
  let crowdLevel: CrowdLevel;
  if (isPeak) {
    crowdLevel = r <= 4 ? 'high' : r <= 7 ? 'medium' : 'low'; // 50% high, 30% medium, 20% low
  } else {
    crowdLevel = r <= 2 ? 'high' : r <= 5 ? 'medium' : 'low'; // 30% high, 30% medium, 40% low
  }

  const waitMins = crowdLevel === 'low' ? 0
    : crowdLevel === 'medium' ? 5  + (hash % 6)
    :                           10 + (hash % 11);

  return { crowdLevel, waitMins };
}

const CROWD_LABEL: Record<CrowdLevel, string> = {
  low:    '🟢 客少',
  medium: '🟡 正常',
  high:   '🔴 人多',
};
const CROWD_CLASS: Record<CrowdLevel, string> = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-700',
};

const CUISINE_CATEGORIES = ['中餐', '日料/韩料', '快餐', '轻食健康', '西餐', '烘焙甜品', '茶饮咖啡', '面食'] as const;
type CuisineCategory = typeof CUISINE_CATEGORIES[number];

function detectCuisine(type: string, name = ''): CuisineCategory {
  // Combine type + name so brand names (CoCo, 瑞幸, etc.) can be matched
  const t = (type + ' ' + name).toLowerCase();
  if (/日[式料]|寿司|拉面|天妇罗|鳗鱼|抹茶|韩[式料国]|烤肉|泡菜/.test(t)) return '日料/韩料';
  if (/咖啡|奶茶|饮品|饮料|茶[饮馆]|珍珠|果汁|柠檬茶|瑞幸|星巴克|coco|喜茶|奈雪|沪上阿姨|茶百道|古茗|益禾|一点点|贡茶/.test(t)) return '茶饮咖啡';
  if (/烘焙|甜品|蛋糕|面包|甜点|冰淇淋|冰激凌|甜食|糕点|饼干/.test(t)) return '烘焙甜品';
  if (/轻食|沙拉|健康|素食|蔬菜|水果/.test(t)) return '轻食健康';
  if (/西餐|汉堡|披萨|意[大式]|法[式餐]|牛排|三明治|薯条|炸鸡|肯德基|麦当劳|必胜客/.test(t)) return '西餐';
  if (/面[条馆食]|馄饨|饺[子馆]|粉[店馆]|河粉|米线|混沌|汤面|面食/.test(t)) return '面食';
  if (/快餐|小吃|便当|盒饭|自助[餐厅]|包子|煎饼|卤味/.test(t)) return '快餐';
  return '中餐';
}

const PRICE_BY_CUISINE: Record<CuisineCategory, [number, number]> = {
  '中餐':    [22, 50],
  '日料/韩料': [45, 95],
  '快餐':    [10, 22],
  '轻食健康': [25, 42],
  '西餐':    [40, 78],
  '烘焙甜品': [15, 32],
  '茶饮咖啡': [16, 36],
  '面食':    [12, 25],
};

function detectPrice(category: CuisineCategory, hash: number): number {
  const [min, max] = PRICE_BY_CUISINE[category];
  return min + (hash % (max - min + 1));
}


interface Props {
  onRestaurantsLoaded: (restaurants: POIRestaurant[]) => void;
  highlightId: string | null;
  onHighlightClear: () => void;
  onLocationChange?: (loc: [number, number]) => void;
  onRadiusChange?: (radiusM: number) => void;
  onAddressChange?: (addr: string) => void;
  externalRestaurant?: EnrichedRestaurant | null;
  onExternalRestaurantClose?: () => void;
  remindMins?: number;
}

export default function MapTab({
  onRestaurantsLoaded,
  highlightId,
  onHighlightClear,
  onLocationChange,
  onRadiusChange,
  onAddressChange: onAddressChangeProp,
  externalRestaurant,
  onExternalRestaurantClose,
  remindMins: remindMinsProp,
}: Props) {
  const [walkTime,           setWalkTime]           = useState(MAX_TIME['walk']); // default = max
  const [transportMode,      setTransportMode]      = useState<TransportMode>('walk');
  const [selectedId,         setSelectedId]         = useState<string | null>(null);
  const [activeFilters,      setActiveFilters]      = useState<string[]>([]);
  const [cuisineFilter,      setCuisineFilter]      = useState<string>('全部');
  const [diceResult,         setDiceResult]         = useState<string | null>(null);
  const [restaurants,        setRestaurants]        = useState<POIRestaurant[]>([]);
  const [isRelocated,        setIsRelocated]        = useState(false);
  const [currentAddress,     setCurrentAddress]     = useState('');
  const [searchText,         setSearchText]         = useState('');
  const [autoCompleteCenter, setAutoCompleteCenter] = useState<[number, number] | undefined>(undefined);
  /** Whether the schedule block is expanded or collapsed */
  const [scheduleExpanded,   setScheduleExpanded]   = useState(true);
  /** Pan-only coords for external POI spotlight (no refetch) */
  const [panToCoords,        setPanToCoords]        = useState<[number, number] | null>(null);

  // Tick every minute to keep smart-banner fresh
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

  // Pan map + highlight pin when an external restaurant is spotlighted (no refetch)
  useEffect(() => {
    if (externalRestaurant) {
      setSelectedId(externalRestaurant.id); // turn the pin orange
      setPanToCoords(null);
      const t = setTimeout(() => setPanToCoords([externalRestaurant.lng, externalRestaurant.lat]), 30);
      return () => clearTimeout(t);
    } else {
      setPanToCoords(null);
    }
  }, [externalRestaurant]);

  const toggleFilter = (label: string) =>
    setActiveFilters((prev) => prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]);

  // ── Enriched restaurants ─────────────────────────────────────────────────
  const enriched = useMemo<EnrichedRestaurant[]>(() =>
    restaurants.map((r) => {
      const hash = r.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const cuisineCategory = detectCuisine(r.type, r.name);
      return {
        ...r,
        walkMins: Math.max(1, Math.round(r.distance / speedMPerMin)),
        ...getDealFlags(r.id),
        ...getCrowdInfo(r.id),
        avgPrice: detectPrice(cuisineCategory, hash),
        cuisineCategory,
      };
    }),
    [restaurants, speedMPerMin],
  );

  const filtered = useMemo(() => {
    let result = enriched;
    if (activeFilters.length) {
      result = result.filter((r) => {
        if (activeFilters.includes('薅羊毛') && !r.studentDeal)         return false;
        if (activeFilters.includes('不踩雷') && r.rating < 4.5)         return false;
        if (activeFilters.includes('不用等') && r.crowdLevel === 'high') return false;
        return true;
      });
    }
    if (cuisineFilter !== '全部') {
      result = result.filter((r) => r.cuisineCategory === cuisineFilter);
    }
    return result;
  }, [enriched, activeFilters, cuisineFilter]);

  const selectedRestaurant = externalRestaurant ?? (enriched.find((r) => r.id === selectedId) ?? null);
  const distKm = Math.round(walkTime * speedMPerMin / 100) / 10;

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-background">

      {/* ── Map: 45% height on mobile, flex-1 on desktop ──────────────────── */}
      <section className="relative h-[42%] md:h-full md:flex-1 bg-muted overflow-hidden shrink-0">
        <AMapContainer
          walkTime={walkTime}
          speedMPerMin={speedMPerMin}
          initialCenter={initialCenter}
          externalCenter={autoCompleteCenter}
          panToCoords={panToCoords}
          visiblePOIs={(() => {
            const base = filtered as POIRestaurant[];
            if (externalRestaurant && !filtered.find(r => r.id === externalRestaurant.id)) {
              return [...base, { id: externalRestaurant.id, name: externalRestaurant.name, lng: externalRestaurant.lng, lat: externalRestaurant.lat, rating: externalRestaurant.rating, address: externalRestaurant.address, type: externalRestaurant.type, distance: externalRestaurant.distance }];
            }
            return base;
          })()}
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

      </section>

      {/* ── Feed: below map on mobile, fixed-width sidebar on desktop ─────── */}
      <aside className="flex-1 md:flex-none md:w-[340px] h-full bg-card border-t md:border-t-0 md:border-l border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── Schedule Section ────────────────────────────────────────── */}
          {CLASSES.length > 0 && (
            <div className="px-4 pt-3">
              {/* Collapsed view: location (campus or selected address) + expand arrow */}
              {!scheduleExpanded && (
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setScheduleExpanded(true)}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <MapPin size={11} className="text-[#B8860B] shrink-0" />
                    <span className="text-[12px] font-semibold text-foreground truncate">
                      {isRelocated && currentAddress ? currentAddress : (activeClass?.campus ?? '复旦·邯郸')}
                    </span>
                  </div>
                  <button className="ml-2 text-muted-foreground hover:text-foreground shrink-0">
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}

              {/* Expanded view: timeline only + collapse arrow in top-right */}
              {scheduleExpanded && (
                <div>
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => setScheduleExpanded(false)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                  <ScheduleTimeline
                    isRelocated={isRelocated}
                    remindMins={remindMinsProp ?? parseInt(localStorage.getItem('bb-remind-mins') || '30')}
                  />
                </div>
              )}
            </div>
          )}

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
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1 分钟</span>
              <span className="font-semibold text-[#B8860B]">≈ {distKm} km</span>
              <span>{MAX_TIME[transportMode]} 分钟</span>
            </div>
          </div>

          {/* Restaurant List */}
          <div className="px-4 pt-4 pb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              下课吃什么 · <span className="text-foreground">{filtered.length}</span> 家
            </p>

            {/* Filter Chips + Dice Button */}
            <div className="flex flex-wrap gap-2 mb-2">
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

            {/* Cuisine filter + dice row */}
            <div className="flex items-center gap-2 mb-3">
              <select
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
                className="border border-border rounded-xl px-3 py-2 text-xs font-semibold bg-card text-foreground focus:outline-none focus:border-[#FFD000] transition-colors cursor-pointer"
                style={{ minWidth: 0, flex: '1 1 0' }}
              >
                <option value="全部">🍴 菜系：全部</option>
                {CUISINE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 帮我选 — random picker */}
            {diceResult ? (
              <div className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-[#FFD000]/10 border border-[#FFD000]/40 rounded-2xl animate-pulse">
                <span className="text-base">🎲</span>
                <p className="text-xs font-bold text-foreground flex-1 truncate">为你选了：{diceResult}</p>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (filtered.length === 0) return;
                  const pick = filtered[Math.floor(Math.random() * filtered.length)];
                  setDiceResult(pick.name);
                  setTimeout(() => {
                    setSelectedId(pick.id);
                    setDiceResult(null);
                  }, 900);
                }}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-[#FFD000]/50 text-xs font-bold text-muted-foreground hover:bg-[#FFD000]/10 hover:border-[#FFD000] hover:text-foreground transition-all active:scale-[0.98]"
              >
                🎲 想不到吃什么？帮我选一家
              </button>
            )}
            <div className="space-y-2">
              {filtered.sort((a, b) => a.walkMins - b.walkMins).map((r, idx) => {
                const isSel = selectedId === r.id;
                return (
                  <button
                    key={r.id}
                    className={`w-full text-left p-3 rounded-2xl transition-all border ${
                      isSel ? 'bg-[#FFD000]/5 border-[#FFD000]/50 shadow-elevated' : 'bg-card border-border shadow-card hover:shadow-elevated'
                    }`}
                    onClick={() => setSelectedId((prev) => prev === r.id ? null : r.id)}
                  >
                    <div className="flex items-center gap-2">
                      {/* Rank badge */}
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                        idx === 0 ? 'bg-[#FFD000] text-black' :
                        idx === 1 ? 'bg-slate-200 text-slate-600' :
                        idx === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-muted text-muted-foreground'
                      }`}>{idx + 1}</div>

                      {/* Row1: name+学生价+⭐+¥; Row2: address+crowd */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-sm font-bold truncate leading-tight flex-1 min-w-0">{r.name}</p>
                          {r.studentDeal && (
                            <span className="text-[10px] font-bold bg-[#FFD000] text-black px-1.5 py-0.5 rounded shrink-0">学生价</span>
                          )}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star size={10} fill="#FFD000" className="text-[#FFD000]" />
                            <span className="text-[11px] font-bold">{r.rating.toFixed(1)}</span>
                            {r.avgPrice && (
                              <span className="text-[10px] text-muted-foreground font-semibold tabular-nums ml-0.5">¥{r.avgPrice}/人</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-[10px] text-muted-foreground truncate flex-1">{r.address}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${CROWD_CLASS[r.crowdLevel]}`}>
                            {CROWD_LABEL[r.crowdLevel]}
                          </span>
                        </div>
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

      <StoreDrawer
        restaurant={selectedRestaurant}
        onClose={() => {
          if (externalRestaurant) onExternalRestaurantClose?.();
          setSelectedId(null);
        }}
      />
    </div>
  );
}
