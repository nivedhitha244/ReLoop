import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import GreetingBanner from './GreetingBanner';
import MetricsCards from './MetricsCards';
import WaterMap from './WaterMap';
import SourcesTable from './SourcesTable';
import ImpactGlance from './ImpactGlance';
import RightSidebar from './RightSidebar';
import { CreateDemandModal, RequestModal, RescueModal, DemandMatchesModal } from './Modals';
import { 
  FindWaterTab, 
  MyDemandsTab, 
  MyMatchesTab, 
  ReloopRescueTab, 
  ImpactReportsTab 
} from './BuyerTabs';
import { api } from '../../services/buyerApi';
import { CheckCircle2, Info, Droplet, ShieldAlert, RefreshCw, AlertCircle, X } from 'lucide-react';
import ReLoopChatbot from '../common/ReLoopChatbot';
import PaymentCheckoutModal from '../payment/PaymentCheckoutModal';
import OrderHistorySidebar from '../payment/OrderHistorySidebar';
import CancellationRefundModal from '../payment/CancellationRefundModal';
import { orderService } from '../../services/orderService';
import '../payment/PaymentModule.css';
import './BuyerDashboard.css';

export default function BuyerDashboard({ currentUser, onLogout, onSwitchPortal }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [user, setUser] = useState({
    name: currentUser?.fullName || "Green Park",
    role: "Buyer",
    initials: "GP",
    location: "Chennai, Tamil Nadu",
    weather: {
      temp: "32°C",
      condition: "Partly cloudy",
      date: new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    }
  });

  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [demands, setDemands] = useState([]);
  const [activities, setActivities] = useState([]);
  const [matches, setMatches] = useState([]);
  const [requests, setRequests] = useState([]);

  // Modals state
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [selectedSourceForRequest, setSelectedSourceForRequest] = useState(null);
  const [selectedDemandForMatches, setSelectedDemandForMatches] = useState(null);

  // Payment & Order History state
  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [orders, setOrders] = useState(() => orderService.getOrders());

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Initial data load
  const loadData = async () => {
    try {
      const [statsData, sourcesData, demandsData, actsData, matchesData, requestsData] = await Promise.all([
        api.getStats(),
        api.getSources(),
        api.getDemands(),
        api.getActivities(),
        api.getMatches(),
        api.getRequests()
      ]);
      setStats(statsData);
      setSources(sourcesData);
      setDemands(demandsData);
      setActivities(actsData);
      setMatches(matchesData);
      setRequests(requestsData);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    }
  };

  useEffect(() => {
    loadData();

    // Live sync: background polling every 3 seconds for near real-time updates without manual refresh
    const pollInterval = setInterval(() => {
      loadData();
    }, 3000);

    // Live sync: instant reload on window focus, tab visibility change, or cross-tab mutation
    const handleSync = () => loadData();
    const handleStorage = (e) => {
      if (e.key === 'reloop_last_mutation') loadData();
    };

    window.addEventListener('focus', handleSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('reloop:data_updated', handleSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('reloop:data_updated', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Filter sources based on search bar query
  const filteredSources = (sources || []).filter(src => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      src.name?.toLowerCase().includes(q) ||
      src.type?.toLowerCase().includes(q) ||
      src.quality?.toLowerCase().includes(q)
    );
  });

  // Action handlers
  const handleCreateDemand = async (newDemand) => {
    try {
      const created = await api.createDemand(newDemand);
      await loadData();
      const qcText = newDemand.needQualityCheck ? " (Quality Check Required)" : " (Standard Supply)";
      showToast(`Demand created for ${created.title} (${created.quantity.toLocaleString()} L)${qcText}!`);
      // Automatically prompt to find matches for the new demand
      setSelectedDemandForMatches(created);
    } catch (err) {
      showToast(`Failed to post demand: ${err.message}`, 'info');
    }
  };

  const handleRequestClick = (source) => {
    setSelectedSourceForRequest(source);
  };

  const handleFindMatches = (demand) => {
    setSelectedDemandForMatches(demand);
  };

  const handleRequestWater = async (candidate, demand) => {
    try {
      const res = await api.requestWater({
        sourceId: candidate.sourceId,
        demandId: demand.id,
        requestedQuantity: demand.quantity || demand.requiredQuantity,
        notes: `Allocation request for ${demand.purpose} (${(demand.quantity || demand.requiredQuantity).toLocaleString()} L)`
      });
      await loadData();
      showToast(`Water request #${res.request.id} sent to ${candidate.sourceName}!`, 'success');
      setSelectedDemandForMatches(null);
      setActiveTab('my-matches');
    } catch (err) {
      showToast(`Request failed: ${err.message}`, 'info');
      throw err;
    }
  };

  const handleConfirmReceipt = async (matchId) => {
    try {
      setMatches(prev => prev.map(m => (m.id === matchId || m.requestId === matchId) ? { ...m, status: 'Completed' } : m));
      await api.confirmDelivery(matchId);
      await loadData();
      showToast("Delivery receipt confirmed! Freshwater savings ledger updated.", 'success');
    } catch (err) {
      showToast(`Failed to confirm delivery: ${err.message}`, 'info');
      await loadData();
    }
  };

  const handleConfirmMatchAgreement = async (identifier) => {
    try {
      // Optimistic update for immediate visual feedback on both matches and requests
      setMatches(prev => prev.map(m => (m.id === identifier || m.requestId === identifier) ? { ...m, status: 'Confirmed', buyerConfirmed: true } : m));
      setRequests(prev => prev.map(r => (r.id === identifier || r.matchId === identifier) ? { ...r, status: 'Confirmed' } : r));
      await api.confirmMatchAgreement(identifier);
      await loadData();
      showToast("Match Confirmed! Tanker dispatch is ready and waybill active.", 'success');
    } catch (err) {
      showToast(`Confirmation update: ${err.message}`, 'info');
      await loadData();
    }
  };

  const handleDispatchTanker = async (identifier) => {
    try {
      // Optimistic update to immediately show step 3 In Transit
      setMatches(prev => prev.map(m => (m.id === identifier || m.requestId === identifier) ? { ...m, status: 'In Transit' } : m));
      await api.patchMatchStatus(identifier, 'In Transit', {
        driverName: "Senthil Kumar (TN-09-CV-8841)",
        driverPhone: "+91 97890 44556",
        instructions: "Tanker dispatched from loading dock. GPS route tracking active."
      });
      await loadData();
      showToast("Tanker #DLV-702786 dispatched! Real-time GPS transit active.", 'success');
    } catch (err) {
      showToast(`Dispatch update: ${err.message}`, 'info');
      await loadData();
    }
  };

  // Payment Operations Module Handlers
  const handleOpenCheckout = (payload = null) => {
    setCheckoutData(payload);
    setIsCheckoutModalOpen(true);
  };

  const handlePaymentSuccess = async (newOrder) => {
    const updated = orderService.getOrders();
    setOrders(updated);
    showToast(`Payment of ₹${newOrder.costBreakdown.total.toFixed(2)} confirmed! Order #${newOrder.id} dispatched.`, 'success');
    setIsOrderSidebarOpen(true);
    // If payment was for a confirmed match, trigger tanker dispatch immediately
    if (checkoutData?.matchId) {
      await handleDispatchTanker(checkoutData.matchId);
    }
  };

  const handlePayAndDispatch = (match) => {
    const payload = {
      matchId: match.id || match._id,
      source: { name: match.sourceName, type: match.waterCategory || match.type || 'Recycled Water' },
      supplierName: match.sourceName || match.supplierName,
      waterType: match.waterCategory || match.type || 'Treated Wastewater',
      volume: Number(match.matchedQuantity || match.quantity || 4000),
      destination: match.destinationName || match.buyerName || 'Facility Destination',
      needQualityCheck: true
    };
    handleOpenCheckout(payload);
  };

  const handleInitiateCancel = (order) => {
    setOrderToCancel(order);
  };

  const handleConfirmCancellation = (orderId, reason) => {
    const cancelled = orderService.cancelOrder(orderId, reason);
    const updated = orderService.getOrders();
    setOrders(updated);
    const refund = cancelled?.refundDetails?.refundAmount?.toFixed(2) || '1,000.00';
    showToast(`Order #${orderId} cancelled. Refund of ₹${refund} initiated to your account.`, 'info');
  };

  const handleConfirmMatch = async (sourceId, demandId, qty, needQualityCheck, customDemandData = null) => {
    try {
      let demand = demands.find(d => d.id === demandId);

      // If creating new demand or demandId not found, create demand first so it appears under My Demands
      if (!demand && customDemandData) {
        demand = await api.createDemand({
          title: customDemandData.demandTitle || `Demand for ${selectedSourceForRequest?.name || 'Water'}`,
          quantity: Number(qty) || 4000,
          purpose: customDemandData.purpose || 'Irrigation',
          location: customDemandData.deliveryLocation || 'Chennai, Tamil Nadu',
          needQualityCheck: Boolean(needQualityCheck)
        });
        demandId = demand.id;
      }

      await api.requestMatch(
        sourceId, 
        demandId || (demand ? demand.id : ''), 
        qty, 
        `Allocation request for ${demand?.title || customDemandData?.demandTitle || 'Water'}`,
        {
          demandTitle: demand?.title || customDemandData?.demandTitle,
          purpose: demand?.purpose || customDemandData?.purpose,
          deliveryLocation: demand?.location || demand?.deliveryLocation || customDemandData?.deliveryLocation
        }
      );

      await loadData();

      const supplierName = selectedSourceForRequest?.name || 'Supplier';
      setSelectedSourceForRequest(null);
      setActiveTab('my-matches');
      showToast(`Water request sent to ${supplierName}! Awaiting supplier acceptance. Once accepted, you can proceed to payment & tanker dispatch.`, 'success');
    } catch (err) {
      showToast(`Request error: ${err.message}`, 'info');
    }
  };

  const handleExecuteRescue = async (demandId, failedSourceId, reason) => {
    const targetDemandId = demandId || demands[0]?.id;
    const res = await api.triggerRescue(targetDemandId, failedSourceId, reason);
    await loadData();
    showToast("ReLoop Rescue activated! Found verified alternative sources.");
    return res;
  };


  return (
    <div className="reloop-app-layout">
      {/* Enhanced Floating Glassmorphic Toast Notification */}
      {toast && (
        <div className={`reloop-toast toast-${toast.type}`}>
          <div className="toast-icon-wrap">
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : toast.type === 'error' ? (
              <AlertCircle size={18} className="text-rose-400" />
            ) : (
              <Info size={18} className="text-sky-400" />
            )}
          </div>
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
          </div>
          <button 
            type="button" 
            className="toast-close-btn" 
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenRescue={() => setIsRescueModalOpen(true)}
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchPortal={onSwitchPortal}
      />

      {/* Center Layout Area */}
      <div className="reloop-main-wrapper">
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onOpenDemandModal={() => setIsDemandModalOpen(true)}
          onOpenRescueModal={() => setIsRescueModalOpen(true)}
          onOpenOrders={() => setIsOrderSidebarOpen(true)}
          orderCount={orders.length}
          onNotificationClick={() => showToast("All system alerts are up to date! 3 active demands matched.", "info")}
        />

        <main className="reloop-dashboard-body">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* Top Greeting & Weather Banner */}
              <GreetingBanner 
                user={user} 
                onOpenDemandModal={() => setIsDemandModalOpen(true)}
                onOpenRescueModal={() => setIsRescueModalOpen(true)}
              />

              {/* 4 Interactive KPI Metric Cards */}
              <MetricsCards 
                stats={stats} 
                onActionClick={(tabKey) => {
                  if (tabKey === 'demands') setActiveTab('my-demands');
                  else if (tabKey === 'matches') setActiveTab('my-matches');
                  else if (tabKey === 'reports') setActiveTab('impact-reports');
                  else if (tabKey === 'find-water') setActiveTab('find-water');
                }}
              />

              {/* 2-Column Split: Center Main & Right Sidebar */}
              <div className="dashboard-grid-content">
                {/* Center Area: Map, Sources Table, Impact */}
                <div className="content-center-column">
                  {/* Leaflet Interactive Map */}
                  <WaterMap 
                    sources={sources} 
                    demands={demands} 
                    onRequestSource={handleRequestClick}
                  />

                  {/* Available Water Sources Table */}
                  <SourcesTable 
                    sources={filteredSources} 
                    onRequestClick={handleRequestClick}
                    onViewAll={() => setActiveTab('find-water')}
                  />

                  {/* Real-time Environmental Impact Glance */}
                  <ImpactGlance stats={stats} />

                  {/* Horizontal 2-Card Row: Need More Water & ReLoop Rescue */}
                  <div className="horizontal-promo-cards-row">
                    {/* 1. Need More Water Card */}
                    <div className="side-card need-water-card horizontal-box">
                      <div className="promo-box-top">
                        <div className="need-water-leaf-art">
                          <Droplet size={22} className="text-emerald-500" />
                        </div>
                        <span className="promo-pill-category">Water Sourcing</span>
                      </div>
                      <div className="need-water-title">Need more water?</div>
                      <p className="need-water-desc">
                        Find better matches, explore nearby sources or create a new request.
                      </p>
                      <button 
                        className="find-water-btn"
                        onClick={() => setActiveTab('find-water')}
                      >
                        Find Water →
                      </button>
                    </div>

                    {/* 2. ReLoop Rescue Card */}
                    <div className="side-card rescue-promo-card horizontal-box">
                      <div className="rescue-card-top">
                        <div className="rescue-shield-icon">
                          <ShieldAlert size={20} className="text-white" />
                        </div>
                        <button className="rescue-sync-icon" onClick={() => setIsRescueModalOpen(true)} title="Refresh Backup">
                          <RefreshCw size={17} />
                        </button>
                      </div>

                      <h4 className="rescue-heading">ReLoop Rescue</h4>
                      <p className="rescue-desc">
                        A source becomes unavailable? We'll find an alternative for you within 10 km.
                      </p>

                      <button 
                        className="try-rescue-btn"
                        onClick={() => setIsRescueModalOpen(true)}
                      >
                        Try Rescue →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Quick Actions, Demands, Activity, Rescue */}
                <RightSidebar 
                  demands={demands} 
                  activities={activities}
                  onQuickAction={(actionId) => {
                    if (actionId === 'find-water') setActiveTab('find-water');
                    else if (actionId === 'my-demands') setActiveTab('my-demands');
                    else if (actionId === 'my-matches') setActiveTab('my-matches');
                    else if (actionId === 'reloop-rescue') setActiveTab('reloop-rescue');
                    else if (actionId === 'order-history') setIsOrderSidebarOpen(true);
                  }}
                  onOpenDemandModal={() => setIsDemandModalOpen(true)}
                  onOpenRescueModal={() => setIsRescueModalOpen(true)}
                />
              </div>
            </>
          )}

          {/* TAB 2: FIND WATER */}
          {activeTab === 'find-water' && (
            <FindWaterTab 
              sources={sources} 
              demands={demands} 
              requests={requests}
              onRequestClick={handleRequestClick} 
            />
          )}

          {/* TAB 3: MY DEMANDS */}
          {activeTab === 'my-demands' && (
            <MyDemandsTab 
              demands={demands} 
              onOpenCreateDemand={() => setIsDemandModalOpen(true)} 
              onFindMatches={handleFindMatches}
            />
          )}

          {/* TAB 4: MY MATCHES */}
          {activeTab === 'my-matches' && (
            <MyMatchesTab 
              matches={matches}
              requests={requests}
              onConfirmReceipt={handleConfirmReceipt}
              onConfirmMatch={handleConfirmMatchAgreement}
              onDispatchTanker={handleDispatchTanker}
              onPayAndDispatch={handlePayAndDispatch}
              onOpenRescue={(dId, sId, rsn) => {
                handleExecuteRescue(dId, sId, rsn);
                setIsRescueModalOpen(true);
              }}
              onRefresh={loadData}
              showToast={showToast}
            />
          )}

          {/* TAB 5: RELOOP RESCUE */}
          {activeTab === 'reloop-rescue' && (
            <ReloopRescueTab onOpenRescueModal={() => setIsRescueModalOpen(true)} />
          )}

          {/* TAB 6: IMPACT REPORTS */}
          {activeTab === 'impact-reports' && (
            <ImpactReportsTab stats={stats} showToast={showToast} />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateDemandModal 
        isOpen={isDemandModalOpen}
        onClose={() => setIsDemandModalOpen(false)}
        onSubmit={handleCreateDemand}
      />

      <DemandMatchesModal
        isOpen={Boolean(selectedDemandForMatches)}
        demand={selectedDemandForMatches}
        onClose={() => setSelectedDemandForMatches(null)}
        onRequestWater={handleRequestWater}
      />

      <RequestModal 
        isOpen={Boolean(selectedSourceForRequest)}
        source={selectedSourceForRequest}
        demands={demands}
        requests={requests}
        onClose={() => setSelectedSourceForRequest(null)}
        onConfirm={handleConfirmMatch}
      />

      <RescueModal 
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
        onExecuteRescue={handleExecuteRescue}
      />


      {/* Payment Operations Module: Floating Checkout Interface */}
      <PaymentCheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        checkoutData={checkoutData}
      />

      {/* Persistent Toggleable Order History Sidebar & Granular Detail View */}
      <OrderHistorySidebar 
        isOpen={isOrderSidebarOpen}
        onClose={() => setIsOrderSidebarOpen(false)}
        orders={orders}
        onOpenCheckout={() => handleOpenCheckout(null)}
        onInitiateCancel={handleInitiateCancel}
      />

      {/* redBus-Style Floating Cancellation & Exact Refund Confirmation Modal */}
      <CancellationRefundModal 
        isOpen={Boolean(orderToCancel)}
        onClose={() => setOrderToCancel(null)}
        order={orderToCancel}
        onConfirmCancellation={handleConfirmCancellation}
      />

      {/* 24/7 AI Water Copilot Chatbot */}
      <ReLoopChatbot onNavigateTab={(tab) => setActiveTab(tab)} />
    </div>
  );
}
