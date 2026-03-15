import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav, { Tab } from '@/components/BottomNav';
import DiscoveryTab, { DiscoveryPOIInfo } from '@/components/DiscoveryTab';
import MapTab from '@/components/MapTab';
import CommunityTab from '@/components/CommunityTab';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import TopHeader from '@/components/TopHeader';
import SettingsModal from '@/components/SettingsModal';
import NotificationModal from '@/components/NotificationModal';
import { POIRestaurant } from '@/components/AMapContainer';
import { EnrichedRestaurant } from '@/components/StoreDrawer';

const FUDAN_CENTER: [number, number] = [121.5132, 31.2995];

const Index = () => {
  // ── Onboarding ──────────────────────────────────────────────────────────
  const [onboardingVisible, setOnboardingVisible] = useState(
    () => !localStorage.getItem('bb-onboarding-done'),
  );
  const [username,        setUsername]        = useState(() => localStorage.getItem('bb-username')   || '');
  const [remindMins,      setRemindMins]      = useState<number>(() => parseInt(localStorage.getItem('bb-remind-mins') || '30'));
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notifVisible,    setNotifVisible]    = useState(false);

  // ── Mock notification: fires once per session after onboarding ──────────────
  useEffect(() => {
    if (onboardingVisible) return;
    if (sessionStorage.getItem('bb-notif-shown')) return;
    const t = setTimeout(() => {
      setNotifVisible(true);
      sessionStorage.setItem('bb-notif-shown', '1');
    }, 1500);
    return () => clearTimeout(t);
  }, [onboardingVisible]);

  const handleOnboardingComplete = useCallback((name: string, mins: number) => {
    setUsername(name);
    setRemindMins(mins);
    localStorage.setItem('bb-onboarding-done', '1');
    localStorage.setItem('bb-username',         name);
    localStorage.setItem('bb-remind-mins',      String(mins));
    setOnboardingVisible(false);
  }, []);

  // ── Shared geo state (synced from MapTab → used by DiscoveryTab) ────────
  const [sharedCenter,       setSharedCenter]       = useState<[number, number]>(FUDAN_CENTER);
  const [sharedRadius,       setSharedRadius]       = useState<number>(800); // 10 min × 80 m/min
  const [sharedLocationName, setSharedLocationName] = useState<string>('复旦管院');

  // ── Tab & restaurant state ──────────────────────────────────────────────
  const [activeTab,          setActiveTab]          = useState<Tab>('map');
  const [restaurants,        setRestaurants]        = useState<POIRestaurant[]>([]);
  const [highlightId,        setHighlightId]        = useState<string | null>(null);
  const [externalRestaurant, setExternalRestaurant] = useState<EnrichedRestaurant | null>(null);

  const handleViewOnMap = useCallback((poi: DiscoveryPOIInfo) => {
    // Try to match against already-loaded map restaurants first
    const match = restaurants.find((r) => r.id === poi.id);
    if (match) {
      setExternalRestaurant(null);
      setHighlightId(match.id);
    } else {
      // Build an EnrichedRestaurant from the discovery POI to show in StoreDrawer
      const hash = poi.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      setExternalRestaurant({
        ...poi,
        walkMins:      Math.max(1, Math.round(poi.distance / 80)),
        studentDeal:   hash % 3 === 0,
        meituanVoucher: hash % 4 === 0,
        crowdLevel:    (['low', 'medium', 'high'] as const)[hash % 3],
        waitMins:      0,
      });
      setHighlightId(null);
    }
    setActiveTab('map');
  }, [restaurants]);

  const handleRestaurantsLoaded = useCallback((pois: POIRestaurant[]) => {
    setRestaurants(pois);
  }, []);

  // Lift location + radius from MapTab so DiscoveryTab gets fresh context
  const handleLocationChange = useCallback((loc: [number, number]) => {
    setSharedCenter(loc);
  }, []);

  const handleRadiusChange = useCallback((radiusM: number) => {
    setSharedRadius(radiusM);
  }, []);

  /** Receive geocoded address from MapTab → strip verbose prefix → show in DiscoveryTab */
  const handleAddressChange = useCallback((addr: string) => {
    // Extract the most meaningful short segment (e.g. "五角场街道" from "杨浦区·五角场街道")
    const short =
      addr.split('·').pop()?.trim() ||
      addr.replace(/^.*?区/, '').trim() ||
      addr.slice(0, 8);
    setSharedLocationName(short || addr);
  }, []);

  // Called from CommunityTab when user taps a shop name
  const handleViewShop = useCallback((shopName: string) => {
    const match = restaurants.find((r) =>
      r.name.toLowerCase().includes(shopName.toLowerCase()) ||
      shopName.toLowerCase().includes(r.name.toLowerCase()),
    );
    if (match) {
      // Set externalRestaurant so the map pans to the actual location
      const hash = match.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      setExternalRestaurant({
        ...match,
        walkMins:      Math.max(1, Math.round(match.distance / 80)),
        studentDeal:   hash % 3 === 0,
        meituanVoucher: hash % 4 === 0,
        crowdLevel:    (['low', 'medium', 'high'] as const)[hash % 3],
        waitMins:      0,
      });
      setHighlightId(null);
    } else {
      // No real POI found – create a placeholder to show partial info in drawer
      const hash = shopName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      setExternalRestaurant({
        id:            `community-${hash}`,
        name:          shopName,
        address:       '校园周边',
        rating:        4.0 + (hash % 10) / 10,
        distance:      100 + (hash % 500),
        type:          '餐饮服务',
        lng:           sharedCenter[0],
        lat:           sharedCenter[1],
        walkMins:      Math.max(1, Math.round((100 + hash % 500) / 80)),
        studentDeal:   hash % 3 === 0,
        meituanVoucher: hash % 4 === 0,
        crowdLevel:    (['low', 'medium', 'high'] as const)[hash % 3],
        waitMins:      0,
      });
    }
    setActiveTab('map');
  }, [restaurants, sharedCenter]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">

      {/* Persistent top header (shown after onboarding) */}
      {!onboardingVisible && (
        <TopHeader
          username={username}
          remindMins={remindMins}
          onOpenSettings={() => setSettingsVisible(true)}
        />
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">

        {/* MapTab is always mounted so the map stays initialised */}
        <div className={`absolute inset-0 ${activeTab === 'map' ? 'z-10' : 'z-0 pointer-events-none'}`}>
          <MapTab
            onRestaurantsLoaded={handleRestaurantsLoaded}
            highlightId={highlightId}
            onHighlightClear={() => setHighlightId(null)}
            onLocationChange={handleLocationChange}
            onRadiusChange={handleRadiusChange}
            onAddressChange={handleAddressChange}
            externalRestaurant={externalRestaurant}
            onExternalRestaurantClose={() => setExternalRestaurant(null)}
          />
        </div>

        {activeTab === 'discovery' && (
          <div className="absolute inset-0 z-10">
            <DiscoveryTab
              center={sharedCenter}
              radiusM={sharedRadius}
              locationName="复旦大学管理学院"
              onViewOnMap={handleViewOnMap}
            />
          </div>
        )}

        {activeTab === 'community' && (
          <div className="absolute inset-0 z-10">
            <CommunityTab restaurants={restaurants} onViewShop={handleViewShop} />
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Settings modal */}
      {settingsVisible && (
        <SettingsModal
          username={username}
          remindMins={remindMins}
          onSave={(name, mins) => { setUsername(name); setRemindMins(mins); }}
          onClose={() => setSettingsVisible(false)}
        />
      )}

      {/* Mock system notification */}
      <AnimatePresence>
        {notifVisible && (
          <NotificationModal
            restaurantCount={restaurants.length > 0 ? restaurants.length : 20}
            onGo={() => { setNotifVisible(false); setActiveTab('map'); }}
            onDismiss={() => setNotifVisible(false)}
          />
        )}
      </AnimatePresence>

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
