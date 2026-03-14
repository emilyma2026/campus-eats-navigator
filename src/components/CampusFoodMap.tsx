import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Star, Users, GraduationCap, ChevronDown, Ticket, Truck, ThumbsUp, Tag } from 'lucide-react';

interface Merchant {
  id: number;
  name: string;
  left: number;
  top: number;
  rating: number;
  dish: string;
  price: string;
  walkMins: number;
  school: string;
  reviews: string;
}

const MERCHANTS: Merchant[] = [
  { id: 1, name: "Guanghua Canteen", left: 38, top: 32, rating: 4.8, dish: "Pork Ribs Rice", price: "¥18", walkMins: 5, school: "Fudan", reviews: "1.2k" },
  { id: 2, name: "Daxue Rd. Bistro", left: 52, top: 44, rating: 4.6, dish: "Hand-pulled Noodles", price: "¥15", walkMins: 12, school: "Fudan", reviews: "890" },
  { id: 3, name: "North Gate Grill", left: 44, top: 22, rating: 4.7, dish: "Lamb Skewers", price: "¥22", walkMins: 8, school: "Fudan", reviews: "2.1k" },
  { id: 4, name: "SUFE North Hall", left: 68, top: 55, rating: 4.5, dish: "Scallion Oil Noodles", price: "¥12", walkMins: 15, school: "SUFE", reviews: "670" },
  { id: 5, name: "Knowledge Café", left: 60, top: 38, rating: 4.9, dish: "Matcha Latte Set", price: "¥28", walkMins: 10, school: "SUFE", reviews: "1.5k" },
  { id: 6, name: "Tongji South Wok", left: 28, top: 62, rating: 4.4, dish: "Mapo Tofu Rice", price: "¥16", walkMins: 20, school: "Tongji", reviews: "430" },
  { id: 7, name: "Campus Dumpling", left: 48, top: 58, rating: 4.7, dish: "Soup Dumplings", price: "¥20", walkMins: 7, school: "Fudan", reviews: "3.2k" },
  { id: 8, name: "Wujiaochang BBQ", left: 55, top: 70, rating: 4.3, dish: "Grilled Fish", price: "¥35", walkMins: 18, school: "SUFE", reviews: "560" },
];

const SCHOOLS = ['Fudan', 'SUFE', 'Tongji'] as const;

const FILTERS = [
  { label: 'Vouchers', icon: Ticket },
  { label: 'Free Delivery', icon: Truck },
  { label: 'Top Rated', icon: ThumbsUp },
  { label: 'Student Deal', icon: Tag },
];

export default function CampusFoodMap() {
  const [selectedSchool, setSelectedSchool] = useState<string>('Fudan');
  const [walkTime, setWalkTime] = useState(20);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (label: string) => {
    setActiveFilters(prev => prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* MAP AREA */}
      <section className="relative flex-1 bg-muted overflow-hidden">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Fake road lines for map feel */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <line x1="20%" y1="0" x2="45%" y2="100%" stroke="currentColor" strokeWidth="3" />
          <line x1="60%" y1="0" x2="35%" y2="100%" stroke="currentColor" strokeWidth="3" />
          <line x1="0" y1="40%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="3" />
          <line x1="0" y1="70%" x2="100%" y2="65%" stroke="currentColor" strokeWidth="2" />
        </svg>

        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/20 text-sm font-semibold tracking-[0.3em] uppercase select-none pointer-events-none">
          Wujiaochang · Shanghai
        </div>

        {/* Map Pins */}
        {MERCHANTS.map((m) => {
          const inRange = m.walkMins <= walkTime;
          const isSelected = selectedMerchant?.id === m.id;

          return (
            <motion.button
              key={m.id}
              onClick={() => setSelectedMerchant(m)}
              animate={
                inRange
                  ? { scale: [1, 1.15, 1] }
                  : { scale: 1, opacity: 0.5 }
              }
              transition={{
                repeat: inRange ? Infinity : 0,
                duration: 2.5,
                ease: 'easeInOut',
              }}
              className={`absolute z-10 flex flex-col items-center group cursor-pointer`}
              style={{ left: `${m.left}%`, top: `${m.top}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className={`p-2.5 rounded-2xl shadow-elevated transition-all duration-200
                  ${isSelected ? 'bg-primary ring-4 ring-primary/20' : 'bg-card'}
                  ${inRange ? '' : 'grayscale'}
                `}
              >
                <MapPin
                  className={`w-5 h-5 ${isSelected ? 'text-primary-foreground' : inRange ? 'text-primary' : 'text-muted-foreground'}`}
                  fill="currentColor"
                  fillOpacity={0.15}
                />
              </div>
              {/* Tooltip */}
              <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-foreground/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="text-[10px] font-semibold text-primary-foreground whitespace-nowrap">{m.name}</span>
              </div>
              {/* Walk time badge */}
              {inRange && (
                <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-card">
                  {m.walkMins}m
                </div>
              )}
            </motion.button>
          );
        })}

        {/* Map attribution */}
        <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground/40 font-medium">
          UniEat Map · Wujiaochang District
        </div>
      </section>

      {/* GLASS SIDEBAR */}
      <aside className="w-[400px] h-full glass-panel flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)]">

        {/* Header */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-card">
                <GraduationCap size={18} />
              </div>
              UniEat
            </h1>

            {/* School Switcher */}
            <div className="flex bg-secondary p-1 rounded-xl">
              {SCHOOLS.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSchool(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
                    ${selectedSchool === s
                      ? 'bg-card shadow-card text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Class Card */}
          <div className="bg-primary rounded-3xl p-5 text-primary-foreground shadow-elevated relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70">Next Class</span>
              <h2 className="text-lg font-bold mt-1 tracking-tight">Corporate Finance</h2>
              <div className="flex items-center gap-4 mt-3 text-sm opacity-85">
                <span className="flex items-center gap-1.5"><Clock size={14} /> 3:50 PM</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> SoM, Fudan</span>
              </div>
            </div>
            {/* Decorative blobs */}
            <div className="absolute top-[-30%] right-[-15%] w-36 h-36 bg-primary-foreground/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-primary-foreground/5 rounded-full blur-xl" />
          </div>

          {/* Walk Time Filter */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-foreground">Walk Time</label>
              <span className="text-sm font-bold text-primary tabular-nums">{walkTime} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={walkTime}
              onChange={(e) => setWalkTime(parseInt(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ label, icon: Icon }) => {
              const active = activeFilters.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => toggleFilter(label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${active
                      ? 'bg-primary text-primary-foreground shadow-card'
                      : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Merchant List / Detail */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedMerchant ? (
              <motion.div
                key="detail"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="absolute inset-0 bg-card p-6 rounded-t-4xl shadow-elevated border-t border-border flex flex-col"
              >
                {/* Drag handle */}
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5 hover:bg-muted-foreground/30 transition-colors cursor-pointer"
                />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight">{selectedMerchant.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-accent font-bold text-sm">
                        <Star size={15} fill="currentColor" />
                        {selectedMerchant.rating}
                      </div>
                      <span className="text-muted-foreground text-xs">({selectedMerchant.reviews} reviews)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-2 bg-secondary rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                {/* Signature Dish */}
                <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 mb-4">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-[0.12em]">Signature Dish</span>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-foreground font-bold text-lg">{selectedMerchant.dish}</p>
                    <span className="text-accent font-extrabold text-lg">{selectedMerchant.price}</span>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 bg-secondary rounded-2xl p-3 text-center">
                    <Clock size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs font-bold">{selectedMerchant.walkMins} min</p>
                    <p className="text-[10px] text-muted-foreground">walk</p>
                  </div>
                  <div className="flex-1 bg-secondary rounded-2xl p-3 text-center">
                    <MapPin size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs font-bold">{selectedMerchant.school}</p>
                    <p className="text-[10px] text-muted-foreground">campus</p>
                  </div>
                  <div className="flex-1 bg-secondary rounded-2xl p-3 text-center">
                    <Users size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs font-bold">12</p>
                    <p className="text-[10px] text-muted-foreground">in group</p>
                  </div>
                </div>

                <div className="mt-auto">
                  <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                    <Users size={20} />
                    Join Group Buy
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-y-auto p-6 pt-0 space-y-2"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-3">
                  Nearby · {MERCHANTS.filter(m => m.walkMins <= walkTime).length} places
                </p>
                {MERCHANTS
                  .filter(m => m.walkMins <= walkTime)
                  .sort((a, b) => a.walkMins - b.walkMins)
                  .map(m => (
                    <motion.button
                      key={m.id}
                      onClick={() => setSelectedMerchant(m)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card shadow-card hover:shadow-elevated transition-shadow text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.dish} · {m.price}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-0.5 text-accent text-xs font-bold">
                          <Star size={11} fill="currentColor" /> {m.rating}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{m.walkMins}m walk</p>
                      </div>
                    </motion.button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </div>
  );
}
