import React, { useState } from 'react';
import { 
  Droplet, 
  Droplets,
  Search, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Truck, 
  MapPin, 
  Edit3, 
  Trash2, 
  FileText, 
  Check, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Inbox, 
  Award,
  Bell
} from 'lucide-react';

// ============================================================================
// 1. OVERVIEW TAB (MAIN WORKSPACE ARRANGEMENT)
// ============================================================================
export function SellerOverviewTab({ 
  sources = [], 
  requests = [], 
  matches = [], 
  stats, 
  notifications = [], 
  onNavigateTab,
  onOpenAddSource,
  onOpenSourceDetails,
  onOpenAcceptRequest,
  onOpenRejectRequest,
  onOpenRescue
}) {
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const recentSources = sources.slice(0, 4);

  return (
    <div className="seller-overview-container">
      {/* 2-Column Main Layout: Left Main Column & Right Activity Panel */}
      <div className="dashboard-grid-content">
        {/* Left / Center Column: Sources Preview, Pending Requests Preview, Impact */}
        <div className="content-center-column">
          {/* Quick Action Ribbon */}
          <div className="seller-quick-ribbon">
            <button 
              className="ribbon-btn ribbon-btn-primary"
              onClick={onOpenAddSource}
            >
              <PlusCircle size={16} />
              <span>Add Water Source</span>
            </button>
            <button 
              className="ribbon-btn ribbon-btn-secondary"
              onClick={() => onNavigateTab('incoming-requests')}
            >
              <Inbox size={16} />
              <span>Review Requests ({pendingRequests.length})</span>
            </button>
            <button 
              className="ribbon-btn ribbon-btn-secondary"
              onClick={() => onNavigateTab('quality-verification')}
            >
              <ShieldCheck size={16} />
              <span>Quality Center</span>
            </button>
            <button 
              className="ribbon-btn ribbon-btn-rescue"
              onClick={onOpenRescue}
            >
              <ShieldAlert size={16} />
              <span>ReLoop Rescue™</span>
            </button>
          </div>

          {/* Section: My Water Sources Table Preview */}
          <div className="sources-table-card seller-preview-card">
            <div className="sources-table-header">
              <div className="table-header-left">
                <Droplets size={18} className="sources-header-icon text-teal-700" />
                <h2 className="sources-table-title">My Registered Water Sources</h2>
                <span className="badge-count-pill">{sources.length}</span>
              </div>
              <button 
                className="view-all-link-btn"
                onClick={() => onNavigateTab('my-sources')}
              >
                View all sources →
              </button>
            </div>

            <div className="table-responsive-wrapper">
              <table className="custom-reloop-table">
                <thead>
                  <tr>
                    <th>Source Name</th>
                    <th>Water Category</th>
                    <th>Available / Registered</th>
                    <th>Quality Status</th>
                    <th>Availability</th>
                    <th className="th-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSources.map((src) => (
                    <tr key={src.id} className="source-table-row">
                      <td className="td-source-name">
                        <div className="source-icon-cell">
                          <div className="source-avatar-icon bg-teal-100 text-teal-800">
                            <Droplet size={15} />
                          </div>
                          <div>
                            <span className="source-label-text block font-bold text-slate-800">{src.name}</span>
                            <span className="source-loc-sub text-xs text-slate-500">{src.location?.split(',')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="td-type">{src.type}</td>
                      <td className="td-quantity">
                        <strong className="text-emerald-700">{src.quantity.toLocaleString()} L</strong>
                        <span className="text-xs text-slate-400 block">of {src.totalRegisteredQuantity?.toLocaleString() || src.quantity.toLocaleString()} L</span>
                      </td>
                      <td className="td-quality">
                        <span className={`quality-badge badge-${(src.verificationStatus || 'Verified').toLowerCase().replace(/\s+/g, '-')}`}>
                          {src.verificationStatus === 'Verified' ? (
                            <CheckCircle2 size={12} className="badge-icon" />
                          ) : (
                            <Clock size={12} className="badge-icon" />
                          )}
                          {src.verificationStatus || 'Verified'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill pill-${src.available ? 'available' : 'unavailable'}`}>
                          {src.availabilityStatus || (src.available ? 'Available' : 'Unavailable')}
                        </span>
                      </td>
                      <td className="td-action">
                        <button 
                          className="request-btn btn-view-sm"
                          onClick={() => onOpenSourceDetails(src)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentSources.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No water sources listed yet. Click "+ Add Water Source" to register your first facility.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Incoming Buyer Requests Preview */}
          <div className="sources-table-card seller-preview-card mt-5">
            <div className="sources-table-header">
              <div className="table-header-left">
                <Inbox size={18} className="sources-header-icon text-amber-600" />
                <h2 className="sources-table-title">Incoming Buyer Requests</h2>
                <span className="badge-count-pill badge-amber">{pendingRequests.length} Pending</span>
              </div>
              <button 
                className="view-all-link-btn"
                onClick={() => onNavigateTab('incoming-requests')}
              >
                View all requests →
              </button>
            </div>

            <div className="requests-preview-list">
              {pendingRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="request-preview-card">
                  <div className="req-header-line">
                    <div className="req-buyer-info">
                      <span className="req-id">#{req.id}</span>
                      <strong className="req-buyer-name">{req.buyerOrg || req.buyerName}</strong>
                    </div>
                    <span className="status-pill pill-pending">Pending</span>
                  </div>

                  <div className="req-details-grid">
                    <div>
                      <span className="req-label">Source:</span>
                      <span className="req-val">{req.sourceName}</span>
                    </div>
                    <div>
                      <span className="req-label">Quantity:</span>
                      <span className="req-val text-emerald-700 font-bold">{req.requestedQuantity.toLocaleString()} L</span>
                    </div>
                    <div>
                      <span className="req-label">Intended Reuse:</span>
                      <span className="req-val">{req.intendedReuse}</span>
                    </div>
                    <div>
                      <span className="req-label">Delivery Date:</span>
                      <span className="req-val">{req.requestedDate}</span>
                    </div>
                  </div>

                  <div className="req-actions-row">
                    <button 
                      className="btn-req-reject"
                      onClick={() => onOpenRejectRequest(req)}
                    >
                      Decline
                    </button>
                    <button 
                      className="btn-req-accept"
                      onClick={() => onOpenAcceptRequest(req)}
                    >
                      Accept Request
                    </button>
                  </div>
                </div>
              ))}

              {pendingRequests.length === 0 && (
                <div className="empty-requests-banner">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">All buyer requests responded to!</p>
                  <span className="text-xs text-slate-400">New requests from prospective buyers will appear here in real-time.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Seller Impact Summary Glance */}
          <div className="impact-glance-card seller-impact-card mt-5">
            <div className="impact-card-header">
              <div className="impact-leaf-circle">
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <h3 className="impact-title">Seller Circularity Impact</h3>
            </div>

            <div className="impact-stats-row">
              <div className="impact-stat-item">
                <div className="stat-icon-wrap stat-icon-blue">
                  <Droplet size={18} fill="#0284c7" stroke="#0284c7" />
                </div>
                <div className="stat-content">
                  <span className="stat-highlight-val">{(stats?.totalWaterReusedDelivered || 9000).toLocaleString()} L</span>
                  <span className="stat-sub-label">Delivered & Reused</span>
                </div>
              </div>

              <div className="impact-stat-item">
                <div className="stat-icon-wrap stat-icon-green">
                  <span className="co2-badge-text">CO₂</span>
                </div>
                <div className="stat-content">
                  <span className="stat-highlight-val">{stats?.co2AvoidedKg || 14.4} kg</span>
                  <span className="stat-sub-label">Avoided Emissions <small>(est.)</small></span>
                </div>
              </div>

              <div className="impact-stat-item">
                <div className="stat-icon-wrap stat-icon-teal">
                  <span className="currency-rupee">₹</span>
                </div>
                <div className="stat-content">
                  <span className="stat-highlight-val">₹{(stats?.revenueGenerated || 3000).toLocaleString()}</span>
                  <span className="stat-sub-label">Reuse Value Created</span>
                </div>
              </div>

              <div className="impact-stat-item">
                <div className="stat-icon-wrap stat-icon-forest">
                  <Award size={18} className="text-emerald-700" />
                </div>
                <div className="stat-content">
                  <span className="stat-highlight-val">{stats?.utilizationRate || 64}%</span>
                  <span className="stat-sub-label">Inventory Utilization</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions, Recent Notifications, Rescue Card */}
        <aside className="reloop-right-column">
          {/* Quick Actions Card */}
          <div className="side-card quick-actions-card">
            <div className="side-card-header">
              <Sparkles size={16} className="text-emerald-600" />
              <h3 className="side-card-title">Quick Actions</h3>
            </div>

            <div className="quick-action-list">
              <button 
                className="quick-action-item action-green"
                onClick={onOpenAddSource}
              >
                <div className="action-circle bg-emerald-100 text-emerald-700">
                  <PlusCircle size={16} />
                </div>
                <div className="action-text">
                  <div className="action-name">Add Water Source</div>
                  <div className="action-desc">Register new effluent stream →</div>
                </div>
              </button>

              <button 
                className="quick-action-item action-amber"
                onClick={() => onNavigateTab('incoming-requests')}
              >
                <div className="action-circle bg-amber-100 text-amber-700">
                  <Inbox size={16} />
                </div>
                <div className="action-text">
                  <div className="action-name">Incoming Requests</div>
                  <div className="action-desc">{pendingRequests.length} awaiting response →</div>
                </div>
              </button>

              <button 
                className="quick-action-item action-blue"
                onClick={() => onNavigateTab('delivery-tracking')}
              >
                <div className="action-circle bg-blue-100 text-blue-700">
                  <Truck size={16} />
                </div>
                <div className="action-text">
                  <div className="action-name">Delivery Tracking</div>
                  <div className="action-desc">Monitor tanker fulfillment →</div>
                </div>
              </button>

              <button 
                className="quick-action-item action-teal"
                onClick={() => onNavigateTab('quality-verification')}
              >
                <div className="action-circle bg-teal-100 text-teal-700">
                  <ShieldCheck size={16} />
                </div>
                <div className="action-text">
                  <div className="action-name">Quality Verification</div>
                  <div className="action-desc">Lab certs & audit compliance →</div>
                </div>
              </button>
            </div>
          </div>

          {/* ReLoop Rescue Card */}
          <div className="side-card rescue-promo-card seller-rescue-promo">
            <div className="rescue-card-top">
              <div className="rescue-shield-icon">
                <ShieldAlert size={20} className="text-white" />
              </div>
              <button className="rescue-sync-icon" onClick={onOpenRescue} title="Emergency Failover">
                <RefreshCw size={17} />
              </button>
            </div>

            <h4 className="rescue-heading">ReLoop Rescue™</h4>
            <p className="rescue-desc">
              Facility maintenance or testing variance? Trigger automatic backup failover to protect buyer continuity.
            </p>

            <button 
              className="try-rescue-btn"
              onClick={onOpenRescue}
            >
              Initiate Failover Protocol →
            </button>
          </div>

          {/* Recent Notifications Feed */}
          <div className="side-card activity-card">
            <div className="side-card-header flex-between">
              <div className="header-icon-label">
                <Bell size={16} className="text-emerald-700" />
                <h3 className="side-card-title">Recent Alerts</h3>
              </div>
              <button 
                className="view-all-link-btn"
                onClick={() => onNavigateTab('notifications')}
              >
                View all →
              </button>
            </div>

            <div className="activity-list">
              {notifications.slice(0, 4).map((notif) => (
                <div 
                  key={notif.id} 
                  className={`activity-item-row clickable-notif ${!notif.read ? 'unread-item' : ''}`}
                  onClick={() => onNavigateTab(notif.targetTab || 'notifications')}
                >
                  <div className={`activity-icon-wrap icon-${notif.type || 'match'}`}>
                    {notif.type === 'request' && <Inbox size={13} />}
                    {notif.type === 'delivery' && <Truck size={13} />}
                    {notif.type === 'verification' && <ShieldCheck size={13} />}
                    {notif.type === 'match' && <CheckCircle2 size={13} />}
                    {notif.type === 'rescue' && <ShieldAlert size={13} />}
                  </div>
                  <div className="activity-text">
                    <div className="act-title-time">
                      <span className="act-title">{notif.title}</span>
                      <span className="act-time">{notif.time}</span>
                    </div>
                    <div className="act-detail">{notif.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MY WATER SOURCES TAB (COMPLETE SOURCE MANAGEMENT)
// ============================================================================
export function MyWaterSourcesTab({ 
  sources = [], 
  onOpenAddSource, 
  onOpenDetails, 
  onOpenQuickQuantity, 
  onToggleAvailability, 
  onDeleteSource,
  onNavigateTab
}) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedVerification, setSelectedVerification] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  const types = ['All', 'Treated Wastewater', 'Industrial', 'Greywater', 'Rainwater', 'RO Reject Water'];
  const statuses = ['All', 'Available', 'Unavailable', 'Pending Verification'];
  const verifications = ['All', 'Verified', 'Pending Verification', 'Expired Documentation'];

  const filtered = sources.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || s.type.toLowerCase().includes(selectedType.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || s.availabilityStatus === selectedStatus;
    const matchesVerif = selectedVerification === 'All' || s.verificationStatus === selectedVerification;
    return matchesSearch && matchesType && matchesStatus && matchesVerif;
  });

  return (
    <div className="tab-page-container">
      {/* Header Banner */}
      <div className="tab-header-banner flex-between">
        <div>
          <h2 className="tab-page-title">My Water Sources</h2>
          <p className="tab-page-subtitle">
            Manage your registered treatment facilities, update real-time quantities, and maintain safety verification.
          </p>
        </div>
        <button 
          className="btn-primary-action-pill"
          onClick={onOpenAddSource}
        >
          <PlusCircle size={16} />
          <span>Add Water Source</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="tab-filter-bar">
        <div className="tab-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search water sources, treatment types, or facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-dropdown-group">
          <select 
            className="tab-filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>

          <select 
            className="tab-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statuses.map(st => <option key={st} value={st}>{st === 'All' ? 'All Availability' : st}</option>)}
          </select>

          <select 
            className="tab-filter-select"
            value={selectedVerification}
            onChange={(e) => setSelectedVerification(e.target.value)}
          >
            {verifications.map(v => <option key={v} value={v}>{v === 'All' ? 'All Verifications' : v}</option>)}
          </select>
        </div>

        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Table
          </button>
          <button 
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="sources-table-card">
          <div className="table-responsive-wrapper">
            <table className="custom-reloop-table">
              <thead>
                <tr>
                  <th>Source Name</th>
                  <th>Water Type</th>
                  <th>Available Volume</th>
                  <th>Total Registered</th>
                  <th>Location</th>
                  <th>Verification Status</th>
                  <th>Availability</th>
                  <th>Last Updated</th>
                  <th className="th-action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((src) => (
                  <tr key={src.id} className="source-table-row">
                    <td className="td-source-name">
                      <div className="source-icon-cell">
                        <div className="source-avatar-icon bg-teal-100 text-teal-800">
                          <Droplet size={15} />
                        </div>
                        <div>
                          <strong className="source-label-text block">{src.name}</strong>
                          <span className="text-xs text-slate-400">{src.replenishmentSchedule || 'Continuous output'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="td-type">{src.type}</td>
                    <td className="td-quantity font-bold text-emerald-700">
                      {src.quantity.toLocaleString()} L
                    </td>
                    <td className="td-quantity text-slate-500">
                      {src.totalRegisteredQuantity?.toLocaleString() || src.quantity.toLocaleString()} L
                    </td>
                    <td className="td-distance" title={src.location}>
                      {src.location?.split(',')[0]}
                    </td>
                    <td className="td-quality">
                      <span className={`quality-badge badge-${(src.verificationStatus || 'Verified').toLowerCase().replace(/\s+/g, '-')}`}>
                        {src.verificationStatus === 'Verified' ? (
                          <CheckCircle2 size={12} className="badge-icon" />
                        ) : (
                          <Clock size={12} className="badge-icon" />
                        )}
                        {src.verificationStatus || 'Verified'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`status-pill clickable-pill pill-${src.available ? 'available' : 'unavailable'}`}
                        onClick={() => onToggleAvailability(src.id, !src.available)}
                        title="Click to toggle Available / Unavailable"
                      >
                        {src.availabilityStatus || (src.available ? 'Available' : 'Unavailable')}
                      </button>
                    </td>
                    <td className="text-xs text-slate-400">
                      {src.lastUpdated || 'Recently'}
                    </td>
                    <td className="td-action">
                      <div className="action-btn-cluster">
                        <button 
                          className="btn-action-icon"
                          title="View complete source details & lab parameters"
                          onClick={() => onOpenDetails(src)}
                        >
                          <FileText size={15} />
                        </button>
                        <button 
                          className="btn-action-icon text-emerald-700"
                          title="Quick update available quantity"
                          onClick={() => onOpenQuickQuantity(src)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          className="btn-action-icon text-red-500"
                          title="Deactivate or remove water source"
                          onClick={() => onDeleteSource(src.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No water sources match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="sources-card-grid">
          {filtered.map((src) => (
            <div key={src.id} className="supplier-detail-card seller-source-card">
              <div className="card-top-row">
                <div className="supplier-avatar-box">
                  <Droplet size={22} className="text-teal-700" />
                </div>
                <div className="supplier-title-wrap">
                  <h3 className="supplier-name">{src.name}</h3>
                  <span className="supplier-type-tag">{src.type}</span>
                </div>
                <span className={`quality-badge badge-${(src.verificationStatus || 'Verified').toLowerCase().replace(/\s+/g, '-')}`}>
                  {src.verificationStatus || 'Verified'}
                </span>
              </div>

              <div className="card-metrics-row">
                <div className="c-metric">
                  <span className="c-label">Available Volume</span>
                  <span className="c-val text-emerald-700 font-bold">{src.quantity.toLocaleString()} L</span>
                </div>
                <div className="c-metric">
                  <span className="c-label">Registered Capacity</span>
                  <span className="c-val text-slate-600">{src.totalRegisteredQuantity?.toLocaleString() || src.quantity.toLocaleString()} L</span>
                </div>
                <div className="c-metric">
                  <span className="c-label">Availability</span>
                  <span className={`c-val font-semibold ${src.available ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {src.availabilityStatus || (src.available ? 'Available' : 'Unavailable')}
                  </span>
                </div>
              </div>

              <div className="card-location-row">
                <MapPin size={14} className="text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-slate-600">{src.location}</span>
              </div>

              <div className="card-uses-row">
                {(src.intendedUses || ['Landscaping', 'Construction']).slice(0, 3).map((use) => (
                  <span key={use} className="use-mini-tag">{use}</span>
                ))}
              </div>

              <div className="card-footer-buttons">
                <button 
                  className="btn-card-secondary"
                  onClick={() => onOpenDetails(src)}
                >
                  View Details
                </button>
                <button 
                  className="btn-card-primary"
                  onClick={() => onOpenQuickQuantity(src)}
                >
                  Update Quantity
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. INCOMING REQUESTS TAB (SELLER RESPONSE WORKFLOW)
// ============================================================================
export function IncomingRequestsTab({ 
  requests = [], 
  onOpenAccept, 
  onOpenReject 
}) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filterTabs = ['All', 'Pending', 'Accepted', 'Rejected', 'In Progress', 'Completed'];

  const filtered = requests.filter(r => {
    const matchesFilter = selectedFilter === 'All' || r.status.toLowerCase() === selectedFilter.toLowerCase();
    const matchesSearch = !search || r.buyerName.toLowerCase().includes(search.toLowerCase()) || r.sourceName.toLowerCase().includes(search.toLowerCase()) || r.intendedReuse.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="tab-page-container">
      {/* Header Banner */}
      <div className="tab-header-banner">
        <div>
          <h2 className="tab-page-title">Incoming Buyer Requests</h2>
          <p className="tab-page-subtitle">
            Review demand allocations, confirm water suitability, and schedule tanker fulfillment.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tab-filter-bar">
        <div className="tab-search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search requests by buyer, source, or intended reuse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="tab-category-pills">
          {filterTabs.map((f) => (
            <button
              key={f}
              className={`cat-pill-btn ${selectedFilter === f ? 'active' : ''}`}
              onClick={() => setSelectedFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-full-list">
        {filtered.map((req) => (
          <div key={req.id} className="request-card-large">
            <div className="req-card-top-header">
              <div className="req-id-cluster">
                <span className="req-badge-id">#{req.id}</span>
                <span className="req-created-time">Received on {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
              <span className={`status-pill pill-${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {req.status}
              </span>
            </div>

            <div className="req-card-content-grid">
              <div className="req-info-col">
                <span className="info-col-label">Buyer Organization</span>
                <strong className="info-col-val text-slate-800 text-base">{req.buyerOrg || req.buyerName}</strong>
                <span className="text-xs text-slate-500">Intended Reuse: <strong className="text-slate-700">{req.intendedReuse}</strong></span>
              </div>

              <div className="req-info-col">
                <span className="info-col-label">Target Water Source</span>
                <span className="info-col-val font-semibold text-teal-800">{req.sourceName}</span>
                <span className="text-xs text-slate-500">Suitability: <strong className="text-emerald-700">{req.suitabilityStatus || 'Verified'}</strong></span>
              </div>

              <div className="req-info-col">
                <span className="info-col-label">Requested Quantity</span>
                <span className="info-col-val text-emerald-700 font-extrabold text-lg">
                  {req.requestedQuantity.toLocaleString()} L
                </span>
                <span className="text-xs text-slate-500">Estimated Cost: ₹{req.estimatedDeliveryCost || 1200}</span>
              </div>

              <div className="req-info-col">
                <span className="info-col-label">Delivery Destination & Window</span>
                <span className="info-col-val text-xs text-slate-700 font-medium">{req.deliveryLocation}</span>
                <span className="text-xs text-slate-500">{req.requestedDate} ({req.timeWindow || 'Morning'})</span>
              </div>
            </div>

            {req.notes && (
              <div className="req-notes-bar">
                <span className="font-semibold text-slate-600">Buyer Notes:</span> "{req.notes}"
              </div>
            )}

            {req.rejectionReason && (
              <div className="req-notes-bar text-red-600 bg-red-50 border-red-200">
                <span className="font-semibold">Declined Reason:</span> {req.rejectionReason}
              </div>
            )}

            {/* Actions for Pending Requests */}
            {req.status === 'Pending' && (
              <div className="req-card-footer-actions">
                <button 
                  className="btn-req-reject"
                  onClick={() => onOpenReject(req)}
                >
                  Decline Request
                </button>
                <button 
                  className="btn-req-accept"
                  onClick={() => onOpenAccept(req)}
                >
                  <Check size={16} />
                  <span>Accept Request & Allocate</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state-box">
            <Inbox size={36} className="text-slate-300 mb-2" />
            <h3 className="text-slate-700 font-bold text-base">No Buyer Requests Found</h3>
            <p className="text-slate-400 text-sm">There are currently no requests matching this filter status.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. MY MATCHES TAB (SHARED BUYER-SELLER WORKFLOW)
// ============================================================================
export function MyMatchesTab({ 
  matches = [], 
  onUpdateStatus, 
  onOpenRescue 
}) {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const statuses = ['All', 'Scheduled', 'In Transit', 'Delivered', 'Completed', 'Cancelled'];

  const filtered = matches.filter(m => selectedStatus === 'All' || m.status === selectedStatus);

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner">
        <div>
          <h2 className="tab-page-title">My Matches & Deliveries</h2>
          <p className="tab-page-subtitle">
            Track confirmed water-reuse contracts, monitor tanker progress, and record verified fulfillment.
          </p>
        </div>
      </div>

      <div className="tab-filter-bar">
        <div className="tab-category-pills">
          {statuses.map((st) => (
            <button
              key={st}
              className={`cat-pill-btn ${selectedStatus === st ? 'active' : ''}`}
              onClick={() => setSelectedStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="matches-full-list">
        {filtered.map((mat) => (
          <div key={mat.id} className="match-card-item">
            <div className="match-top-row">
              <div className="match-ref-badge">
                <span className="ref-tag">Match Reference:</span>
                <strong className="ref-number">#{mat.id}</strong>
                {mat.deliveryRef && (
                  <span className="delivery-ref-tag">Waybill: {mat.deliveryRef}</span>
                )}
              </div>
              <span className={`status-pill pill-${mat.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {mat.status}
              </span>
            </div>

            <div className="match-body-grid">
              <div>
                <span className="m-label">Buyer Facility</span>
                <strong className="m-val text-slate-800">{mat.buyerName}</strong>
                <span className="text-xs text-slate-500">Intended Reuse: {mat.intendedReuse}</span>
              </div>

              <div>
                <span className="m-label">Water Source</span>
                <span className="m-val font-semibold text-teal-800">{mat.sourceName}</span>
                <span className="text-xs text-slate-500">Scheduled Date: {mat.scheduledDeliveryDate || mat.matchDate}</span>
              </div>

              <div>
                <span className="m-label">Volume Reused</span>
                <span className="m-val font-bold text-emerald-700 text-lg">
                  {mat.matchedQuantity.toLocaleString()} L
                </span>
                <span className="text-xs text-slate-500">Est. Transport: ₹{mat.estimatedCost || 1500}</span>
              </div>

              <div>
                <span className="m-label">Tanker Logistics</span>
                <span className="m-val text-xs text-slate-700">{mat.driverName || 'Tanker Fleet'}</span>
                <span className="text-xs text-slate-500">Contact: {mat.driverPhone || mat.buyerContact}</span>
              </div>
            </div>

            {/* Stepper Progress Bar for Match Lifecycle */}
            <div className="match-lifecycle-stepper">
              {['Accepted', 'Scheduled', 'In Transit', 'Delivered', 'Completed'].map((stepName, idx) => {
                const statusOrder = ['Pending', 'Accepted', 'Scheduled', 'In Transit', 'Delivered', 'Completed'];
                const currentIdx = statusOrder.indexOf(mat.status);
                const stepIdx = statusOrder.indexOf(stepName);
                const isPassed = currentIdx >= stepIdx;
                const isCurrent = mat.status === stepName;

                return (
                  <div key={stepName} className={`lifecycle-step ${isPassed ? 'step-passed' : ''} ${isCurrent ? 'step-current' : ''}`}>
                    <div className="step-dot">
                      {isPassed && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="step-label">{stepName}</span>
                  </div>
                );
              })}
            </div>

            {/* Status Transition Action Buttons */}
            <div className="match-footer-actions">
              <div className="instructions-snippet">
                <span className="font-semibold text-slate-600">Instructions:</span> {mat.instructions || 'Discharge into approved storage tanks.'}
              </div>

              <div className="actions-cluster">
                {mat.status === 'Scheduled' && (
                  <button 
                    className="btn-status-advance"
                    onClick={() => onUpdateStatus(mat.id, { status: 'In Transit' })}
                  >
                    <Truck size={15} />
                    <span>Dispatch Tanker</span>
                  </button>
                )}

                {mat.status === 'In Transit' && (
                  <button 
                    className="btn-status-advance"
                    onClick={() => onUpdateStatus(mat.id, { status: 'Delivered' })}
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm Delivered</span>
                  </button>
                )}

                {mat.status === 'Delivered' && (
                  <button 
                    className="btn-status-advance"
                    onClick={() => onUpdateStatus(mat.id, { status: 'Completed' })}
                  >
                    <Award size={15} />
                    <span>Mark Completed (Water Reused)</span>
                  </button>
                )}

                {mat.status !== 'Completed' && mat.status !== 'Cancelled' && (
                  <button 
                    className="btn-report-issue"
                    onClick={onOpenRescue}
                    title="Report capacity or delivery disruption"
                  >
                    Report Issue / Rescue
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state-box">
            <Truck size={36} className="text-slate-300 mb-2" />
            <h3 className="text-slate-700 font-bold text-base">No Matches in this Category</h3>
            <p className="text-slate-400 text-sm">Matches will appear here as incoming buyer requests are accepted.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 5. QUALITY & VERIFICATION CENTER
// ============================================================================
export function QualityVerificationTab({ 
  documents = [], 
  sources = [],
  onOpenUploadDoc,
  showToast 
}) {
  const [selectedTab, setSelectedTab] = useState('All');
  const tabs = ['All', 'Verified', 'Pending Review', 'Expired'];

  const filtered = documents.filter(d => {
    if (selectedTab === 'All') return true;
    return d.status.toLowerCase().includes(selectedTab.toLowerCase());
  });

  const hasExpired = documents.some(d => d.status === 'Expired');

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner flex-between">
        <div>
          <h2 className="tab-page-title">Quality & Verification Center</h2>
          <p className="tab-page-subtitle">
            Upload accredited lab certificates, track audit validity, and maintain compliance with CPCB reuse standards.
          </p>
        </div>
        <button 
          className="btn-primary-action-pill"
          onClick={onOpenUploadDoc}
        >
          <PlusCircle size={16} />
          <span>Upload New Certificate</span>
        </button>
      </div>

      {hasExpired && (
        <div className="quality-warning-banner">
          <ShieldAlert size={20} className="text-amber-600 flex-shrink-0" />
          <div className="warning-content">
            <strong className="warning-title">Safety Compliance Alert: Expired Documentation Detected</strong>
            <p className="warning-desc">
              One or more water quality test certificates have passed their validity period. The affected water sources are automatically prevented from receiving new buyer allocations until an updated lab audit is submitted.
            </p>
          </div>
        </div>
      )}

      <div className="tab-filter-bar">
        <div className="tab-category-pills">
          {tabs.map((t) => (
            <button
              key={t}
              className={`cat-pill-btn ${selectedTab === t ? 'active' : ''}`}
              onClick={() => setSelectedTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="documents-cards-grid">
        {filtered.map((doc) => {
          const isVerified = doc.status === 'Verified';
          const isExpired = doc.status === 'Expired';
          const isPending = doc.status === 'Pending Review';

          return (
            <div key={doc.id} className="doc-verification-card">
              <div className="doc-top-header">
                <div className="doc-icon-box">
                  <FileText size={20} className="text-teal-700" />
                </div>
                <div className="doc-title-wrap">
                  <h3 className="doc-title">{doc.title}</h3>
                  <span className="doc-source-name">Source: <strong>{doc.sourceName}</strong></span>
                </div>
                <span className={`quality-badge badge-${doc.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {doc.status}
                </span>
              </div>

              <div className="doc-meta-row">
                <div className="doc-meta-item">
                  <span className="d-label">Testing Laboratory</span>
                  <span className="d-val font-semibold">{doc.labName}</span>
                </div>
                <div className="doc-meta-item">
                  <span className="d-label">Accreditation</span>
                  <span className="d-val">{doc.accreditation || 'NABL / ISO 17025'}</span>
                </div>
                <div className="doc-meta-item">
                  <span className="d-label">Issue Date</span>
                  <span className="d-val">{doc.issueDate}</span>
                </div>
                <div className="doc-meta-item">
                  <span className="d-label">Valid Until</span>
                  <span className={`d-val font-bold ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>
                    {doc.expiryDate}
                  </span>
                </div>
              </div>

              {/* Lab Measured Parameters Pill List */}
              {doc.parameters && (
                <div className="doc-parameters-block">
                  <span className="params-label">Measured Water Quality Parameters:</span>
                  <div className="param-pills-row">
                    {Object.entries(doc.parameters).map(([k, v]) => (
                      <div key={k} className="param-pill">
                        <span className="param-k">{k.toUpperCase()}</span>
                        <span className="param-v">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {doc.verificationNotes && (
                <div className="doc-notes-text">
                  <span className="font-semibold">Audit Notes:</span> {doc.verificationNotes}
                </div>
              )}

              <div className="doc-card-footer">
                <span className="file-info-tag">{doc.fileUrl?.split('/').pop()} ({doc.fileSize || '1.2 MB'})</span>
                <button 
                  className="btn-download-cert"
                  onClick={() => showToast(`Downloading official lab report #${doc.reportNumber || doc.id}...`)}
                >
                  Download Certificate PDF
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state-box col-span-full">
            <ShieldCheck size={36} className="text-slate-300 mb-2" />
            <h3 className="text-slate-700 font-bold text-base">No Documents in this Category</h3>
            <p className="text-slate-400 text-sm">Upload test certificates to maintain compliance.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. DELIVERY TRACKING TAB
// ============================================================================
export function DeliveryTrackingTab({ 
  matches = [], 
  onUpdateStatus, 
  showToast 
}) {
  const activeDeliveries = matches.filter(m => m.status === 'In Transit' || m.status === 'Scheduled');
  const pastDeliveries = matches.filter(m => m.status === 'Delivered' || m.status === 'Completed');

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner">
        <div>
          <h2 className="tab-page-title">Delivery & Tanker Tracking</h2>
          <p className="tab-page-subtitle">
            Real-time status updates for water tanker dispatches and destination unloading confirmations.
          </p>
        </div>
      </div>

      <div className="delivery-tracking-section">
        <h3 className="section-title text-base font-bold text-slate-800 mb-3">
          Active Dispatches ({activeDeliveries.length})
        </h3>

        <div className="delivery-cards-list">
          {activeDeliveries.map((del) => (
            <div key={del.id} className="delivery-card-item">
              <div className="del-header">
                <div className="del-badge-cluster">
                  <Truck size={18} className="text-teal-700" />
                  <strong className="del-id">Waybill #{del.deliveryRef || del.id}</strong>
                  <span className="del-buyer-tag">To: {del.buyerName}</span>
                </div>
                <span className={`status-pill pill-${del.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {del.status}
                </span>
              </div>

              <div className="del-body-grid">
                <div>
                  <span className="d-label">Water Source Loading Bay</span>
                  <span className="d-val text-sm font-semibold text-slate-800">{del.pickupLocation || del.sourceName}</span>
                  <span className="text-xs text-slate-500">Volume: <strong className="text-emerald-700">{del.matchedQuantity.toLocaleString()} L</strong></span>
                </div>

                <div>
                  <span className="d-label">Destination Facility</span>
                  <span className="d-val text-sm font-semibold text-slate-800">{del.destinationLocation || del.buyerName}</span>
                  <span className="text-xs text-slate-500">Planned Date: {del.scheduledDeliveryDate}</span>
                </div>

                <div>
                  <span className="d-label">Tanker Driver Details</span>
                  <span className="d-val text-sm text-slate-800">{del.driverName || 'Karthik R. (TN-09-AX-4821)'}</span>
                  <span className="text-xs text-slate-500">Phone: {del.driverPhone || '+91 97890 44556'}</span>
                </div>
              </div>

              <div className="delivery-action-footer">
                <span className="instructions-note">
                  Instructions: {del.instructions || 'Deliver to non-potable underground reservoir.'}
                </span>

                {del.status === 'Scheduled' && (
                  <button 
                    className="btn-status-advance"
                    onClick={() => onUpdateStatus(del.id, { status: 'In Transit' })}
                  >
                    <Truck size={15} />
                    <span>Mark Dispatched (In Transit)</span>
                  </button>
                )}

                {del.status === 'In Transit' && (
                  <button 
                    className="btn-status-advance"
                    onClick={() => onUpdateStatus(del.id, { status: 'Delivered' })}
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm Unloaded & Delivered</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {activeDeliveries.length === 0 && (
            <div className="empty-state-box">
              <CheckCircle2 size={32} className="text-emerald-500 mb-1" />
              <h4 className="font-bold text-slate-700">No Tankers Currently In Transit</h4>
              <p className="text-slate-400 text-xs">All scheduled matches have been fulfilled.</p>
            </div>
          )}
        </div>
      </div>

      <div className="delivery-tracking-section mt-8">
        <h3 className="section-title text-base font-bold text-slate-800 mb-3">
          Completed Deliveries ({pastDeliveries.length})
        </h3>

        <div className="table-responsive-wrapper">
          <table className="custom-reloop-table">
            <thead>
              <tr>
                <th>Delivery Ref</th>
                <th>Buyer</th>
                <th>Volume Reused</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Delivered On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pastDeliveries.map((pd) => (
                <tr key={pd.id}>
                  <td><strong>#{pd.deliveryRef || pd.id}</strong></td>
                  <td>{pd.buyerName}</td>
                  <td className="text-emerald-700 font-bold">{pd.matchedQuantity.toLocaleString()} L</td>
                  <td>{pd.sourceName}</td>
                  <td className="text-xs">{pd.destinationLocation?.split(',')[0]}</td>
                  <td className="text-xs">{pd.completedAt ? new Date(pd.completedAt).toLocaleDateString() : 'Recent'}</td>
                  <td>
                    <span className="status-pill pill-completed">Completed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. IMPACT REPORTS TAB (CIRCULARITY & REUSE ANALYTICS)
// ============================================================================
export function ImpactReportsTab({ 
  impactData, 
  stats, 
  showToast 
}) {
  const [timeRange, setTimeRange] = useState('30d');

  const totalListed = stats?.totalWaterListed || 29000;
  const totalReused = stats?.totalWaterReusedDelivered || 9000;
  const freshwaterSaved = stats?.freshwaterSaved || totalReused;
  const co2Avoided = stats?.co2AvoidedKg || 14.4;
  const revenue = stats?.revenueGenerated || 3000;
  const utilization = stats?.utilizationRate || 64;

  const monthlyTrends = impactData?.monthlyTrends || [
    { month: "May", listed: 20000, reused: 8000 },
    { month: "Jun", listed: 25000, reused: 12000 },
    { month: "Jul", listed: 28000, reused: 15500 },
    { month: "Aug", listed: 30000, reused: 14000 },
    { month: "Sep", listed: 35000, reused: 16500 },
    { month: "Oct", listed: totalListed, reused: totalReused }
  ];

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner flex-between">
        <div>
          <h2 className="tab-page-title">Seller Impact & Circularity Reports</h2>
          <p className="tab-page-subtitle">
            Demonstrating your contribution to industrial water stewardship and regional freshwater preservation.
          </p>
        </div>

        <div className="time-range-selector">
          {['7d', '30d', '90d', 'All'].map((r) => (
            <button
              key={r}
              className={`range-btn ${timeRange === r ? 'active' : ''}`}
              onClick={() => setTimeRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="impact-kpi-grid">
        <div className="kpi-card kpi-emerald">
          <span className="kpi-label">Freshwater Preserved</span>
          <span className="kpi-val">{freshwaterSaved.toLocaleString()} L</span>
          <span className="kpi-sub">Direct freshwater extraction avoided</span>
        </div>

        <div className="kpi-card kpi-blue">
          <span className="kpi-label">Total Water Listed</span>
          <span className="kpi-val">{totalListed.toLocaleString()} L</span>
          <span className="kpi-sub">Across {stats?.activeSourcesCount || 2} registered facilities</span>
        </div>

        <div className="kpi-card kpi-teal">
          <span className="kpi-label">Source Utilization Rate</span>
          <span className="kpi-val">{utilization}%</span>
          <span className="kpi-sub">Volume successfully allocated</span>
        </div>

        <div className="kpi-card kpi-forest">
          <span className="kpi-label">Avoided CO₂ Footprint</span>
          <span className="kpi-val">{co2Avoided} kg</span>
          <span className="kpi-sub">Compared to municipal freshwater pumping</span>
        </div>
      </div>

      {/* Monthly Trends SVG Chart */}
      <div className="impact-chart-card mt-6">
        <div className="chart-header">
          <h3 className="chart-title">Water Reuse vs. Listed Volume Trend</h3>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot bg-blue-400"></span> Listed Volume (L)</span>
            <span className="legend-item"><span className="legend-dot bg-emerald-500"></span> Confirmed Reused (L)</span>
          </div>
        </div>

        <div className="chart-visual-area">
          <div className="bar-chart-container">
            {monthlyTrends.map((item, idx) => {
              const maxVal = 40000;
              const listedHeight = Math.round((item.listed / maxVal) * 160);
              const reusedHeight = Math.round((item.reused / maxVal) * 160);

              return (
                <div key={item.month} className="bar-group">
                  <div className="bars-pair">
                    <div 
                      className="bar-listed" 
                      style={{ height: `${listedHeight}px` }}
                      title={`Listed: ${item.listed.toLocaleString()} L`}
                    ></div>
                    <div 
                      className="bar-reused" 
                      style={{ height: `${reusedHeight}px` }}
                      title={`Reused: ${item.reused.toLocaleString()} L`}
                    ></div>
                  </div>
                  <span className="bar-label">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="category-breakdown-card mt-6">
        <h3 className="chart-title mb-4">Water Reuse Breakdown by Source Category</h3>
        
        <div className="category-bars-list">
          {[
            { name: "Treated Wastewater (STP Effluent)", pct: 52, vol: "15,000 L", color: "bg-emerald-500" },
            { name: "Industrial Cooling Blowdown", pct: 28, vol: "8,000 L", color: "bg-teal-500" },
            { name: "Commercial & Residential Greywater", pct: 20, vol: "6,000 L", color: "bg-sky-500" }
          ].map((cat) => (
            <div key={cat.name} className="cat-bar-item mb-4">
              <div className="flex-between text-sm mb-1">
                <strong className="text-slate-800">{cat.name}</strong>
                <span className="text-slate-500">{cat.vol} ({cat.pct}%)</span>
              </div>
              <div className="progress-track h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`progress-fill ${cat.color} h-full rounded-full`} style={{ width: `${cat.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. NOTIFICATIONS TAB
// ============================================================================
export function NotificationsTab({ 
  notifications = [], 
  onMarkRead, 
  onMarkAllRead,
  onNavigateTab
}) {
  const [filter, setFilter] = useState('All');

  const filtered = notifications.filter(n => {
    if (filter === 'All') return true;
    return n.type === filter.toLowerCase();
  });

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner flex-between">
        <div>
          <h2 className="tab-page-title">Notification Center</h2>
          <p className="tab-page-subtitle">Real-time alerts on requests, quality reports, and delivery milestones.</p>
        </div>
        <button 
          className="btn-mark-all-read"
          onClick={onMarkAllRead}
        >
          Mark all as read
        </button>
      </div>

      <div className="tab-filter-bar">
        <div className="tab-category-pills">
          {['All', 'Request', 'Match', 'Delivery', 'Verification', 'Rescue'].map((f) => (
            <button
              key={f}
              className={`cat-pill-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="notifications-full-list">
        {filtered.map((notif) => (
          <div 
            key={notif.id} 
            className={`notif-card-row ${!notif.read ? 'unread-card' : ''}`}
            onClick={() => {
              if (!notif.read) onMarkRead(notif.id);
              if (notif.targetTab) onNavigateTab(notif.targetTab);
            }}
          >
            <div className={`notif-icon-col icon-${notif.type || 'match'}`}>
              {notif.type === 'request' && <Inbox size={16} />}
              {notif.type === 'delivery' && <Truck size={16} />}
              {notif.type === 'verification' && <ShieldCheck size={16} />}
              {notif.type === 'match' && <CheckCircle2 size={16} />}
              {notif.type === 'rescue' && <ShieldAlert size={16} />}
            </div>

            <div className="notif-main-text">
              <div className="notif-title-row">
                <strong className="notif-title">{notif.title}</strong>
                <span className="notif-time">{notif.time}</span>
              </div>
              <p className="notif-body">{notif.message}</p>
            </div>

            {!notif.read && <span className="unread-dot-badge"></span>}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state-box">
            <Bell size={36} className="text-slate-300 mb-2" />
            <h4 className="font-bold text-slate-700">No Notifications</h4>
            <p className="text-slate-400 text-xs">You are all caught up on alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 9. SETTINGS TAB (SELLER PROFILE & FACILITY MANAGEMENT)
// ============================================================================
export function SettingsTab({ 
  profile, 
  onSaveProfile, 
  showToast 
}) {
  const [name, setName] = useState(profile?.name || 'Apex Tech Park STP');
  const [organization, setOrganization] = useState(profile?.organization || 'Apex Commercial Facilities Ltd.');
  const [email, setEmail] = useState(profile?.email || 'supplier@reloop.org');
  const [phone, setPhone] = useState(profile?.phone || '+91 98111 22334');
  const [address, setAddress] = useState(profile?.facilityAddress || 'Plot 14-B, OMR IT Expressway, Sholinganallur');
  const [city, setCity] = useState(profile?.city || 'Chennai');
  const [operatingHours, setOperatingHours] = useState(profile?.operatingHours || '24/7 Operations');
  const [contactPerson, setContactPerson] = useState(profile?.contactPerson || 'Dr. Rajesh Sundaram, Plant Director');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile({
        name,
        organization,
        email,
        phone,
        facilityAddress: address,
        city,
        operatingHours,
        contactPerson
      });
      showToast('Facility settings updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner">
        <div>
          <h2 className="tab-page-title">Settings & Supplier Facility Profile</h2>
          <p className="tab-page-subtitle">
            Manage your registered organization credentials, facility coordinates, and notification parameters.
          </p>
        </div>
      </div>

      <div className="settings-form-card">
        <form onSubmit={handleSave}>
          <h3 className="settings-section-title">Facility & Organization Credentials</h3>

          <div className="form-grid-2col">
            <div className="form-group-item">
              <label className="field-label">Organization Legal Name</label>
              <input 
                type="text" 
                className="field-input" 
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
              />
            </div>

            <div className="form-group-item">
              <label className="field-label">Plant / Facility Display Name</label>
              <input 
                type="text" 
                className="field-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group-item">
              <label className="field-label">Official Contact Email</label>
              <input 
                type="email" 
                className="field-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group-item">
              <label className="field-label">Primary Contact Phone</label>
              <input 
                type="text" 
                className="field-input" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group-item">
            <label className="field-label">Plant Operations Director / Lead Verifier Contact</label>
            <input 
              type="text" 
              className="field-input" 
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group-item">
              <label className="field-label">Facility Street Address</label>
              <input 
                type="text" 
                className="field-input" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group-item">
              <label className="field-label">City & State</label>
              <input 
                type="text" 
                className="field-input" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group-item">
            <label className="field-label">Operating / Pumping Hours</label>
            <input 
              type="text" 
              className="field-input" 
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
            />
          </div>

          <div className="settings-submit-row">
            <button 
              type="submit" 
              className="btn-modal-submit"
              disabled={saving}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
