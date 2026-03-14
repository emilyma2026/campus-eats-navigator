import React from 'react';
import { Compass, MapPin, Users } from 'lucide-react';

export type Tab = 'discovery' | 'map' | 'community';

interface BottomNavProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'discovery', label: '发现', icon: Compass },
  { id: 'map', label: '地图决策', icon: MapPin },
  { id: 'community', label: '社区', icon: Users },
];

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="flex items-stretch border-t border-border bg-card shrink-0" style={{ height: 64 }}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              active ? 'text-[#FFD000]' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
            <span className="text-[11px] font-semibold leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
