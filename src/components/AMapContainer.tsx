import React, { useEffect, useRef } from 'react';

// TODO: INSERT AMAP_KEY HERE
const AMAP_KEY = '';

interface AMapContainerProps {
  restaurants: Array<{
    id: number;
    name: string;
    lng: number;
    lat: number;
    walkMins: number;
  }>;
  selectedId: number | null;
  onPinClick: (id: number) => void;
}

export default function AMapContainer({ restaurants, selectedId, onPinClick }: AMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!AMAP_KEY) return; // Skip if no key

    // Load AMap script
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
    script.async = true;
    script.onload = () => {
      if (!mapRef.current || !window.AMap) return;
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 15,
        center: [121.51, 31.30], // Wujiaochang, Shanghai
        mapStyle: 'amap://styles/light',
      });
      mapInstanceRef.current = map;
      updateMarkers(map);
    };
    document.head.appendChild(script);

    return () => {
      mapInstanceRef.current?.destroy();
      script.remove();
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers(mapInstanceRef.current);
    }
  }, [restaurants, selectedId]);

  const updateMarkers = (map: any) => {
    // Clear old markers
    markersRef.current.forEach(m => map.remove(m));
    markersRef.current = [];

    restaurants.forEach(r => {
      const marker = new window.AMap.Marker({
        position: [r.lng, r.lat],
        title: r.name,
        content: `<div style="
          background: ${selectedId === r.id ? '#FF7A00' : '#FFD000'};
          color: #000;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
          cursor: pointer;
        ">${r.walkMins}m</div>`,
      });
      marker.on('click', () => onPinClick(r.id));
      map.add(marker);
      markersRef.current.push(marker);
    });

    // Center on selected
    const sel = restaurants.find(r => r.id === selectedId);
    if (sel) {
      map.setCenter([sel.lng, sel.lat]);
    }
  };

  // If no API key, show placeholder
  if (!AMAP_KEY) {
    return null; // Parent will render placeholder
  }

  return <div ref={mapRef} className="absolute inset-0" />;
}

// Extend Window for AMap
declare global {
  interface Window {
    AMap: any;
  }
}
