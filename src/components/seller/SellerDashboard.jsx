import React, { useState, useEffect } from 'react';
import SellerSidebar from './SellerSidebar';
import SellerHeader from './SellerHeader';
import SellerGreetingBanner from './SellerGreetingBanner';
import SellerMetricsCards from './SellerMetricsCards';
import { 
  SellerOverviewTab, 
  MyWaterSourcesTab, 
  IncomingRequestsTab, 
  MyMatchesTab, 
  QualityVerificationTab, 
  DeliveryTrackingTab, 
  ImpactReportsTab, 
  NotificationsTab, 
  SettingsTab 
} from './SellerTabs';
import { 
  AddSourceModal, 
  AcceptRequestModal, 
  RejectRequestModal, 
  SourceDetailsModal, 
  QuickQuantityModal, 
  SellerRescueModal 
} from './SellerModals';
import { sellerApi } from '../../services/sellerApi';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import '../../dashboard.css';
import './SellerDashboard.css';

export default function SellerDashboard({ currentUser, onLogout, onSwitchPortal }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Core Data State
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [impactData, setImpactData] = useState(null);
  const [profile, setProfile] = useState(null);

  // Modal State
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [selectedRequestForAccept, setSelectedRequestForAccept] = useState(null);
  const [selectedRequestForReject, setSelectedRequestForReject] = useState(null);
  const [selectedSourceForDetails, setSelectedSourceForDetails] = useState(null);
  const [selectedSourceForQuickQty, setSelectedSourceForQuickQty] = useState(null);
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);

  // Master Tab Switcher: closes all lingering modals to prevent UI overrides
  const handleTabChange = (tabId) => {
    setIsAddSourceOpen(false);
    setSelectedRequestForAccept(null);
    setSelectedRequestForReject(null);
    setSelectedSourceForDetails(null);
    setSelectedSourceForQuickQty(null);
    setIsRescueModalOpen(false);

    if (tabId === 'add-source') {
      setActiveTab('my-sources');
      setIsAddSourceOpen(true);
    } else {
      setActiveTab(tabId);
    }
  };

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Master Data Loader
  const loadDashboardData = async () => {
    try {
      const [
        statsData, 
        sourcesData, 
        requestsData, 
        matchesData, 
        docsData, 
        notifsData, 
        profileData,
        impactRes
      ] = await Promise.all([
        sellerApi.getStats(),
        sellerApi.getSources(),
        sellerApi.getRequests(),
        sellerApi.getMatches(),
        sellerApi.getDocuments(),
        sellerApi.getNotifications(),
        sellerApi.getProfile(),
        sellerApi.getImpact()
      ]);

      setStats(statsData);
      setSources(sourcesData);
      setRequests(requestsData);
      setMatches(matchesData);
      setDocuments(docsData);
      setNotifications(notifsData);
      setProfile(profileData);
      setImpactData(impactRes);
    } catch (err) {
      console.error("[SellerDashboard] Error loading data:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Live sync: background polling every 3 seconds for near real-time updates without manual refresh
    const pollInterval = setInterval(() => {
      loadDashboardData();
    }, 3000);

    // Live sync: instant reload on window focus, tab visibility change, or cross-tab mutation
    const handleSync = () => loadDashboardData();
    const handleStorage = (e) => {
      if (e.key === 'reloop_last_mutation') loadDashboardData();
    };

    window.addEventListener('focus', handleSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadDashboardData();
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

  const unreadCount = (notifications || []).filter(n => !n.read).length;
  const pendingRequestsCount = (requests || []).filter(r => r.status === 'Pending').length;

  // Filter sources & requests if search query is provided
  const filteredSources = (sources || []).filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.type?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q)
    );
  });

  // Action Handlers
  const handleAddSource = async (newSourceData) => {
    const res = await sellerApi.createSource(newSourceData);
    await loadDashboardData();
    showToast(`Water source "${res.source?.name || 'New Source'}" registered successfully and queued for verification!`);
  };

  const handleAcceptRequest = async (requestId) => {
    const res = await sellerApi.acceptRequest(requestId);
    await loadDashboardData();
    showToast(res.message || "Request accepted and fulfillment scheduled!");
    setSelectedRequestForAccept(null);
  };

  const handleRejectRequest = async (requestId, reason, notes) => {
    const res = await sellerApi.rejectRequest(requestId, reason, notes);
    await loadDashboardData();
    showToast("Request declined and buyer notified.", "info");
    setSelectedRequestForReject(null);
  };

  const handleToggleAvailability = async (sourceId, available) => {
    try {
      const res = await sellerApi.toggleAvailability(sourceId, available);
      await loadDashboardData();
      showToast(res.message || "Availability status updated!");
    } catch (err) {
      showToast(err.message || "Failed to update availability", "error");
    }
  };

  const handleUpdateQuantity = async (sourceId, quantity) => {
    try {
      const res = await sellerApi.updateQuantity(sourceId, quantity);
      await loadDashboardData();
      showToast(`Available inventory updated to ${Number(quantity).toLocaleString()} L!`);
      setSelectedSourceForQuickQty(null);
    } catch (err) {
      showToast(err.message || "Failed to update quantity", "error");
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!window.confirm("Are you sure you want to remove this water source? This action cannot be undone.")) {
      return;
    }
    try {
      await sellerApi.deleteSource(sourceId);
      await loadDashboardData();
      showToast("Water source removed successfully.");
    } catch (err) {
      showToast(err.message || "Failed to delete source", "error");
    }
  };

  const handleUpdateMatchStatus = async (matchId, statusData) => {
    try {
      await sellerApi.updateMatchStatus(matchId, statusData);
      await loadDashboardData();
      showToast(`Fulfillment updated to ${statusData.status}!`);
    } catch (err) {
      showToast(err.message || "Failed to update match status", "error");
    }
  };

  const handleUploadDocument = async (docData) => {
    try {
      await sellerApi.uploadDocument(docData);
      await loadDashboardData();
      showToast("Quality document submitted for verifier approval!");
    } catch (err) {
      showToast(err.message || "Failed to upload document", "error");
    }
  };

  const handleSaveProfile = async (profileData) => {
    await sellerApi.updateProfile(profileData);
    await loadDashboardData();
  };

  const handleTriggerRescue = async (sourceId, reason) => {
    const res = await sellerApi.triggerRescue(sourceId, reason);
    await loadDashboardData();
    showToast("ReLoop Rescue™ activated! Affected source suspended and alternatives notified.");
    return res;
  };

  const handleMarkNotificationRead = async (id) => {
    await sellerApi.markNotificationRead(id);
    const updated = await sellerApi.getNotifications();
    setNotifications(updated);
  };

  const handleMarkAllNotificationsRead = async () => {
    await sellerApi.markAllNotificationsRead();
    const updated = await sellerApi.getNotifications();
    setNotifications(updated);
    showToast("All notifications marked as read.", "info");
  };

  return (
    <div className="reloop-app-layout seller-app-layout">
      {/* Toast Notification Alert */}
      {toast && (
        <div className={`reloop-toast toast-${toast.type}`}>
          <div className="toast-icon-wrap">
            {toast.type === 'success' && <CheckCircle2 size={18} className="toast-icon text-emerald-600" />}
            {toast.type === 'info' && <Info size={18} className="toast-icon text-sky-600" />}
            {toast.type === 'error' && <AlertCircle size={18} className="toast-icon text-rose-600" />}
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

      {/* Deep Teal-Green Seller Sidebar */}
      <SellerSidebar 
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchPortal={onSwitchPortal}
        unreadCount={unreadCount}
        pendingRequestsCount={pendingRequestsCount}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="reloop-main-wrapper seller-main-wrapper">
        {/* Top Navigation Bar */}
        <SellerHeader 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNotificationClick={() => handleTabChange('notifications')}
          onOpenAddSource={() => setIsAddSourceOpen(true)}
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigateTab={(tab) => handleTabChange(tab)}
          unreadCount={unreadCount}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Dashboard Body Workspace */}
        <main className="reloop-dashboard-body seller-dashboard-body">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Personalized Greeting Banner */}
              <SellerGreetingBanner 
                profile={profile}
                currentUser={currentUser}
                onOpenAddSource={() => setIsAddSourceOpen(true)}
              />

              {/* 4 Live Metric Cards */}
              <SellerMetricsCards 
                stats={stats}
                onNavigateTab={(tab, param) => handleTabChange(tab)}
              />

              {/* Overview Layout: Sources, Requests, Recent Activity */}
              <SellerOverviewTab 
                sources={filteredSources}
                requests={requests}
                matches={matches}
                stats={stats}
                notifications={notifications}
                onNavigateTab={(tab) => handleTabChange(tab)}
                onOpenAddSource={() => setIsAddSourceOpen(true)}
                onOpenSourceDetails={(src) => setSelectedSourceForDetails(src)}
                onOpenAcceptRequest={(req) => setSelectedRequestForAccept(req)}
                onOpenRejectRequest={(req) => setSelectedRequestForReject(req)}
                onOpenRescue={() => setIsRescueModalOpen(true)}
              />
            </>
          )}

          {/* TAB 2: MY WATER SOURCES */}
          {activeTab === 'my-sources' && (
            <MyWaterSourcesTab 
              sources={filteredSources}
              onOpenAddSource={() => setIsAddSourceOpen(true)}
              onOpenDetails={(src) => setSelectedSourceForDetails(src)}
              onOpenQuickQuantity={(src) => setSelectedSourceForQuickQty(src)}
              onToggleAvailability={handleToggleAvailability}
              onDeleteSource={handleDeleteSource}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}

          {/* TAB 3: ADD WATER SOURCE FORM */}
          {activeTab === 'add-source' && (
            <div className="tab-page-container">
              <div className="tab-header-banner">
                <div>
                  <h2 className="tab-page-title">Register New Water Resource</h2>
                  <p className="tab-page-subtitle">
                    Submit treatment specs, batch volumes, and NABL lab audit documentation for platform verification.
                  </p>
                </div>
              </div>
              <button 
                className="btn-primary-action-pill mt-4"
                onClick={() => setIsAddSourceOpen(true)}
              >
                Launch Registration Wizard →
              </button>
            </div>
          )}

          {/* TAB 4: INCOMING REQUESTS */}
          {activeTab === 'incoming-requests' && (
            <IncomingRequestsTab 
              requests={requests}
              onOpenAccept={(req) => setSelectedRequestForAccept(req)}
              onOpenReject={(req) => setSelectedRequestForReject(req)}
            />
          )}

          {/* TAB 5: MY MATCHES */}
          {activeTab === 'my-matches' && (
            <MyMatchesTab 
              matches={matches}
              onUpdateStatus={handleUpdateMatchStatus}
              onOpenRescue={() => setIsRescueModalOpen(true)}
            />
          )}

          {/* TAB 6: QUALITY & VERIFICATION */}
          {activeTab === 'quality-verification' && (
            <QualityVerificationTab 
              documents={documents}
              sources={sources}
              onOpenUploadDoc={() => showToast("Opening Document Upload form...", "info")}
              showToast={showToast}
            />
          )}

          {/* TAB 7: DELIVERY TRACKING */}
          {activeTab === 'delivery-tracking' && (
            <DeliveryTrackingTab 
              matches={matches}
              onUpdateStatus={handleUpdateMatchStatus}
              showToast={showToast}
            />
          )}

          {/* TAB 8: IMPACT REPORTS */}
          {activeTab === 'impact-reports' && (
            <ImpactReportsTab 
              impactData={impactData}
              stats={stats}
              showToast={showToast}
            />
          )}

          {/* TAB 9: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <NotificationsTab 
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsTab 
              profile={profile}
              onSaveProfile={handleSaveProfile}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Interactive Modal Dialogs */}
      <AddSourceModal 
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onSubmit={handleAddSource}
        profile={profile}
      />

      <AcceptRequestModal 
        isOpen={Boolean(selectedRequestForAccept)}
        onClose={() => setSelectedRequestForAccept(null)}
        request={selectedRequestForAccept}
        source={sources.find(s => s.id === selectedRequestForAccept?.sourceId)}
        onConfirm={handleAcceptRequest}
      />

      <RejectRequestModal 
        isOpen={Boolean(selectedRequestForReject)}
        onClose={() => setSelectedRequestForReject(null)}
        request={selectedRequestForReject}
        onConfirm={handleRejectRequest}
      />

      <SourceDetailsModal 
        isOpen={Boolean(selectedSourceForDetails)}
        onClose={() => setSelectedSourceForDetails(null)}
        source={selectedSourceForDetails}
        onEdit={(src) => showToast(`Edit form opened for ${src.name}`, "info")}
        onToggleAvailability={handleToggleAvailability}
      />

      <QuickQuantityModal 
        isOpen={Boolean(selectedSourceForQuickQty)}
        onClose={() => setSelectedSourceForQuickQty(null)}
        source={selectedSourceForQuickQty}
        onUpdate={handleUpdateQuantity}
      />

      <SellerRescueModal 
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
        sources={sources}
        onTriggerRescue={handleTriggerRescue}
      />
    </div>
  );
}
