import React, { useState, useEffect } from 'react';
import VerifierSidebar from './VerifierSidebar';
import VerifierHeader from './VerifierHeader';
import VerifierMetricsCards from './VerifierMetricsCards';
import { 
  VerifierOverviewTab, 
  VerificationQueueTab, 
  LabTestingSafetyGateTab, 
  CertifiedSourcesRegistryTab, 
  VerifierPaymentsTab, 
  QualityRiskAlertsTab, 
  VerifierSettingsTab 
} from './VerifierTabs';
import { 
  VerifierPayoutModal, 
  CertificateViewerModal 
} from './VerifierModals';
import { verifierApi } from '../../services/verifierApi';
import { CheckCircle2, AlertCircle, X, FlaskConical, Wallet } from 'lucide-react';
import '../../dashboard.css';
import './VerifierDashboard.css';

export default function VerifierDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Core Data State
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [payoutAccounts, setPayoutAccounts] = useState(null);
  const [queue, setQueue] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [payouts, setPayouts] = useState([]);

  // Selected item for audit
  const [selectedSourceForAudit, setSelectedSourceForAudit] = useState(null);

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCertForView, setSelectedCertForView] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Master Data Loader
  const loadVerifierData = async () => {
    try {
      const [profData, statsData, queueData, certsData, payoutsData] = await Promise.all([
        verifierApi.getProfile(),
        verifierApi.getStats(),
        verifierApi.getQueue(),
        verifierApi.getCertificates(),
        verifierApi.getPayouts()
      ]);

      if (profData) {
        setProfile(profData.profile);
        setWallet(profData.wallet);
        setPayoutAccounts(profData.payoutAccounts);
      }
      if (statsData) setStats(statsData);
      if (queueData) setQueue(queueData);
      if (certsData) setCertificates(certsData);
      if (payoutsData) {
        setPayouts(payoutsData.payouts || []);
        if (payoutsData.wallet) setWallet(payoutsData.wallet);
      }
    } catch (err) {
      console.warn('[VerifierDashboard] Error loading data:', err.message);
    }
  };

  useEffect(() => {
    loadVerifierData();

    // Listen to real-time mutations
    const handleMutation = () => {
      loadVerifierData();
    };
    window.addEventListener('reloop:data_updated', handleMutation);
    return () => window.removeEventListener('reloop:data_updated', handleMutation);
  }, []);

  // Handlers
  const handleSubmitAudit = async (sourceId, auditPayload) => {
    try {
      const res = await verifierApi.submitAudit(sourceId, auditPayload);
      showToast(res.message || 'Audit processed successfully!');
      loadVerifierData();
      if (auditPayload.decision === 'Approved' && res.certificate) {
        setSelectedCertForView(res.certificate);
        setIsCertModalOpen(true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit audit', 'error');
      throw err;
    }
  };

  const handleSubmitPayout = async (payoutPayload) => {
    try {
      const res = await verifierApi.requestPayout(payoutPayload);
      showToast(`Disbursed ₹${payoutPayload.amount.toLocaleString('en-IN')} via ${res.payout?.method || 'Corporate Payout'}.`);
      loadVerifierData();
      return res;
    } catch (err) {
      showToast(err.message || 'Payout failed', 'error');
      throw err;
    }
  };

  const handleSaveSettings = async (settingsPayload) => {
    try {
      await verifierApi.updateProfile(settingsPayload);
      showToast('Verifier settings saved.');
      loadVerifierData();
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const handleViewCert = (cert) => {
    setSelectedCertForView(cert);
    setIsCertModalOpen(true);
  };

  const pendingCount = queue.filter(q => q.status !== 'Approved' && q.status !== 'Rejected').length;
  const availableBal = wallet?.availableBalance ?? 32500;
  const labName = currentUser?.fullName || currentUser?.organization || "AquaCert Labs Quality Assurance";
  const todayStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <div className="reloop-app-layout verifier-app-layout">
      {/* Toast Notification Alert */}
      {toast && (
        <div className={`reloop-toast toast-${toast.type}`}>
          <div className="toast-icon-wrap">
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="toast-icon text-rose-600" />
            ) : (
              <CheckCircle2 size={18} className="toast-icon text-cyan-600" />
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
      <VerifierSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={onLogout}
        pendingAuditsCount={pendingCount}
        walletBalance={availableBal}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="reloop-main-wrapper verifier-main-wrapper">
        <VerifierHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigateTab={setActiveTab}
          onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
          walletBalance={availableBal}
          unreadCount={pendingCount}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Dashboard Body Workspace */}
        <main className="reloop-dashboard-body verifier-dashboard-body">
          {/* Greeting Banner */}
          <section className="greeting-banner-card verifier-greeting-banner">
            <div className="banner-leaf-bg">
              <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10C80 25 120 70 140 110C100 110 60 90 40 50C35 40 40 20 50 10Z" fill="#06b6d4" fillOpacity="0.16" />
                <path d="M110 5C140 25 170 60 190 100C160 95 130 80 115 50C110 40 105 20 110 5Z" fill="#0891b2" fillOpacity="0.12" />
                <circle cx="160" cy="80" r="16" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="2" fill="none" />
                <circle cx="160" cy="80" r="28" stroke="#0284c7" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            <div className="banner-left-content">
              <div className="leaf-badge-icon verifier-banner-icon">
                <FlaskConical size={22} className="leaf-svg text-cyan-600" />
              </div>
              <div className="banner-titles">
                <h1 className="banner-heading">
                  Welcome, {labName}!
                </h1>
                <p className="banner-subtext">
                  Guaranteed safe non-potable reuse through ISO 17025 accredited laboratory analysis. Water sources meeting CPCB parameters unlock for buyer matching; unsafe sources trigger instant ReLoop Rescue.
                </p>
              </div>
            </div>

            <div className="banner-right-meta">
              <span className="meta-item meta-date">{todayStr}</span>
              <button 
                type="button" 
                className="banner-withdraw-btn verifier-banner-withdraw-btn"
                onClick={() => setIsPayoutModalOpen(true)}
              >
                <Wallet size={15} />
                <span>Withdraw Audit Fees (₹{availableBal.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </section>

          {/* Top Metric Cards */}
          <VerifierMetricsCards
            stats={stats}
            onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
            onNavigateTab={setActiveTab}
          />

          {/* Tab Navigation Content */}
          <div className="verifier-tab-wrapper">
            {activeTab === 'dashboard' && (
              <VerifierOverviewTab
                stats={stats}
                queue={queue}
                certificates={certificates}
                onNavigateTab={setActiveTab}
                onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
                onSelectForAudit={(item) => setSelectedSourceForAudit(item)}
                onViewCert={handleViewCert}
              />
            )}

            {activeTab === 'queue' && (
              <VerificationQueueTab
                queue={queue}
                onSelectForAudit={(item) => setSelectedSourceForAudit(item)}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'audit-testing' && (
              <LabTestingSafetyGateTab
                selectedSource={selectedSourceForAudit}
                queue={queue}
                onSubmitAudit={handleSubmitAudit}
                onViewCert={handleViewCert}
              />
            )}

            {activeTab === 'registry' && (
              <CertifiedSourcesRegistryTab
                certificates={certificates}
                onViewCert={handleViewCert}
              />
            )}

            {activeTab === 'payments' && (
              <VerifierPaymentsTab
                wallet={wallet}
                payoutAccounts={payoutAccounts}
                payouts={payouts}
                onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
              />
            )}

            {activeTab === 'alerts' && (
              <QualityRiskAlertsTab />
            )}

            {activeTab === 'settings' && (
              <VerifierSettingsTab
                profile={profile}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <VerifierPayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableBalance={availableBal}
        payoutAccounts={payoutAccounts}
        onSubmitPayout={handleSubmitPayout}
      />

      <CertificateViewerModal
        isOpen={isCertModalOpen}
        onClose={() => { setIsCertModalOpen(false); setSelectedCertForView(null); }}
        certificate={selectedCertForView}
      />
    </div>
  );
}
