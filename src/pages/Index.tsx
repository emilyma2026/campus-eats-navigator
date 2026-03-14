import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav, { Tab } from '@/components/BottomNav';
import DiscoveryTab from '@/components/DiscoveryTab';
import MapTab from '@/components/MapTab';
import CommunityTab from '@/components/CommunityTab';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import TopHeader from '@/components/TopHeader';
import { POIRestaurant } from '@/components/AMapContainer';

const Index = () => {
  // ── Onboarding ──────────────────────────────────────────────────────────
  const [onboardingVisible, setOnboardingVisible] = useState(
    () => !localStorage.getItem('bb-onboarding-done'),
  );
  const [username,   setUsername]   = useState(() => localStorage.getItem('bb-username')   || '');
  const [remindMins, setRemindMins] = useState(() => parseInt(localStorage.getItem('bb-remind-mins') || '10') as 5 | 10 | 15);

  const handleOnboardingComplete = useCallback((name: string, mins: number) => {
    setUsername(name);
    setRemindMins(mins as 5 | 10 | 15);
    localStorage.setItem('bb-onboarding-done',  '1');
    localStorage.setItem('bb-username',          name);
    localStorage.setItem('bb-remind-mins',       String(mins));
    setOnboardingVisible(false);
  }, []);

  // ── Tab & restaurant state ──────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<Tab>('discovery');
  const [restaurants,  setRestaurants]  = useState<POIRestaurant[]>([]);
  const [highlightId,  setHighlightId]  = useState<string | null>(null);

  const handleViewOnMap = useCallback((id: string) => {
    setHighlightId(id);
    setActiveTab('map');
  }, []);

  const handleRestaurantsLoaded = useCallback((pois: POIRestaurant[]) => {
    setRestaurants(pois);
  }, []);

  // Called from CommunityTab when user taps a shop name
  const handleViewShop = useCallback((shopName: string) => {
    const match = restaurants.find((r) =>
      r.name.toLowerCase().includes(shopName.toLowerCase()) ||
      shopName.toLowerCase().includes(r.name.toLowerCase()),
    );
    if (match) setHighlightId(match.id);
    setActiveTab('map');
  }, [restaurants]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">

      {/* Persistent top header (shown after onboarding) */}
      {!onboardingVisible && (
        <TopHeader username={username} remindMins={remindMins} />
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">

        {/* MapTab is always mounted so the map stays initialised */}
        <div className={`absolute inset-0 ${activeTab === 'map' ? 'z-10' : 'z-0 pointer-events-none'}`}>
          <MapTab
            onRestaurantsLoaded={handleRestaurantsLoaded}
            highlightId={highlightId}
            onHighlightClear={() => setHighlightId(null)}
          />
        </div>

        {activeTab === 'discovery' && (
          <div className="absolute inset-0 z-10">
            <DiscoveryTab restaurants={restaurants} onViewOnMap={handleViewOnMap} />
          </div>
        )}

        {activeTab === 'community' && (
          <div className="absolute inset-0 z-10">
            <CommunityTab restaurants={restaurants} onViewShop={handleViewShop} />
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Onboarding overlay with fade-out */}
      <AnimatePresence>
        {onboardingVisible && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            className="fixed inset-0 z-50"
          >
            <OnboardingOverlay onComplete={handleOnboardingComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
