import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, Tag, MapPin, ChevronRight } from 'lucide-react';
import MeituanLogo from './MeituanLogo';

// ── Scene definitions with AMap search keywords ──────────────────────────────
const SCENES = [
  { id: 'all',       label: '全部',       keyword: '餐厅'   },
  { id: 'solo',      label: '一人食 🍜',  keyword: '快餐'   },
  { id: 'group',     label: '聚餐 🥂',   keyword: '中餐厅' },
  { id: 'fast',      label: '快餐 ⚡',   keyword: '快餐店' },
  { id: 'latenight', label: '夜宵 🌙',   keyword: '烧烤'   },
  { id: 'cafe',      label: '咖啡甜品 ☕', keyword: '咖啡'  },
  { id: 'healthy',   label: '轻食 🥗',   keyword: '轻食'   },
];

/** Deduplicate and sanitise type tags from AMap's pipe/semicolon-separated string. */
function parseTypeTags(type: string): string[] {
  if (!type) return [];
  const blocked = new Set(['餐饮服务', '餐饮', '食品', '美食', '其他']);
  return [
    ...new Set(
      type
        .split(';')
        .flatMap((t) => t.split('|'))
        .map((t) => t.trim())
        .filter((t) => t && !blocked.has(t)),
    ),
  ].slice(0, 2);
}

const getDealFlags = (id: string) => {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { studentDeal: hash % 3 === 0, meituanVoucher: hash % 4 === 0 };
};

interface POIResult {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: number;
  type: string;
}

interface Props {
  center: [number, number];
  radiusM: number;
  onViewOnMap: (id: string) => void;
}

export default function DiscoveryTab({ center, radiusM, onViewOnMap }: Props) {
  const [activeScene, setActiveScene] = useState('all');
  const [results,     setResults]     = useState<POIResult[]>([]);
  const [loading,     setLoading]     = useState(false);

  const searchRef  = useRef<any>(null);
  const centerRef  = useRef(center);
  const radiusMRef = useRef(radiusM);

  useEffect(() => { centerRef.current  = center;  }, [center]);
  useEffect(() => { radiusMRef.current = radiusM; }, [radiusM]);

  // ── Fetch from AMap.PlaceSearch for the selected scene ─────────────────
  const fetchScene = useCallback((sceneId: string) => {
    if (!window.AMap) return;

    // Lazy-create PlaceSearch
    if (!searchRef.current) {
      searchRef.current = new window.AMap.PlaceSearch({
        type: '餐饮服务', pageSize: 25, pageIndex: 1, extensions: 'all',
      });
    }

    const scene      = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
    const fetchRadius = Math.max(radiusMRef.current, 500); // at least 500 m

    setLoading(true);

    searchRef.current.searchNearBy(
      scene.keyword,
      centerRef.current,
      fetchRadius,
      (status: string, result: any) => {
        setLoading(false);

        if (status === 'complete' && result.poiList?.pois?.length) {
          const pois: POIResult[] = result.poiList.pois.map((poi: any) => ({
            id:       poi.id,
            name:     poi.name,
            address:  poi.address || '',
            rating:   poi.biz_ext?.rating
              ? parseFloat(poi.biz_ext.rating)
              : 3.5 + Math.random() * 1.5,
            distance: poi.distance ? parseInt(poi.distance) : 0,
            type:     poi.type || '',
          }));

          // Sort: rating desc, then distance asc
          pois.sort((a, b) => {
            const rDiff = b.rating - a.rating;
            if (Math.abs(rDiff) > 0.2) return rDiff;
            return a.distance - b.distance;
          });

          setResults(pois);
        } else {
          setResults([]);
        }
      },
    );
  }, []);

  // Fetch whenever the active scene changes (also fires on mount)
  useEffect(() => {
    fetchScene(activeScene);
  }, [activeScene, fetchScene]);

  const enriched = useMemo(() =>
    results.map((r) => ({
      ...r,
      walkMins: Math.max(1, Math.round(r.distance / 75)),
      tags:     parseTypeTags(r.type),
      ...getDealFlags(r.id),
    })),
    [results],
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-card border-b border-border">
        <h1 className="text-xl font-extrabold tracking-tight mb-0.5">发现美食</h1>
        <p className="text-xs text-muted-foreground mb-3">复旦管院周边 · 按口碑排名</p>

        {/* Scene chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SCENES.map((s) => (
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

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                    <div className="h-3 bg-muted rounded mb-3 w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                  <div className="w-12 flex flex-col items-end gap-2 shrink-0">
                    <div className="h-4 bg-muted rounded w-10" />
                    <div className="h-3 bg-muted rounded w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && enriched.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={28} className="opacity-30" />
            </div>
            <p className="text-sm font-medium">附近暂无相关餐厅</p>
            <p className="text-xs mt-1 opacity-60">试试其他分类或切换地图位置</p>
          </div>
        )}

        {/* Results */}
        {!loading && enriched.map((r, i) => (
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

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} /> {r.walkMins}分钟步行
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
                  {r.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-secondary text-[10px] font-medium rounded-full text-muted-foreground">
                      {tag}
                    </span>
                  ))}
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
        ))}
      </div>
    </div>
  );
}
