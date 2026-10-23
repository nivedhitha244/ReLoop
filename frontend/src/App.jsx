import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GreetingBanner from './components/GreetingBanner';
import MetricsCards from './components/MetricsCards';
import WaterMap from './components/WaterMap';
import SourcesTable from './components/SourcesTable';
import ImpactGlance from './components/ImpactGlance';
import RightSidebar from './components/RightSidebar';
import { CreateDemandModal, RequestModal, RescueModal } from './components/Modals';
import { api } from './services/api';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [demands, setDemands] = useState([]);
  const [activities, setActivities] = useState([]);

  // Modals state
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [selectedSourceForRequest, setSelectedSourceForRequest] = useState(null);

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
      const [statsData, sourcesData, demandsData, actsData] = await Promise.all([
        api.getStats(),
        api.getSources(),
        api.getDemands(),
        api.getActivities()
      ]);
      setStats(statsData);
      setSources(sourcesData);
      setDemands(demandsData);
      setActivities(actsData);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter sources based on search bar query
  const filteredSources = sources.filter(src => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      src.name.toLowerCase().includes(q) ||
      src.type.toLowerCase().includes(q) ||
      src.quality.toLowerCase().includes(q)
    );
  });

  // Action handlers
  const handleCreateDemand = async (newDemand) => {
    const created = await api.createDemand(newDemand);
    await loadData();
    showToast(`Demand created for ${created.title} (${created.quantity.toLocaleString()} L)!`);
  };

  const handleRequestClick = (source) => {
    setSelectedSourceForRequest(source);
  };

  const handleConfirmMatch = async (sourceId, demandId, qty) => {
    await api.requestMatch(sourceId, demandId);
    await loadData();
    showToast(`Match requested with ${selectedSourceForRequest?.name || 'supplier'}! Allocation in progress.`);
    setSelectedSourceForRequest(null);
  };

  const handleExecuteRescue = async () => {
    const res = await api.triggerRescue();
    await loadData();
    showToast("ReLoop Rescue activated! Alternative supply dispatched.");
    return res;
  };

  return (
    <div className="reloop-app-layout">
      {/* Toast Alert */}
      {toast && (
        <div className={`reloop-toast toast-${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="toast-icon text-emerald-500" />
          ) : (
            <Info size={18} className="toast-icon text-blue-500" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenRescue={() => setIsRescueModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="reloop-main-wrapper">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNotificationClick={() => showToast("All system alerts are up to date! 3 active demands matched.", "info")}
        />

        <main className="reloop-dashboard-body">
          {/* Top Greeting Banner */}
          <GreetingBanner user={user} />

          {/* 4 Metric Cards */}
          <MetricsCards 
            stats={stats} 
            onActionClick={(tabKey) => {
              if (tabKey === 'demands') setIsDemandModalOpen(true);
              else if (tabKey === 'matches') showToast("Displaying confirmed supplier matches.");
              else if (tabKey === 'reports') {
                const csv = 'ReLoop 2.0 - Annual Impact Report 2026\nMetric,Value\nRecycled Water,12500 L\nFreshwater Conserved,8000 L\nCO2 Avoided,18.4 kg\nSavings,INR 14500\nCircularity,92%\n';
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ReLoop_Annual_Impact_Report_2026.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast("Annual water reuse impact report downloaded!", "success");
              }
              else if (tabKey === 'find-water') {
                const el = document.querySelector('.sources-table-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
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
                onViewAll={() => showToast(`Showing all ${sources.length} regional verified suppliers.`)}
              />

              {/* Impact at a Glance Card */}
              <ImpactGlance stats={stats} />
            </div>

            {/* Right Column: Quick Actions, Banner, Demands, Activity, Rescue */}
            <RightSidebar 
              demands={demands}
              activities={activities}
              onQuickAction={(actionId) => {
                if (actionId === 'find-water') {
                  const el = document.querySelector('.sources-table-card');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else if (actionId === 'my-demands') {
                  setIsDemandModalOpen(true);
                } else if (actionId === 'my-matches') {
                  showToast("Checking matching options for Green Park...");
                }
              }}
              onOpenDemandModal={() => setIsDemandModalOpen(true)}
              onOpenRescueModal={() => setIsRescueModalOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Interactive Modals */}
      <CreateDemandModal 
        isOpen={isDemandModalOpen}
        onClose={() => setIsDemandModalOpen(false)}
        onSubmit={handleCreateDemand}
      />

      <RequestModal 
        isOpen={Boolean(selectedSourceForRequest)}
        source={selectedSourceForRequest}
        demands={demands}
        onClose={() => setSelectedSourceForRequest(null)}
        onConfirm={handleConfirmMatch}
      />

      <RescueModal 
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
        onExecuteRescue={handleExecuteRescue}
      />
    </div>
  );
}
