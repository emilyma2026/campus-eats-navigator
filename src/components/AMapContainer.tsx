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
  speedMPerMin?: number;          // 80 walk | 240 bike | 450 drive
  initialCenter?: [number, number];
  onPOIResults: (restaurants: POIRestaurant[]) => void;
  selectedId: string | null;
  onPinClick: (id: string) => void;
  onLocationChange?: (loc: [number, number]) => void;
}

const FALLBACK_CENTER: [number, number] = [121.5132, 31.2995]; // Fudan Handan

/** Pre-load a larger radius so slider filtering is instant (no extra API calls). */
function maxFetchRadius(speed: number): number {
  if (speed <= 80)  return 2000; // walk  ~25 min
  if (speed <= 240) return 4800; // bike  ~20 min
  return 9000;                   // drive ~20 min
}

export default function AMapContainer({
  walkTime,
  speedMPerMin = 80,
  initialCenter,
  onPOIResults,
  selectedId,
  onPinClick,
  onLocationChange,
}: AMapContainerProps) {
  const mapRef          = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<any>(null);
  const markersRef      = useRef<any[]>([]);
  const searchRef       = useRef<any>(null);
  const userPinRef      = useRef<any>(null);

  // Captured once at mount so map init effect is stable
  const mountCenter = useRef<[number, number]>(initialCenter ?? FALLBACK_CENTER);

  // ── Dynamic refs (break stale closures in callbacks) ────────────────────
  const searchCenterRef     = useRef<[number, number]>(mountCenter.current);
  const selectedIdRef       = useRef<string | null>(selectedId);
  const allPoisRef          = useRef<POIRestaurant[]>([]);  // ALL results from last API fetch
  const lastFilteredRef     = useRef<POIRestaurant[]>([]);  // currently displayed (after filter)
  const onPinClickRef       = useRef(onPinClick);
  const onLocationChangeRef = useRef(onLocationChange);
  const onPOIResultsRef     = useRef(onPOIResults);
  const walkTimeRef         = useRef(walkTime);
  const speedRef            = useRef(speedMPerMin);

  // Keep refs in sync – ORDER MATTERS (must run before the reactive effects below)
  useEffect(() => { selectedIdRef.current      = selectedId;       }, [selectedId]);
  useEffect(() => { onPinClickRef.current       = onPinClick;       }, [onPinClick]);
  useEffect(() => { onLocationChangeRef.current = onLocationChange; }, [onLocationChange]);
  useEffect(() => { onPOIResultsRef.current     = onPOIResults;     }, [onPOIResults]);
  useEffect(() => { walkTimeRef.current         = walkTime;         }, [walkTime]);
  useEffect(() => { speedRef.current            = speedMPerMin;     }, [speedMPerMin]);

  // ── Marker rendering ─────────────────────────────────────────────────────
  const updateMarkers = useCallback((map: any, pois: POIRestaurant[]) => {
    lastFilteredRef.current = pois;
    markersRef.current.forEach((m) => map.remove(m));
    markersRef.current = [];

    pois.forEach((r) => {
      const isSel = selectedIdRef.current === r.id;
      const mins  = Math.max(1, Math.round(r.distance / speedRef.current));
      const marker = new window.AMap.Marker({
        position: [r.lng, r.lat],
        content: `<div style="
          background:${isSel ? '#FF7A00' : '#FFD000'};
          color:#000; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:700;
          box-shadow:0 2px 8px rgba(0,0,0,0.18); white-space:nowrap; cursor:pointer;
          transform:${isSel ? 'scale(1.25)' : 'scale(1)'};
          border:${isSel ? '2px solid white' : '1.5px solid rgba(0,0,0,0.1)'};
          animation:bb-marker-in 0.18s ease;
        ">${mins}m</div>`,
        offset: new window.AMap.Pixel(-20, -10),
        zIndex: isSel ? 150 : 100,
      });
      (marker as any)._poiId = r.id;
      marker.on('click', () => onPinClickRef.current(r.id));
      map.add(marker);
      markersRef.current.push(marker);
    });
  }, []);

  // ── LOCAL filter: instant, reads cached allPoisRef (no API call) ─────────
  const applyFilter = useCallback(() => {
    if (!mapInstanceRef.current || allPoisRef.current.length === 0) return;
    const radius   = Math.max(walkTimeRef.current * speedRef.current, 100);
    const filtered = allPoisRef.current.filter((p) => p.distance <= radius);
    onPOIResultsRef.current(filtered);
    updateMarkers(mapInstanceRef.current, filtered);
  }, [updateMarkers]);

  // ── API FETCH: called on center change or transport mode change ───────────
  const fetchFromAPI = useCallback((map: any, center: [number, number]) => {
    if (!window.AMap || !searchRef.current) return;
    const fetchRadius = maxFetchRadius(speedRef.current);

    searchRef.current.searchNearBy('餐饮', center, fetchRadius, (status: string, result: any) => {
      if (status === 'complete' && result.poiList) {
        const pois: POIRestaurant[] = result.poiList.pois
          .map((poi: any) => ({
            id:       poi.id,
            name:     poi.name,
            lng:      poi.location.lng,
            lat:      poi.location.lat,
            rating:   poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : 3.5 + Math.random() * 1.5,
            address:  poi.address || '',
            type:     poi.type || '',
            distance: poi.distance ? parseInt(poi.distance) : 0,
          }));

        allPoisRef.current = pois; // cache the full unfiltered list

        // Apply current walk-time radius immediately after fetch
        const radius   = Math.max(walkTimeRef.current * speedRef.current, 100);
        const filtered = pois.filter((p) => p.distance <= radius);
        onPOIResultsRef.current(filtered);
        updateMarkers(map, filtered);
      }
    });
  }, [updateMarkers]);

  // ── Reactive: walkTime slider → instant LOCAL filter, NO new API call ─────
  useEffect(() => {
    applyFilter();
  }, [walkTime, applyFilter]);

  // ── Reactive: transport mode change → re-fetch (different radius budget) ──
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    fetchFromAPI(mapInstanceRef.current, searchCenterRef.current);
  }, [speedMPerMin, fetchFromAPI]);

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
      zoom: 16, center, mapStyle: 'amap://styles/light',
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

    searchRef.current = new window.AMap.PlaceSearch({
      type: '餐饮服务', pageSize: 25, pageIndex: 1, extensions: 'all',
    });

    fetchFromAPI(map, center);

    // Map click → relocate search anchor
    map.on('click', (e: any) => {
      const nl: [number, number] = [e.lnglat.lng, e.lnglat.lat];
      searchCenterRef.current = nl;
      placeUserPin(map, nl);
      map.panTo(nl);
      fetchFromAPI(map, nl);
      onLocationChangeRef.current?.(nl);
    });

    return () => { mapInstanceRef.current?.destroy(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-render markers + pan to selected pin ───────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (lastFilteredRef.current.length > 0) {
      updateMarkers(mapInstanceRef.current, lastFilteredRef.current);
    }
    if (selectedId) {
      const m = markersRef.current.find((mk) => mk._poiId === selectedId);
      if (m) mapInstanceRef.current.panTo(m.getPosition());
    }
  }, [selectedId, updateMarkers]);

  return (
    <>
      <style>{`
        @keyframes bb-pulse     { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.5);opacity:0} }
        @keyframes bb-ripple    { 0%{transform:translate(-50%,-50%) scale(1);opacity:.75} 100%{transform:translate(-50%,-50%) scale(4.5);opacity:0} }
        @keyframes bb-marker-in { from{opacity:0;transform:scale(0.45)} to{opacity:1;transform:scale(1)} }
        .bb-ring { position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;border:2px solid #FFD000;animation:bb-ripple 2.2s ease-out infinite;pointer-events:none; }
        .bb-r2 { animation-delay:.55s }
        .bb-r3 { animation-delay:1.1s  }
      `}</style>
      <div ref={mapRef} className="absolute inset-0" />
    </>
  );
}

declare global { interface Window { AMap: any } }
