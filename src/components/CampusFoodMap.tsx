import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Star, Coffee, Tag, Zap, ThumbsUp, Utensils, X, ExternalLink, MapPinned } from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  left: number;
  top: number;
  rating: number;
  dish: string;
  price: number;
  walkMins: number;
  reviews: string;
  studentDeal?: boolean;
}

const RESTAURANTS: Restaurant[] = [
  { id: 1, name: "Guanghua Canteen", left: 35, top: 30, rating: 4.8, dish: "Pork Ribs Rice", price: 18, walkMins: 5, reviews: "1.2k", studentDeal: true },
  { id: 2, name: "Campus Dumpling", left: 50, top: 42, rating: 4.7, dish: "Soup Dumplings", price: 20, walkMins: 7, reviews: "3.2k", studentDeal: true },
  { id: 3, name: "North Gate Grill", left: 42, top: 20, rating: 4.7, dish: "Lamb Skewers", price: 22, walkMins: 8, reviews: "2.1k" },
  { id: 4, name: "Knowledge Café", left: 62, top: 35, rating: 4.9, dish: "Matcha Latte Set", price: 28, walkMins: 10, reviews: "1.5k" },
  { id: 5, name: "Daxue Rd. Bistro", left: 55, top: 55, rating: 4.6, dish: "Hand-pulled Noodles", price: 15, walkMins: 12, reviews: "890", studentDeal: true },
  { id: 6, name: "SUFE North Hall", left: 70, top: 50, rating: 4.5, dish: "Scallion Oil Noodles", price: 12, walkMins: 15, reviews: "670" },
  { id: 7, name: "Tongji South Wok", left: 28, top: 60, rating: 4.4, dish: "Mapo Tofu Rice", price: 16, walkMins: 18, reviews: "430", studentDeal: true },
  { id: 8, name: "Wujiaochang BBQ", left: 58, top: 68, rating: 4.3, dish: "Grilled Fish", price: 35, walkMins: 20, reviews: "560" },
];

const SCHEDULE = [
  { time: '9:00', name: 'Econometrics', highlight: false },
  { time: '11:00', name: 'Marketing', highlight: false },
  { time: '3:50', name: 'Corporate Finance', highlight: true },
];

const FILTERS = [
  { label: 'Student Deal', icon: Tag },
  { label: 'Discount', icon: Zap },
  { label: 'Top Rated', icon: ThumbsUp },
  { label: 'Quick Meal', icon: Utensils },
  { label: 'Coffee', icon: Coffee },
];

export default function CampusFoodMap() {
  const [walkTime, setWalkTime] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (label: string) => {
    setActiveFilters(prev => prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]);
  };

  const filtered = useMemo(() => {
    return RESTAURANTS.filter(r => r.walkMins <= walkTime);
  }, [walkTime]);

  const selectedRestaurant = RESTAURANTS.find(r => r.id === selectedId) || null;

  const handlePinClick = (id: number) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* MAP AREA */}
      <section className="relative flex-[7] bg-muted overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Fake roads */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
          <line x1="20%" y1="0" x2="45%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="4" />
          <line x1="60%" y1="0" x2="35%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="4" />
          <line x1="0" y1="40%" x2="100%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeWidth="4" />
          <line x1="0" y1="70%" x2="100%" y2="65%" stroke="hsl(var(--muted-foreground))" strokeWidth="3" />
          <line x1="10%" y1="20%" x2="80%" y2="25%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        </svg>

        {/* Map ready label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/15 text-xs font-semibold tracking-[0.4em] uppercase select-none pointer-events-none">
          Wujiaochang · Shanghai
        </div>

        {/* Pins - only filtered */}
        {filtered.map((r) => {
          const isSelected = selectedId === r.id;
          return (
            <motion.button
              key={r.id}
              onClick={() => handlePinClick(r.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute z-10 flex flex-col items-center cursor-pointer"
              style={{ left: `${r.left}%`, top: `${r.top}%`, transform: 'translate(-50%, -100%)' }}
            >
              {/* Pin body */}
              <div className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-elevated transition-all duration-200 ${
                isSelected
                  ? 'bg-accent text-accent-foreground scale-110'
                  : 'bg-card text-foreground hover:shadow-lg'
              }`}>
                <MapPin size={14} className={isSelected ? 'text-accent-foreground' : 'text-accent'} fill="currentColor" fillOpacity={0.2} />
                <span className="text-xs font-bold whitespace-nowrap">{r.walkMins}m</span>
              </div>
              {/* Pin tail */}
              <div className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${
                isSelected ? 'border-t-accent' : 'border-t-card'
              }`} />
              {/* Name label on hover/select */}
              {isSelected && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-[10px] font-semibold text-foreground bg-card px-2 py-0.5 rounded shadow-card whitespace-nowrap"
                >
                  {r.name}
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {/* Floating info card */}
        <AnimatePresence>
          {selectedRestaurant && filtered.find(r => r.id === selectedRestaurant.id) && (
            <motion.div
              key="float"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute z-20 bg-card rounded-2xl shadow-elevated p-4 w-64"
              style={{
                left: `${Math.min(Math.max(selectedRestaurant.left, 20), 65)}%`,
                top: `${Math.min(selectedRestaurant.top + 10, 75)}%`,
              }}
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
                  <Star size={12} fill="currentColor" /> {selectedRestaurant.rating}
                </div>
                <span className="text-muted-foreground text-xs">({selectedRestaurant.reviews})</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Popular: {selectedRestaurant.dish}</p>
              {selectedRestaurant.studentDeal && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-primary/20 text-primary-foreground text-[10px] font-bold rounded-full">
                  <Tag size={10} /> Student Deal
                </span>
              )}
              <button className="w-full mt-3 bg-accent text-accent-foreground text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                <ExternalLink size={12} /> Order on Meituan
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map attribution */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-medium">
          <MapPinned size={10} /> UniEat Map · Wujiaochang
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
              <h1 className="text-lg font-extrabold tracking-tight">UniEat</h1>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="px-5 pt-4">
            <div className="bg-secondary rounded-2xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today</p>
              <div className="mt-3 space-y-2">
                {SCHEDULE.map((cls, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      cls.highlight
                        ? 'bg-accent/10 border border-accent/20'
                        : ''
                    }`}
                  >
                    <span className={`text-sm font-bold tabular-nums ${cls.highlight ? 'text-accent' : 'text-muted-foreground'}`}>
                      {cls.time}
                    </span>
                    <span className={`text-sm font-medium ${cls.highlight ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cls.name}
                    </span>
                    {cls.highlight && (
                      <span className="ml-auto flex items-center gap-1 text-accent text-[10px] font-bold">
                        <Clock size={10} /> NOW
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span className="flex items-center gap-1"><Clock size={12} /> Class ends in 10 minutes</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> SoM Building</span>
              </div>
            </div>
          </div>

          {/* Walk Time Slider */}
          <div className="px-5 pt-4">
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-semibold">Walk Time</label>
              <span className="text-sm font-bold text-accent tabular-nums">{walkTime} min</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={walkTime}
              onChange={(e) => { setWalkTime(parseInt(e.target.value)); setSelectedId(null); }}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0 min</span>
              <span>20 min</span>
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
              Recommended Nearby · {filtered.length}
            </p>
            <div className="space-y-2.5">
              {filtered
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
                              <Star size={12} fill="currentColor" /> {r.rating}
                            </div>
                            <span className="text-xs text-muted-foreground">¥{r.price} / person</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Popular: {r.dish}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                          <span className="text-xs font-bold text-accent flex items-center gap-1">
                            <Clock size={11} /> {r.walkMins} min
                          </span>
                          {r.studentDeal && (
                            <span className="text-[10px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded">
                              Deal
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No restaurants within {walkTime} min walk</p>
                  <p className="text-xs mt-1">Try increasing the walk time</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
