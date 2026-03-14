import React, { useEffect, useRef, useCallback } from 'react';

export interface POIRestaurant {
  id: string;
  name: string;
  lng: number;
  lat: number;
  rating: number;
  address: string;
  type: string;
  distance: number; // meters
}

interface AMapContainerProps {
  walkTime: number;
  onPOIResults: (restaurants: POIRestaurant[]) => void;
  selectedId: string | null;
  onPinClick: (id: string) => void;
}

const USER_LOCATION: [number, number] = [121.511, 31.299]; // Fudan SoM, Lidasan Building
const WALK_SPEED_M_PER_MIN = 80;

export default function AMapContainer({ walkTime, onPOIResults, selectedId, onPinClick }: AMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const searchRef = useRef<any>(null);

  // Search nearby restaurants
  const searchNearby = useCallback((map: any, radius: number) => {
    if (!window.AMap || !searchRef.current) return;

    searchRef.current.searchNearBy('餐饮', USER_LOCATION, radius, (status: string, result: any) => {
      if (status === 'complete' && result.poiList) {
        const pois: POIRestaurant[] = result.poiList.pois
          .map((poi: any) => ({
            id: poi.id,
            name: poi.name,
            lng: poi.location.lng,
            lat: poi.location.lat,
            rating: poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : (3.5 + Math.random() * 1.5),
            address: poi.address || '',
            type: poi.type || '',
            distance: poi.distance ? parseInt(poi.distance) : 0,
          }))
          .filter((p: POIRestaurant) => p.distance <= radius);

        onPOIResults(pois);
        updateMarkers(map, pois);
      }
    });
  }, [onPOIResults]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.AMap) return;

    const map = new window.AMap.Map(mapRef.current, {
      zoom: 16,
      center: USER_LOCATION,
      mapStyle: 'amap://styles/light',
    });
    mapInstanceRef.current = map;

    // Add user location blue pulse marker
    const userMarker = new window.AMap.Marker({
      position: USER_LOCATION,
      content: `<div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(66,133,244,0.2);animation:pulse 2s ease-out infinite;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#4285F4;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
      </div>`,
      offset: new window.AMap.Pixel(-12, -12),
      zIndex: 200,
    });
    map.add(userMarker);
    userMarkerRef.current = userMarker;

    // Init PlaceSearch
    searchRef.current = new window.AMap.PlaceSearch({
      type: '餐饮服务',
      pageSize: 25,
      pageIndex: 1,
      extensions: 'all',
    });

    // Initial search
    const radius = walkTime * WALK_SPEED_M_PER_MIN;
    searchNearby(map, radius);

    return () => {
      mapInstanceRef.current?.destroy();
    };
  }, []);

  // Re-search when walkTime changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const radius = Math.max(walkTime * WALK_SPEED_M_PER_MIN, 100);
    searchNearby(mapInstanceRef.current, radius);
  }, [walkTime, searchNearby]);

  // Pan to selected
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedId) return;
    const marker = markersRef.current.find(m => m._poiId === selectedId);
    if (marker) {
      mapInstanceRef.current.panTo(marker.getPosition());
    }
  }, [selectedId]);

  const updateMarkers = (map: any, pois: POIRestaurant[]) => {
    // Remove old markers (keep user marker)
    markersRef.current.forEach(m => map.remove(m));
    markersRef.current = [];

    pois.forEach(r => {
      const isSelected = selectedId === r.id;
      const walkMins = Math.max(1, Math.round(r.distance / WALK_SPEED_M_PER_MIN));
      const marker = new window.AMap.Marker({
        position: [r.lng, r.lat],
        content: `<div style="
          background: ${isSelected ? '#FF7A00' : '#FFD000'};
          color: #000;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.2s;
        ">${walkMins}m</div>`,
        offset: new window.AMap.Pixel(-20, -10),
        zIndex: isSelected ? 150 : 100,
      });
      (marker as any)._poiId = r.id;
      marker.on('click', () => onPinClick(r.id));
      map.add(marker);
      markersRef.current.push(marker);
    });
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
      <div ref={mapRef} className="absolute inset-0" />
    </>
  );
}

declare global {
  interface Window {
    AMap: any;
  }
}
