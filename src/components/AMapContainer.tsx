import React, { useEffect, useRef, useCallback } from 'react';

export interface POIRestaurant {
  id: string;
  name: string;
  lng: number;
  lat: number;
  rating: number;
  address: string;
  type: string;
  distance: number;
}

interface AMapContainerProps {
  walkTime: number;
  speedMPerMin?: number;             // 80 walk | 250 bike | 500 drive
  initialCenter?: [number, number];
  externalCenter?: [number, number]; // pushed in from search bar / AutoComplete
  /** Sidebar-filtered POI list; markers always mirror this set */
  visiblePOIs?: POIRestaurant[];
  onPOIResults: (restaurants: POIRestaurant[]) => void;
  onAddressChange?: (addr: string) => void;
  onRadiusChange?: (radiusM: number) => void;
  selectedId: string | null;
  onPinClick: (id: string) => void;
  onLocationChange?: (loc: [number, number]) => void;
}

const FALLBACK_CENTER: [number, number] = [121.5132, 31.2995]; // Fudan Handan

/** Pre-load a larger radius so slider filtering is instant (no extra API calls). */
function maxFetchRadius(speed: number): number {
  if (speed <= 100)  return 3200;  // walk  ≤40 min @ 80 m/min  → 3.2 km
  if (speed <= 300)  return 7500;  // bike  ≤30 min @ 250 m/min → 7.5 km
  return 10000;                    // drive ≤20 min @ 500 m/min → 10 km
}

/** Compute ideal map zoom for a given radius so the circle fits the viewport. */
function radiusToZoom(radiusM: number): number {
  const zoom = Math.round(16 - Math.log2(Math.max(radiusM, 100) / 100));
  return Math.min(17, Math.max(11, zoom));
}

/** Remove restaurants within 50 m of each other (same-mall dedup). */
function dedupByProximity(pois: POIRestaurant[]): POIRestaurant[] {
  const kept: POIRestaurant[] = [];
  for (const poi of pois) {
    const tooClose = kept.some((k) => {
      const dx = (k.lng - poi.lng) * 111000 * Math.cos(poi.lat * Math.PI / 180);
      const dy = (k.lat - poi.lat) * 111000;
      return Math.sqrt(dx * dx + dy * dy) < 50;
    });
    if (!tooClose) kept.push(poi);
  }
  return kept;
}

export default function AMapContainer({
  walkTime,
  speedMPerMin = 80,
  initialCenter,
  externalCenter,
  visiblePOIs,
  onPOIResults,
  onAddressChange,
  onRadiusChange,
  selectedId,
  onPinClick,
  onLocationChange,
}: AMapContainerProps) {
  const mapRef            = useRef<HTMLDivElement>(null);
  const mapInstanceRef    = useRef<any>(null);
  const markersRef        = useRef<any[]>([]);
  const searchRef         = useRef<any>(null);
  const geocoderRef       = useRef<any>(null);
  const circleRef         = useRef<any>(null);
  const userPinRef        = useRef<any>(null);
  const moveDebounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Captured once at mount so map init effect is stable
  const mountCenter = useRef<[number, number]>(initialCenter ?? FALLBACK_CENTER);

  // ── Dynamic refs (break stale closures in callbacks) ────────────────────
  const searchCenterRef        = useRef<[number, number]>(mountCenter.current);
  const selectedIdRef          = useRef<string | null>(selectedId);
  const allPoisRef             = useRef<POIRestaurant[]>([]);
  /** Tracks the POI list currently rendered as markers (matches sidebar). */
  const currentMarkersRef      = useRef<POIRestaurant[]>([]);
  const onPinClickRef          = useRef(onPinClick);
  const onLocationChangeRef    = useRef(onLocationChange);
  const onPOIResultsRef        = useRef(onPOIResults);
  const onAddressChangeRef     = useRef(onAddressChange);
  const onRadiusChangeRef      = useRef(onRadiusChange);
  const walkTimeRef            = useRef(walkTime);
  const speedRef               = useRef(speedMPerMin);
  const lastAppliedExternalRef = useRef<string>(''); // loop-prevention for externalCenter

  // Keep refs in sync – ORDER MATTERS (must run before the reactive effects below)
  useEffect(() => { selectedIdRef.current      = selectedId;       }, [selectedId]);
  useEffect(() => { onPinClickRef.current       = onPinClick;       }, [onPinClick]);
  useEffect(() => { onLocationChangeRef.current = onLocationChange; }, [onLocationChange]);
  useEffect(() => { onPOIResultsRef.current     = onPOIResults;     }, [onPOIResults]);
  useEffect(() => { onAddressChangeRef.current  = onAddressChange;  }, [onAddressChange]);
  useEffect(() => { onRadiusChangeRef.current   = onRadiusChange;   }, [onRadiusChange]);
  useEffect(() => { walkTimeRef.current         = walkTime;         }, [walkTime]);
  useEffect(() => { speedRef.current            = speedMPerMin;     }, [speedMPerMin]);

  // ── Circle: create or update the radius ring ─────────────────────────────
  const updateCircle = useCallback((map: any, center: [number, number]) => {
    const radiusM = Math.max(walkTimeRef.current * speedRef.current, 100);
    onRadiusChangeRef.current?.(radiusM);
    if (circleRef.current) {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusM);
    } else {
      circleRef.current = new window.AMap.Circle({
        center,
        radius: radiusM,
        strokeColor:   '#FFD000',
        strokeOpacity: 0.7,
        strokeWeight:  2,
        fillColor:     '#FFD000',
        fillOpacity:   0.06,
        zIndex:        50,
      });
      map.add(circleRef.current);
    }
  }, []);

  // ── Geocode current center → emit human-readable address ─────────────────
  const geocodeCenter = useCallback((center: [number, number]) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.getAddress(center, (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        const raw: string = result.regeocode.formattedAddress || '';
        const addr = raw.replace(/^中国(上海市?)?/, '').replace(/^上海市?/, '');
        onAddressChangeRef.current?.(addr || raw);
      }
    });
  }, []);

  // ── Marker rendering — dot-only pins (no text label) ─────────────────────
  const updateMarkers = useCallback((map: any, pois: POIRestaurant[]) => {
    currentMarkersRef.current = pois;
    markersRef.current.forEach((m) => map.remove(m));
    markersRef.current = [];

    pois.forEach((r) => {
      const isSel = selectedIdRef.current === r.id;
      const marker = new window.AMap.Marker({
        position: [r.lng, r.lat],
        content: `<div style="
          background:${isSel ? '#FF7A00' : '#FFD000'};
          width:${isSel ? '14px' : '10px'};
          height:${isSel ? '14px' : '10px'};
          border-radius:50%;
          border:${isSel ? '2.5px solid white' : '2px solid rgba(255,255,255,0.85)'};
          box-shadow:0 2px 8px rgba(0,0,0,0.22);
          cursor:pointer;
          animation:bb-marker-in 0.18s ease;
          transition:transform 0.15s;
        "></div>`,
        offset: new window.AMap.Pixel(isSel ? -7 : -5, isSel ? -7 : -5),
        zIndex: isSel ? 150 : 100,
      });
      (marker as any)._poiId = r.id;
      marker.on('click', () => onPinClickRef.current(r.id));
      map.add(marker);
      markersRef.current.push(marker);
    });
  }, []);

  // ── LOCAL filter: instant, reads cached allPoisRef (no API call) ─────────
  // Only updates circle + emits filtered list to sidebar; markers handled by visiblePOIs effect.
  const applyFilter = useCallback(() => {
    if (!mapInstanceRef.current || allPoisRef.current.length === 0) return;
    const radius   = Math.max(walkTimeRef.current * speedRef.current, 100);
    const filtered = allPoisRef.current.filter((p) => p.distance <= radius);
    onPOIResultsRef.current(filtered);
    updateCircle(mapInstanceRef.current, searchCenterRef.current);
  }, [updateCircle]);

  // ── POI parser helper ─────────────────────────────────────────────────────
  const parsePOIs = useCallback((pois: any[], seen: Set<string>): POIRestaurant[] =>
    pois
      .filter((poi: any) => {
        // Stage 1 crash fix: skip POIs where location or either coordinate is null/undefined/falsy
        if (!poi.location || poi.location.lng == null || poi.location.lat == null) return false;
        if (seen.has(poi.id)) return false;
        seen.add(poi.id);
        return true;
      })
      .map((poi: any) => ({
        id:       poi.id,
        name:     poi.name,
        lng:      poi.location.lng,
        lat:      poi.location.lat,
        rating:   poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : 3.5 + Math.random() * 1.5,
        address:  poi.address || '',
        type:     poi.type || '',
        distance: poi.distance ? parseInt(poi.distance) : 0,
      })),
  []);

  // ── API FETCH: multi-center strategy for geographic spread ──────────────
  // 5 parallel searches (original + 4 offsets ~1.5 km away) give 40+ restaurants
  // distributed across the full 3.2 km walk radius instead of clustering at
  // the nearest commercial street.
  const fetchFromAPI = useCallback((map: any, center: [number, number]) => {
    if (!window.AMap || !searchRef.current) return;
    const fetchRadius = maxFetchRadius(speedRef.current);
    const seen        = new Set<string>();

    /** Haversine distance (m) from a POI back to the original search center */
    const distFrom = (lng: number, lat: number): number => {
      const toRad = (d: number) => d * Math.PI / 180;
      const R = 6371000;
      const dLat = toRad(lat - center[1]);
      const dLng = toRad(lng - center[0]);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(center[1])) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    // 8 offset searches + 1 main: outer ring (~2 km) for 20-40 min coverage,
    // mid ring (~1 km) to fill the 10-20 min gap.
    const oFar = { lat: 0.018, lng: 0.022 }; // ~2.0 km at Shanghai latitude
    const oMid = { lat: 0.009, lng: 0.011 }; // ~1.0 km
    const configs: Array<{ c: [number, number]; r: number; ps: number }> = [
      { c: center,                                                    r: fetchRadius, ps: 50 }, // main
      { c: [center[0],            center[1] + oFar.lat],             r: 1400,        ps: 25 }, // N outer
      { c: [center[0] + oFar.lng, center[1]            ],            r: 1400,        ps: 25 }, // E outer
      { c: [center[0],            center[1] - oFar.lat],             r: 1400,        ps: 25 }, // S outer
      { c: [center[0] - oFar.lng, center[1]            ],            r: 1400,        ps: 25 }, // W outer
      { c: [center[0],            center[1] + oMid.lat],             r: 1000,        ps: 15 }, // N mid
      { c: [center[0] + oMid.lng, center[1]            ],            r: 1000,        ps: 15 }, // E mid
      { c: [center[0],            center[1] - oMid.lat],             r: 1000,        ps: 15 }, // S mid
      { c: [center[0] - oMid.lng, center[1]            ],            r: 1000,        ps: 15 }, // W mid
    ];

    let accumulated: POIRestaurant[] = [];
    let pending = configs.length;

    const onDone = () => {
      if (--pending > 0) return;
      // Sort by distance from original center and dedup by proximity
      accumulated.sort((a, b) => a.distance - b.distance);
      accumulated = dedupByProximity(accumulated);
      allPoisRef.current = accumulated;
      const radius   = Math.max(walkTimeRef.current * speedRef.current, 100);
      const filtered = accumulated.filter((p) => p.distance <= radius);
      onPOIResultsRef.current(filtered);
      updateCircle(map, center);
      geocodeCenter(center);
    };

    configs.forEach(({ c, r, ps }, i) => {
      // Reuse the pre-created search instance for the main fetch; new instance for offsets
      const s = i === 0
        ? searchRef.current
        : new window.AMap.PlaceSearch({ type: '餐饮服务', pageSize: ps, extensions: 'all', autoFitView: false });

      s.searchNearBy('餐饮', c, r, (status: string, result: any) => {
        if (status === 'complete' && result.poiList) {
          parsePOIs(result.poiList.pois, seen).forEach((poi) => {
            poi.distance = distFrom(poi.lng, poi.lat); // recalc from original center
            accumulated.push(poi);
          });
        }
        onDone();
      });
    });
  }, [updateCircle, geocodeCenter, parsePOIs]);

  // ── Reactive: walkTime slider → instant LOCAL filter + update circle + zoom ──
  useEffect(() => {
    applyFilter();
    // Auto-zoom: smoothly zoom map to match the walk radius
    if (mapInstanceRef.current) {
      const radiusM = Math.max(walkTime * speedMPerMin, 100);
      mapInstanceRef.current.setZoom(radiusToZoom(radiusM), true);
    }
  }, [walkTime, speedMPerMin, applyFilter]);

  // ── Reactive: transport mode change → re-fetch ───────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    fetchFromAPI(mapInstanceRef.current, searchCenterRef.current);
  }, [speedMPerMin, fetchFromAPI]);

  // ── Reactive: externalCenter prop (from search bar AutoComplete) ──────────
  useEffect(() => {
    if (!externalCenter || !mapInstanceRef.current) return;
    const key = externalCenter.join(',');
    if (key === lastAppliedExternalRef.current) return; // already applied – skip
    lastAppliedExternalRef.current = key;
    searchCenterRef.current = externalCenter;
    placeUserPin(mapInstanceRef.current, externalCenter);
    mapInstanceRef.current.panTo(externalCenter);
    fetchFromAPI(mapInstanceRef.current, externalCenter);
    onLocationChangeRef.current?.(externalCenter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCenter]);

  // ── Reactive: visiblePOIs → keep map markers in sync with sidebar list ────
  useEffect(() => {
    if (!mapInstanceRef.current || !visiblePOIs) return;
    updateMarkers(mapInstanceRef.current, visiblePOIs);
  }, [visiblePOIs, updateMarkers]);

  // ── Re-render markers to update selected-state highlight + pan ───────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const pois = currentMarkersRef.current;
    if (pois.length > 0) {
      updateMarkers(mapInstanceRef.current, pois);
    }
    if (selectedId) {
      const m = markersRef.current.find((mk) => mk._poiId === selectedId);
      if (m) mapInstanceRef.current.panTo(m.getPosition());
    }
  }, [selectedId, updateMarkers]);

  // ── User anchor pin with ripple ──────────────────────────────────────────
  const placeUserPin = useCallback((map: any, loc: [number, number]) => {
    if (userPinRef.current) { map.remove(userPinRef.current); userPinRef.current = null; }

    const pin = new window.AMap.Marker({
      position: loc,
      content: `<div class="bb-anchor" style="position:relative;width:36px;height:36px;cursor:move;">
        <div class="bb-ring bb-r1"></div>
        <div class="bb-ring bb-r2"></div>
        <div class="bb-ring bb-r3"></div>
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:18px;height:18px;border-radius:50%;background:#FFD000;
          border:3px solid #fff;box-shadow:0 0 0 2px #FFD000,0 3px 12px rgba(255,208,0,0.55);z-index:2;
        "></div>
      </div>`,
      offset: new window.AMap.Pixel(-18, -18),
      zIndex: 300,
      draggable: true,
    });

    pin.on('dragend', (e: any) => {
      const nl: [number, number] = [e.lnglat.lng, e.lnglat.lat];
      searchCenterRef.current = nl;
      lastAppliedExternalRef.current = nl.join(',');
      placeUserPin(map, nl);
      map.panTo(nl);
      fetchFromAPI(map, nl);
      onLocationChangeRef.current?.(nl);
    });

    map.add(pin);
    userPinRef.current = pin;
  }, [fetchFromAPI]);

  // ── Map initialisation (runs once on mount) ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !window.AMap) return;
    const center = mountCenter.current;

    const map = new window.AMap.Map(mapRef.current, {
      zoom: 15, center, mapStyle: 'amap://styles/light',
      // Remove POI address labels from the map surface for a cleaner look
      features: ['bg', 'road', 'building'],
    });
    mapInstanceRef.current = map;

    // Campus anchor – blue pulsing dot at initial campus location
    map.add(new window.AMap.Marker({
      position: center,
      content: `<div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(66,133,244,0.2);animation:bb-pulse 2s ease-out infinite;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#4285F4;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
      </div>`,
      offset: new window.AMap.Pixel(-12, -12),
      zIndex: 200,
    }));

    // Page 1 with pageSize 50; page 2 is fetched dynamically in fetchFromAPI
    searchRef.current = new window.AMap.PlaceSearch({
      type: '餐饮服务', pageSize: 50, pageIndex: 1, extensions: 'all', autoFitView: false,
    });

    // Geocoder – use pre-loaded plugin or lazy-load fallback
    if (window.AMap.Geocoder) {
      geocoderRef.current = new window.AMap.Geocoder({ radius: 500 });
    } else {
      window.AMap.plugin(['AMap.Geocoder'], () => {
        geocoderRef.current = new window.AMap.Geocoder({ radius: 500 });
      });
    }

    fetchFromAPI(map, center);

    // Map click → relocate search anchor
    map.on('click', (e: any) => {
      const nl: [number, number] = [e.lnglat.lng, e.lnglat.lat];
      searchCenterRef.current = nl;
      lastAppliedExternalRef.current = nl.join(',');
      placeUserPin(map, nl);
      map.panTo(nl);
      fetchFromAPI(map, nl);
      onLocationChangeRef.current?.(nl);
    });

    // Map pan → update address label (debounced, no API search call)
    map.on('moveend', () => {
      if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
      moveDebounceRef.current = setTimeout(() => {
        if (!geocoderRef.current || !mapInstanceRef.current) return;
        const c = mapInstanceRef.current.getCenter();
        geocoderRef.current.getAddress(
          [c.lng, c.lat],
          (status: string, result: any) => {
            if (status === 'complete' && result.regeocode) {
              const raw: string = result.regeocode.formattedAddress || '';
              const addr = raw.replace(/^中国(上海市?)?/, '').replace(/^上海市?/, '');
              onAddressChangeRef.current?.(addr || raw);
            }
          },
        );
      }, 800);
    });

    return () => {
      if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
      mapInstanceRef.current?.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        @keyframes bb-pulse     { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.5);opacity:0} }
        @keyframes bb-ripple    { 0%{transform:translate(-50%,-50%) scale(1);opacity:.75} 100%{transform:translate(-50%,-50%) scale(4.5);opacity:0} }
        @keyframes bb-marker-in { from{opacity:0;transform:scale(0.45)} to{opacity:1;transform:scale(1)} }
        .bb-ring { position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;border:2px solid #FFD000;animation:bb-ripple 2.2s ease-out infinite;pointer-events:none; }
        .bb-r2 { animation-delay:.55s }
        .bb-r3 { animation-delay:1.1s  }
        .amap-sug-result { z-index:9999 !important; }
      `}</style>
      <div ref={mapRef} className="absolute inset-0" />
    </>
  );
}

declare global { interface Window { AMap: any } }
