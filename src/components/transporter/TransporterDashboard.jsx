import React, { useState, useEffect } from 'react';
import TransporterSidebar from './TransporterSidebar';
import TransporterHeader from './TransporterHeader';
import TransporterMetricsCards from './TransporterMetricsCards';
import { 
  TransporterOverviewTab, 
  DispatchTripsTab, 
  LiveRouteMapTab, 
  FleetManagementTab, 
  ProofOfDeliveryTab, 
  TransporterPaymentsTab, 
  RescueLogisticsTab, 
  TransporterSettingsTab 
} from './TransporterTabs';
import { 
  TransporterPayoutModal, 
  TransporterPodModal, 
  AddTankerModal 
} from './TransporterModals';
import { transporterApi } from '../../services/transporterApi';
import { CheckCircle2, AlertCircle, X, Truck, Wallet } from 'lucide-react';
import '../../dashboard.css';
import './TransporterDashboard.css';

export default function TransporterDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Core Data State
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [payoutAccounts, setPayoutAccounts] = useState(null);
  const [trips, setTrips] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [payouts, setPayouts] = useState([]);

  // Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [selectedTripForPod, setSelectedTripForPod] = useState(null);
  const [isAddTankerOpen, setIsAddTankerOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Master Data Loader
  const loadTransporterData = async () => {
    try {
      const [profData, statsData, tripsData, fleetData, payoutsData] = await Promise.all([
        transporterApi.getProfile(),
        transporterApi.getStats(),
        transporterApi.getTrips(),
        transporterApi.getFleet(),
        transporterApi.getPayouts()
      ]);

      if (profData) {
        setProfile(profData.profile);
        setWallet(profData.wallet);
        setPayoutAccounts(profData.payoutAccounts);
      }
      if (statsData) setStats(statsData);
      if (tripsData) setTrips(tripsData);
      if (fleetData) setFleet(fleetData);
      if (payoutsData) {
        setPayouts(payoutsData.payouts || []);
        if (payoutsData.wallet) setWallet(payoutsData.wallet);
      }
    } catch (err) {
      console.warn('[TransporterDashboard] Error loading data:', err.message);
    }
  };

  useEffect(() => {
    loadTransporterData();

    // Listen to real-time mutations
    const handleMutation = () => {
      loadTransporterData();
    };
    window.addEventListener('reloop:data_updated', handleMutation);
    return () => window.removeEventListener('reloop:data_updated', handleMutation);
  }, []);

  // Handlers
  const handleAdvanceTripStatus = async (tripId, nextStatus, note = '') => {
    try {
      await transporterApi.updateTripStatus(tripId, nextStatus, { note });
      showToast(`Trip status updated to "${nextStatus}".`);
      loadTransporterData();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleOpenPod = (trip) => {
    setSelectedTripForPod(trip);
    setIsPodModalOpen(true);
  };

  const handleSubmitPod = async (tripId, podPayload) => {
    try {
      await transporterApi.verifyDelivery(tripId, podPayload);
      showToast('Delivery POD verified! Litres recorded and transport fee unlocked.');
      loadTransporterData();
    } catch (err) {
      showToast(err.message || 'POD verification failed', 'error');
      throw err;
    }
  };

  const handleSubmitPayout = async (payoutPayload) => {
    try {
      const res = await transporterApi.requestPayout(payoutPayload);
      showToast(`Disbursed ₹${payoutPayload.amount.toLocaleString('en-IN')} via ${res.payout?.method || 'Direct Payout'}.`);
      loadTransporterData();
      return res;
    } catch (err) {
      showToast(err.message || 'Payout failed', 'error');
      throw err;
    }
  };

  const handleAddTanker = async (tankerPayload) => {
    try {
      await transporterApi.addTanker(tankerPayload);
      showToast(`Tanker ${tankerPayload.vehicleNumber} successfully added to fleet.`);
      loadTransporterData();
    } catch (err) {
      showToast(err.message || 'Failed to add tanker', 'error');
      throw err;
    }
  };

  const handleSaveSettings = async (settingsPayload) => {
    try {
      await transporterApi.updateProfile(settingsPayload);
      showToast('Settings saved successfully.');
      loadTransporterData();
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const activeTripsCount = trips.filter(t => t.currentStatus === 'In Transit' || t.currentStatus === 'Scheduled').length;
  const availableBal = wallet?.availableBalance ?? 16800;
  const orgName = currentUser?.fullName || currentUser?.organization || "EcoFlow Logistics Fleet";
  const todayStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <div className="reloop-app-layout transporter-app-layout">
      {/* Toast Notification Alert */}
      {toast && (
        <div className={`reloop-toast toast-${toast.type}`}>
          <div className="toast-icon-wrap">
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="toast-icon text-rose-600" />
            ) : (
              <CheckCircle2 size={18} className="toast-icon text-emerald-600" />
            )}
          </div>
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
          </div>
          <button 
            type="button" 
            className="toast-close-btn" 
            onClick={() => setToast(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sidebar with canonical layout */}
      <TransporterSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={onLogout}
        activeTripsCount={activeTripsCount}
        walletBalance={availableBal}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="reloop-main-wrapper transporter-main-wrapper">
        <TransporterHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigateTab={setActiveTab}
          onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
          walletBalance={availableBal}
          unreadCount={2}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Dashboard Body Workspace */}
        <main className="reloop-dashboard-body transporter-dashboard-body">
          {/* Greeting Banner */}
          <section className="greeting-banner-card transporter-greeting-banner">
            <div className="banner-leaf-bg">
              <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10C80 25 120 70 140 110C100 110 60 90 40 50C35 40 40 20 50 10Z" fill="#10b981" fillOpacity="0.16" />
                <path d="M110 5C140 25 170 60 190 100C160 95 130 80 115 50C110 40 105 20 110 5Z" fill="#059669" fillOpacity="0.12" />
                <circle cx="160" cy="80" r="16" stroke="#2dd4bf" strokeOpacity="0.2" strokeWidth="2" fill="none" />
                <circle cx="160" cy="80" r="28" stroke="#0d9488" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            <div className="banner-left-content">
              <div className="leaf-badge-icon transporter-banner-icon">
                <Truck size={22} className="leaf-svg text-emerald-600" />
              </div>
              <div className="banner-titles">
                <h1 className="banner-heading">
                  Welcome, {orgName}!
                </h1>
                <p className="banner-subtext">
                  Managing verified sustainable water transfers across Chennai. GPS telemetry, electronic flow meters, and instant escrow settlements enabled.
                </p>
              </div>
            </div>

            <div className="banner-right-meta">
              <span className="meta-item meta-date">{todayStr}</span>
              <button 
                type="button"
                className="banner-withdraw-btn"
                onClick={() => setIsPayoutModalOpen(true)}
              >
                <Wallet size={15} />
                <span>Withdraw Earnings (₹{availableBal.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </section>

          {/* Top Metric Cards */}
          <TransporterMetricsCards
            stats={stats}
            onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
            onNavigateTab={setActiveTab}
          />

          {/* Tab Navigation Content */}
          <div className="transporter-tab-wrapper">
            {activeTab === 'dashboard' && (
              <TransporterOverviewTab
                stats={stats}
                trips={trips}
                fleet={fleet}
                onNavigateTab={setActiveTab}
                onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
                onOpenPodModal={handleOpenPod}
                onAdvanceTripStatus={handleAdvanceTripStatus}
              />
            )}

            {activeTab === 'trips' && (
              <DispatchTripsTab
                trips={trips}
                onAdvanceStatus={handleAdvanceTripStatus}
                onOpenPodModal={handleOpenPod}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'live-map' && (
              <LiveRouteMapTab
                trips={trips}
                onAdvanceTripStatus={handleAdvanceTripStatus}
                onOpenPodModal={handleOpenPod}
              />
            )}

            {activeTab === 'fleet' && (
              <FleetManagementTab
                fleet={fleet}
                onOpenAddTanker={() => setIsAddTankerOpen(true)}
              />
            )}

            {activeTab === 'proof-of-delivery' && (
              <ProofOfDeliveryTab
                trips={trips}
                onOpenPodModal={handleOpenPod}
              />
            )}

            {activeTab === 'payments' && (
              <TransporterPaymentsTab
                wallet={wallet}
                payoutAccounts={payoutAccounts}
                payouts={payouts}
                onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
              />
            )}

            {activeTab === 'rescue' && (
              <RescueLogisticsTab
                trips={trips}
                onAdvanceStatus={handleAdvanceTripStatus}
                onOpenPodModal={handleOpenPod}
              />
            )}

            {activeTab === 'settings' && (
              <TransporterSettingsTab
                profile={profile}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <TransporterPayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableBalance={availableBal}
        payoutAccounts={payoutAccounts}
        onSubmitPayout={handleSubmitPayout}
      />

      <TransporterPodModal
        isOpen={isPodModalOpen}
        onClose={() => { setIsPodModalOpen(false); setSelectedTripForPod(null); }}
        trip={selectedTripForPod}
        onSubmitPod={handleSubmitPod}
      />

      <AddTankerModal
        isOpen={isAddTankerOpen}
        onClose={() => setIsAddTankerOpen(false)}
        onAddTanker={handleAddTanker}
      />
    </div>
  );
}
