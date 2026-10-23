import React, { useState } from 'react';
import {
  Search,
  Plus,
  Droplet,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Download,
  FileText,
  MapPin,
  ExternalLink,
  Sparkles,
  Layers,
  Leaf,
  Activity,
  AlertTriangle,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import WaterMap from './WaterMap';

// ============================================================================
// 1. FIND WATER TAB VIEW
// ============================================================================
export function FindWaterTab({ sources, onRequestClick, demands, requests = [] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState(15);

  const categories = ['All', 'Treated Wastewater', 'Industrial', 'Rainwater', 'RO Reject Water', 'Greywater'];

  const filtered = (sources || []).filter((s) => {
    const matchesCat = selectedCategory === 'All' || (s.type && s.type.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesQuery = !search || 
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) || 
      (s.type && s.type.toLowerCase().includes(search.toLowerCase()));
    const dist = s.distance !== undefined ? s.distance : 5.5;
    const matchesDist = dist <= maxDistance;
    return matchesCat && matchesQuery && matchesDist;
  });

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner">
        <div>
          <h2 className="tab-page-title">Find & Source Reusable Water</h2>
          <p className="tab-page-subtitle">
            Browse verified STP treated, industrial, and greywater suppliers across Chennai for your non-drinking needs.
          </p>
        </div>
      </div>

      {/* Interactive Map of Sources */}
      <div style={{ marginBottom: '24px' }}>
        <WaterMap sources={sources} demands={demands} onRequestSource={onRequestClick} />
      </div>

      {/* Filter and Search Bar */}
      <div className="tab-filter-bar">
        <div className="tab-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search suppliers, treatment types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="tab-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="distance-slider-wrap">
          <label>Max Distance: <strong>{maxDistance} km</strong></label>
          <input
            type="range"
            min="2"
            max="25"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="sources-card-grid">
        {filtered.length === 0 ? (
          <div className="empty-state-box" style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Droplet size={42} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
              No Water Sources Available
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto' }}>
              No water sources are currently registered in this filter range. Water suppliers can register facilities in the Supplier Portal to make them available here instantly.
            </p>
          </div>
        ) : (
          filtered.map((src) => {
            const activeRequestsForSource = (requests || []).filter(r => 
              r.sourceId === src.id && 
              (r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Scheduled')
            );
            const hasActive = activeRequestsForSource.length > 0;

            return (
              <div key={src.id} className="supplier-detail-card" style={hasActive ? { border: '1.5px solid #93c5fd' } : {}}>
                <div className="card-top-row">
                  <div className="supplier-avatar-box">
                    <Droplet size={22} />
                  </div>
                  <div>
                    <h4 className="supplier-name">{src.name}</h4>
                    <span className="supplier-type-tag">{src.type}</span>
                  </div>
                  <span className={`quality-badge ${(src.quality || src.verificationStatus || 'Verified') === 'Verified' ? 'verified' : 'pending'}`}>
                    {(src.quality || src.verificationStatus || 'Verified') === 'Verified' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {src.quality || src.verificationStatus || 'Verified'}
                  </span>
                </div>

                {hasActive && (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginTop: '8px'
                  }}>
                    <Clock size={12} />
                    <span><strong>{activeRequestsForSource.length} Active Request{activeRequestsForSource.length > 1 ? 's' : ''}</strong> pending response</span>
                  </div>
                )}

                <p className="supplier-desc">{src.description}</p>

                <div className="supplier-spec-grid">
                  <div className="spec-item">
                    <span className="spec-label">Capacity</span>
                    <span className="spec-val">{(src.quantity || 0).toLocaleString()} L</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Distance</span>
                    <span className="spec-val">{src.distance} km</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Est. Cost</span>
                    <span className="spec-val">₹180 / kL</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Fresh Savings</span>
                    <span className="spec-val" style={{ color: '#059669' }}>65% less</span>
                  </div>
                </div>

                <button
                  className="btn-request-match"
                  onClick={() => onRequestClick(src)}
                  style={hasActive ? { background: '#0284c7' } : {}}
                >
                  {hasActive ? 'Request Additional Allocation' : 'Request Water Allocation'}
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. MY DEMANDS TAB VIEW
// ============================================================================
export function MyDemandsTab({ demands, onOpenCreateDemand, onFindMatches }) {
  const totalLitres = (demands || []).reduce((sum, d) => sum + Number(d.quantity || d.requiredQuantity || 0), 0);
  const activeCount = (demands || []).filter((d) => d.status === 'Active' || d.status === 'Partially Matched').length;

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner">
        <div>
          <h2 className="tab-page-title">My Water Demands</h2>
          <p className="tab-page-subtitle">
            Manage your registered water demand requests, required purposes, and automated matching status.
          </p>
        </div>
        <button className="btn-primary-action" onClick={onOpenCreateDemand}>
          <Plus size={16} />
          Post New Demand
        </button>
      </div>

      {/* Summary KPI mini-bar */}
      <div className="tab-kpi-bar">
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Total Demands</span>
          <span className="kpi-mini-val">{demands?.length || 0}</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Active Sourcing</span>
          <span className="kpi-mini-val" style={{ color: '#059669' }}>{activeCount}</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Total Volume Needed</span>
          <span className="kpi-mini-val">{totalLitres.toLocaleString()} Litres</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Quality Protocol</span>
          <span className="kpi-mini-val" style={{ color: '#0284c7' }}>CPCB Class B+</span>
        </div>
      </div>

      {/* Demand Cards List */}
      <div className="demands-list-grid">
        {!demands || demands.length === 0 ? (
          <div className="empty-state-box" style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Layers size={42} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
              No Demands Registered Yet
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto 16px' }}>
              Post your facility's reusable water demand or request water from the available suppliers to get started.
            </p>
            <button className="btn-primary-action" onClick={onOpenCreateDemand} style={{ margin: '0 auto' }}>
              <Plus size={16} />
              Post First Demand
            </button>
          </div>
        ) : (
          demands.map((dem) => {
            const totalVol = Number(dem.quantity || dem.requiredQuantity || 0);
            const allocated = Number(dem.allocatedQuantity || 0);
            const fulfilled = Number(dem.fulfilledQuantity || 0);
            const remaining = dem.remainingQuantity !== undefined ? dem.remainingQuantity : Math.max(0, totalVol - allocated - fulfilled);
            const matchPercent = totalVol > 0 ? Math.min(100, Math.round(((allocated + fulfilled) / totalVol) * 100)) : 0;

            return (
              <div key={dem.id} className="demand-management-card">
                <div className="demand-card-header">
                  <div>
                    <h4 className="demand-card-title">{dem.title}</h4>
                    <span className="demand-purpose-pill">Purpose: {dem.purpose}</span>
                  </div>
                  <span className={`demand-status-badge status-${(dem.status || 'Active').toLowerCase().replace(/\s+/g, '-')}`}>
                    {dem.status || 'Active'}
                  </span>
                </div>

                <div className="demand-volume-row">
                  <div>
                    <span className="demand-vol-num">{totalVol.toLocaleString()}</span>
                    <span className="demand-vol-unit"> Litres Required</span>
                  </div>
                  <span className="demand-date">Created {dem.createdAt || 'Apr 2026'}</span>
                </div>

                <div className="demand-allocation-stats" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '8px 0', color: '#64748b' }}>
                  <span>Remaining: <strong style={{ color: remaining > 0 ? '#0f172a' : '#059669' }}>{remaining.toLocaleString()} L</strong></span>
                  <span>Allocated: <strong style={{ color: '#0284c7' }}>{allocated.toLocaleString()} L</strong></span>
                  <span>Fulfilled: <strong style={{ color: '#059669' }}>{fulfilled.toLocaleString()} L</strong></span>
                </div>

                <div className="demand-match-progress">
                  <div className="progress-labels">
                    <span>Matching Progress</span>
                    <span>{matchPercent}% covered</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${matchPercent}%`, background: matchPercent === 100 ? '#059669' : '#10b981' }}
                    ></div>
                  </div>
                </div>

                <div className="demand-card-footer">
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {dem.deliveryLocation || "Chennai, TN"}
                  </span>
                  <button
                    className="btn-outline-sm btn-find-matches-action"
                    onClick={() => onFindMatches ? onFindMatches(dem) : alert(`Finding matches for ${dem.title}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      borderColor: '#10b981',
                      color: '#065f46',
                      background: '#f0fdf4'
                    }}
                  >
                    <Sparkles size={14} className="text-emerald-600" />
                    Find Matches
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. MY MATCHES TAB VIEW (SHARED PERSISTENT MATCHES & LIVE BUYER REQUESTS)
// ============================================================================
export function MyMatchesTab({ 
  matches = [], 
  requests = [], 
  onConfirmReceipt, 
  onConfirmMatch,
  onDispatchTanker,
  onPayAndDispatch,
  onOpenRescue, 
  onRefresh, 
  showToast 
}) {
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'matches' | 'requests'

  const completedCount = matches.filter(m => m.status === 'Completed').length;
  const inTransitCount = matches.filter(m => m.status === 'In Transit' || m.status === 'Scheduled' || m.status === 'Confirmed').length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner flex-between">
        <div>
          <h2 className="tab-page-title">My Matches & Deliveries</h2>
          <p className="tab-page-subtitle">
            Track active water transport routes, monitor tanker waybills, and confirm delivered litres to verify real impact.
          </p>
        </div>
        {onRefresh && (
          <button 
            className="btn-outline-sm"
            onClick={onRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            Refresh Status
          </button>
        )}
      </div>

      {/* Mini KPI summary */}
      <div className="tab-kpi-bar" style={{ marginBottom: '20px' }}>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Confirmed Matches</span>
          <span className="kpi-mini-val">{matches.length}</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Active Delivery</span>
          <span className="kpi-mini-val" style={{ color: '#0284c7' }}>{inTransitCount}</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Pending Supplier Review</span>
          <span className="kpi-mini-val" style={{ color: '#d97706' }}>{pendingRequests}</span>
        </div>
        <div className="kpi-mini-card">
          <span className="kpi-mini-label">Completed Reuse</span>
          <span className="kpi-mini-val" style={{ color: '#059669' }}>{completedCount}</span>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="tab-category-pills" style={{ marginBottom: '20px' }}>
        <button 
          className={`cat-pill-btn ${activeSection === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSection('all')}
        >
          All Activity ({matches.length + requests.length})
        </button>
        <button 
          className={`cat-pill-btn ${activeSection === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveSection('matches')}
        >
          Active Deliveries & Matches ({matches.length})
        </button>
        <button 
          className={`cat-pill-btn ${activeSection === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveSection('requests')}
        >
          Outgoing Requests ({requests.length})
        </button>
      </div>

      {/* 1. CONFIRMED MATCHES LIST */}
      {(activeSection === 'all' || activeSection === 'matches') && (
        <div className="matches-feed" style={{ marginBottom: '32px' }}>
          {matches.length > 0 && (
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} className="text-emerald-700" />
              Confirmed Water Reuse Matches ({matches.length})
            </h3>
          )}

          {matches.map((m) => {
            const isCompleted = m.status === 'Completed';
            const isDelivered = m.status === 'Delivered';
            const isInTransit = m.status === 'In Transit';
            const isConfirmed = m.status === 'Confirmed' || m.buyerConfirmed;
            const isScheduled = m.status === 'Scheduled' && !isConfirmed;

            return (
              <div key={m.id} className="match-order-card" style={{ border: isCompleted ? '1px solid #a7f3d0' : isConfirmed ? '2px solid #059669' : isDelivered ? '2px solid #0284c7' : '1px solid #e2e8f0' }}>
                <div className="match-header-row">
                  <div>
                    <span className="match-id-pill">#{m.id}</span>
                    {m.deliveryRef && (
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
                        Waybill: <strong>{m.deliveryRef}</strong>
                      </span>
                    )}
                    <h3 className="match-route-title" style={{ marginTop: '4px' }}>
                      {m.sourceName || m.source} ➔ {m.destinationName || m.buyerName || m.destination}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`match-status-badge ${isCompleted ? 'completed' : isConfirmed ? 'completed' : isInTransit ? 'transit' : 'scheduled'}`}>
                      {isCompleted ? <CheckCircle2 size={14} /> : isConfirmed ? <CheckCircle2 size={14} /> : isInTransit ? <Truck size={14} /> : <Clock size={14} />}
                      {isConfirmed && m.status !== 'Completed' ? 'Match Confirmed' : (m.status || 'Scheduled')}
                    </span>

                    {!isCompleted && !isDelivered && !isInTransit && onPayAndDispatch && (
                      <button
                        className="btn-primary-sm"
                        onClick={() => onPayAndDispatch(m)}
                        style={{
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          color: '#fff',
                          fontWeight: 700,
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                          fontSize: '12px'
                        }}
                      >
                        <CreditCard size={14} /> Pay & Dispatch
                      </button>
                    )}
                  </div>
                </div>

                {/* Stepper Progress */}
                <div className="delivery-stepper">
                  <div className="step-point completed">
                    <div className="step-dot">✓</div>
                    <span>Agreed</span>
                  </div>
                  <div className="step-line completed"></div>
                  <div className={`step-point ${isConfirmed || isInTransit || isDelivered || isCompleted ? 'completed' : 'active'}`}>
                    <div className="step-dot">{isConfirmed || isInTransit || isDelivered || isCompleted ? '✓' : '2'}</div>
                    <span>Match Confirmed</span>
                  </div>
                  <div className={`step-line ${isInTransit || isDelivered || isCompleted ? 'completed' : ''}`}></div>
                  <div className={`step-point ${isInTransit || isDelivered || isCompleted ? 'completed' : isConfirmed ? 'active' : 'pending'}`}>
                    <div className="step-dot">{isInTransit ? '🚚' : isDelivered || isCompleted ? '✓' : '3'}</div>
                    <span>Dispatched</span>
                  </div>
                  <div className={`step-line ${isDelivered || isCompleted ? 'completed' : ''}`}></div>
                  <div className={`step-point ${isCompleted ? 'completed' : isDelivered ? 'active' : 'pending'}`}>
                    <div className="step-dot">{isCompleted ? '✓' : isDelivered ? '📦' : '4'}</div>
                    <span>Delivered & Confirmed</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="match-details-grid">
                  <div className="m-detail-item">
                    <span className="m-label">Volume</span>
                    <span className="m-val">{(m.matchedQuantity || m.quantity || m.volume || 0).toLocaleString()} Litres</span>
                  </div>
                  <div className="m-detail-item">
                    <span className="m-label">Logistics Fleet</span>
                    <span className="m-val">{m.driverName || m.transporter || "EcoFlow Tanker Fleet"}</span>
                  </div>
                  <div className="m-detail-item">
                    <span className="m-label">Scheduled Date / ETA</span>
                    <span className="m-val">{m.scheduledDeliveryDate || m.matchDate || "Same Day"}</span>
                  </div>
                  <div className="m-detail-item">
                    <span className="m-label">QA Compliance</span>
                    <span className="m-val" style={{ color: '#059669' }}>
                      <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      Verified (CPCB Class B)
                    </span>
                  </div>
                </div>

                <div className="match-action-bar">
                  <div className="savings-callout">
                    Est. Cost ₹{m.estimatedCost || m.cost || 1200} · <strong style={{ color: '#059669' }}>Real Freshwater Savings: {(m.matchedQuantity || m.quantity || 4000).toLocaleString()} L</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                    {/* Step 4: Confirm Receipt when In Transit or Delivered */}
                    {(isDelivered || isInTransit) && onConfirmReceipt && (
                      <button
                        className="btn-primary-sm"
                        onClick={() => onConfirmReceipt(m.id)}
                        style={{
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          color: '#fff',
                          fontWeight: 700,
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle2 size={15} />
                        Confirm Receipt & Complete Reuse
                      </button>
                    )}

                    {isCompleted && (
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={16} /> Water Confirmed Reused
                      </span>
                    )}

                    {/* Step 2: Accept & Confirm Match */}
                    {!isCompleted && !isDelivered && !isInTransit && !isConfirmed && onConfirmMatch && (
                      <button
                        className="btn-primary-sm"
                        onClick={() => onConfirmMatch(m.id)}
                        style={{
                          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                          color: '#fff',
                          fontWeight: 700,
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)'
                        }}
                      >
                        <CheckCircle2 size={15} />
                        Accept & Confirm Match
                      </button>
                    )}

                    {/* Step 3: Pay & Dispatch Option */}
                    {!isCompleted && !isDelivered && !isInTransit && (
                      <>
                        {isConfirmed && (
                          <span style={{ fontSize: '13px', color: '#059669', fontWeight: 700, background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={16} /> Match Confirmed
                          </span>
                        )}
                        {onPayAndDispatch ? (
                          <button
                            className="btn-primary-sm"
                            onClick={() => onPayAndDispatch(m)}
                            style={{
                              background: 'linear-gradient(135deg, #059669, #10b981)',
                              color: '#fff',
                              fontWeight: 700,
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <CreditCard size={15} /> Pay & Dispatch Tanker
                          </button>
                        ) : onDispatchTanker && (
                          <button
                            className="btn-primary-sm"
                            onClick={() => onDispatchTanker(m.id)}
                            style={{
                              background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                              color: '#fff',
                              fontWeight: 700,
                              padding: '8px 14px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Truck size={14} /> Dispatch Tanker Now
                          </button>
                        )}
                      </>
                    )}

                    {!isCompleted && (
                      <button
                        className="btn-outline-sm"
                        onClick={() => showToast(`Tanker #${m.deliveryRef || m.id} is assigned. Driver: ${m.driverName || "Senthil Kumar"} (${m.driverPhone || "+91 97890 44556"})`, 'info')}
                      >
                        <Truck size={14} />
                        Track Tanker
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. OUTGOING BUYER REQUESTS LIST */}
      {(activeSection === 'all' || activeSection === 'requests') && requests.length > 0 && (
        <div className="requests-feed" style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={18} className="text-teal-700" />
            Outgoing Water Requests ({requests.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((r) => {
              const isPending = r.status === 'Pending';
              const isAccepted = r.status === 'Accepted';
              const isRejected = r.status === 'Rejected';

              return (
                <div 
                  key={r.id} 
                  style={{
                    background: '#fff',
                    border: isRejected ? '1px solid #fecaca' : isAccepted ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                          #{r.id}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          Request to {r.sourceName}
                        </h4>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                        Requested: <strong>{(r.requestedQuantity || 0).toLocaleString()} L</strong> for <strong>{r.intendedReuse}</strong> · Scheduled for {r.requestedDate || "ASAP"}
                      </p>
                    </div>

                    <div>
                      <span className={`status-pill pill-${(r.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                        {r.status === 'Pending' ? 'Awaiting Supplier Response' : r.status === 'Accepted' ? 'Supplier Accepted' : r.status}
                      </span>
                    </div>
                  </div>

                  {/* Pending Notice */}
                  {isPending && (
                    <div style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} className="text-amber-500" />
                      <span>Waiting for supplier acceptance. Payment is only required after the supplier accepts your request and the match is confirmed.</span>
                    </div>
                  )}

                  {/* Supplier Accepted - Buyer Accept & Pay banner */}
                  {isAccepted && (
                    <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ color: '#166534', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          Supplier Accepted Allocation!
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#15803d' }}>
                          Supplier approved your water allocation. Proceed to payment to authorize logistics and dispatch tanker.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {onPayAndDispatch ? (
                          <button
                            className="btn-primary-sm"
                            onClick={() => onPayAndDispatch({
                              id: r.matchId || r.id,
                              sourceName: r.sourceName,
                              matchedQuantity: r.requestedQuantity,
                              waterCategory: r.intendedReuse || 'Treated Wastewater',
                              destinationName: r.deliveryLocation || 'Facility Destination'
                            })}
                            style={{
                              background: 'linear-gradient(135deg, #059669, #10b981)',
                              color: '#fff',
                              fontWeight: 700,
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <CreditCard size={15} />
                            Pay & Authorize Tanker
                          </button>
                        ) : onConfirmMatch && (
                          <button
                            className="btn-primary-sm"
                            onClick={() => onConfirmMatch(r.matchId || r.id)}
                            style={{
                              background: 'linear-gradient(135deg, #059669, #10b981)',
                              color: '#fff',
                              fontWeight: 700,
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <CheckCircle2 size={15} />
                            Buyer Accept Match (Confirm)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirmed Banner */}
                  {r.status === 'Confirmed' && (
                    <div style={{ marginTop: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontSize: '13px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>✓ Match Confirmed by Buyer! Tanker dispatch is ready and active under Confirmed Matches above.</span>
                    </div>
                  )}

                  {/* Rejection Alert Banner with Rescue Trigger */}
                  {isRejected && (
                    <div style={{ marginTop: '12px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ color: '#c53030', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Declined Reason: {r.rejectionReason || "Unavailable for requested window"}
                      </div>
                      {r.rejectionNotes && (
                        <div style={{ fontSize: '12px', color: '#742a2a', marginBottom: '8px' }}>
                          Note: "{r.rejectionNotes}"
                        </div>
                      )}
                      <button
                        className="btn-rescue-action"
                        onClick={() => onOpenRescue ? onOpenRescue(r.demandId, r.sourceId, r.rejectionReason) : showToast("Scanning backup suppliers...", 'info')}
                        style={{
                          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ShieldAlert size={14} />
                        Find Alternative Sources (ReLoop Rescue™)
                      </button>
                    </div>
                  )}

                  {isPending && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} />
                      Supplier notified. Once accepted, you can confirm the match here.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {matches.length === 0 && requests.length === 0 && (
        <div className="empty-state-box" style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <Truck size={42} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>
            No Matches or Requests Found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
            You haven't requested any water allocations yet. Go to <strong>My Demands</strong> and click <strong>Find Matches</strong> to discover verified suppliers!
          </p>
        </div>
      )}
    </div>
  );
}


// ============================================================================
// 4. RELOOP RESCUE TAB VIEW
// ============================================================================
export function ReloopRescueTab({ onOpenRescueModal }) {
  return (
    <div className="tab-page-container">
      <div className="rescue-hero-card">
        <div className="rescue-hero-left">
          <div className="rescue-badge-pill">
            <ShieldAlert size={14} />
            AUTOMATED REDUNDANCY & FAILOVER
          </div>
          <h2 className="rescue-hero-title">ReLoop Rescue™ Continuous Supply Shield</h2>
          <p className="rescue-hero-desc">
            Water disruptions happen. When an active water supplier experiences an unexpected shortage,
            contamination alert, or audit failure, ReLoop Rescue automatically re-routes your required supply
            to verified alternatives within a 10 km radius in seconds.
          </p>

          <div className="rescue-actions-row">
            <button className="btn-rescue-action" onClick={onOpenRescueModal}>
              ⚡ Run Live Rescue Simulation
            </button>
            <span className="rescue-status-tag">
              <CheckCircle2 size={15} /> All 4 Alternative Nodes Standby
            </span>
          </div>
        </div>
      </div>

      {/* 3 Step Architecture */}
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '28px 0 16px' }}>
        How ReLoop Rescue™ Protects Your Water Continuity:
      </h3>
      <div className="rescue-steps-grid">
        <div className="rescue-step-card">
          <div className="step-num-icon">1</div>
          <h4>Instant Anomaly Detection</h4>
          <p>Continuous IoT sensor audits and verifier test checks detect water purity drops or volume anomalies before delivery.</p>
        </div>
        <div className="rescue-step-card">
          <div className="step-num-icon">2</div>
          <h4>10 km Radius Spatial Scan</h4>
          <p>Our spatial matching engine searches nearby suppliers with pre-approved water quality criteria matching your exact application.</p>
        </div>
        <div className="rescue-step-card">
          <div className="step-num-icon">3</div>
          <h4>Automated Fleet Re-Route</h4>
          <p>Transporters receive dynamic route updates on their GPS terminal to pick up from the fallback supplier with zero manual friction.</p>
        </div>
      </div>

      {/* Standby Nodes */}
      <div className="standby-nodes-box">
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
          Active Backup Redundancy Nodes (Chennai Metro):
        </h4>
        <div className="nodes-table">
          <div className="node-row">
            <span>🏭 <strong>Apex STP Plant Secondary Basin</strong></span>
            <span>7,000 L Reserve</span>
            <span className="node-dist">4.2 km</span>
            <span className="node-ready">Ready for Failover</span>
          </div>
          <div className="node-row">
            <span>🏢 <strong>Tidel Tech Park Industrial Cooling Return</strong></span>
            <span>4,000 L Reserve</span>
            <span className="node-dist">5.8 km</span>
            <span className="node-ready">Ready for Failover</span>
          </div>
          <div className="node-row">
            <span>🏢 <strong>Olympia Tech Park Dual Filter System</strong></span>
            <span>6,500 L Reserve</span>
            <span className="node-dist">7.1 km</span>
            <span className="node-ready">Ready for Failover</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. IMPACT REPORTS TAB VIEW
// ============================================================================
export function ImpactReportsTab({ stats, showToast }) {
  const handleDownloadCertificate = () => {
    const volume = (stats?.freshwaterSaved || 10000).toLocaleString();
    const certHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ReLoop 2.0 - Government CPCB Verified Green Facility Certificate</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
    .cert-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 4px double #059669; border-radius: 16px; padding: 48px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: center; }
    .cert-logo { font-size: 26px; font-weight: 800; color: #059669; letter-spacing: -0.5px; margin-bottom: 8px; }
    .cert-tagline { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
    .cert-badge { display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px; }
    .cert-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 16px; }
    .cert-subtitle { font-size: 15px; color: #475569; line-height: 1.6; max-width: 620px; margin: 0 auto 32px; }
    .cert-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
    .cert-box { background: #f1f5f9; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .cert-box-val { font-size: 20px; font-weight: 800; color: #059669; }
    .cert-box-lbl { font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; }
    .cert-footer { border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; text-align: left; }
    .cert-hash { font-family: monospace; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; }
    @media print { body { background: #fff; padding: 0; } .cert-container { box-shadow: none; border-color: #059669; } }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="cert-logo">💧 ReLoop 2.0</div>
    <div class="cert-tagline">National Circular Water Reuse Authority</div>
    <div class="cert-badge">✓ CPCB & TNPCB Verified Water Circularity</div>
    <h1 class="cert-title">Certificate of Environmental Stewardship</h1>
    <p class="cert-subtitle">
      This official certificate verifies that <strong>Green Park Sustainable Facility</strong> has successfully diverted, treated, and recycled secondary treated wastewater in accordance with National Green Tribunal (NGT) circularity guidelines.
    </p>
    <div class="cert-grid">
      <div class="cert-box">
        <div class="cert-box-val">${volume} L</div>
        <div class="cert-box-lbl">Freshwater Conserved</div>
      </div>
      <div class="cert-box">
        <div class="cert-box-val">18.4 kg</div>
        <div class="cert-box-lbl">Avoided CO₂ Emissions</div>
      </div>
      <div class="cert-box">
        <div class="cert-box-val">92%</div>
        <div class="cert-box-lbl">Circularity Score</div>
      </div>
    </div>
    <div class="cert-footer">
      <div>
        <strong>Verification Hash:</strong> <span class="cert-hash">0x98f4e210a47b8c02f1d5e9</span><br>
        <strong>Registry Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div style="text-align: right;">
        <strong>Authorized Signatory:</strong><br>
        Central Pollution Control Board (CPCB) Division
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([certHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ReLoop_Circularity_Certificate_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) {
      showToast('Circularity Certificate downloaded to your computer!', 'success');
    }
  };

  const handleExportLedgerCsv = () => {
    const csvContent =
      'Transaction ID,Date,Source,Litres Reused,Freshwater Avoided,Verifier QA,Ledger Status\n' +
      '#LEDG-9901,Oct 21 2026,Factory A STP,4000,8000,Passed,Confirmed\n' +
      '#LEDG-9884,Oct 19 2026,Apartment Complex,3500,7000,Passed,Confirmed\n' +
      '#LEDG-9842,Oct 17 2026,IT Park RO Plant,4000,8000,Passed,Confirmed\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ReLoop_Water_Impact_Ledger_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) {
      showToast('Impact Ledger CSV downloaded to your computer!', 'success');
    }
  };

  const handleVerifyOnChain = () => {
    const proof = {
      registry: "ReLoop National Circular Water Exchange",
      issuer: "Central Pollution Control Board (CPCB) Verification Node #04",
      facility: "Green Park Sustainable Facility",
      certificateId: "TNPCB-2026-CIRC-09214",
      smartContract: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      blockHeight: 18492041,
      timestamp: new Date().toISOString(),
      merkleRoot: "0x98f4e210a47b8c02f1d5e9b87a32c610e7492cda12f671bbce924871d36a9082",
      signature: "0xfa4891bca7289b01c38fa8921be4a8739218ab4889c83912dfa",
      complianceStatus: "VALID_NON_REVOKED"
    };

    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ReLoop_Circularity_Proof_0x98f4e210.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) {
      showToast('On-chain verification proof downloaded!', 'success');
    }
  };

  return (
    <div className="tab-page-container">
      <div className="tab-header-banner">
        <div>
          <h2 className="tab-page-title">Water Impact Ledger & Sustainability Reports</h2>
          <p className="tab-page-subtitle">
            Cryptographically logged proof of circular water usage, freshwater conservation, and ESG compliance.
          </p>
        </div>
        <button
          className="btn-primary-action"
          onClick={handleDownloadCertificate}
        >
          <Download size={16} />
          Download Certificate
        </button>
      </div>

      {/* Big Impact Numbers */}
      <div className="impact-kpi-quad">
        <div className="impact-kpi-tile">
          <div className="kpi-tile-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Droplet size={24} />
          </div>
          <div>
            <span className="impact-stat-big">{(stats?.freshwaterSaved || 8000).toLocaleString()} L</span>
            <span className="impact-stat-label">Freshwater Conserved</span>
          </div>
        </div>

        <div className="impact-kpi-tile">
          <div className="kpi-tile-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Leaf size={24} />
          </div>
          <div>
            <span className="impact-stat-big">18.4 kg</span>
            <span className="impact-stat-label">Avoided CO₂ Emissions</span>
          </div>
        </div>

        <div className="impact-kpi-tile">
          <div className="kpi-tile-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="impact-stat-big">₹{(stats?.transportCost || 14500).toLocaleString()}</span>
            <span className="impact-stat-label">Total Water Expense Saved</span>
          </div>
        </div>

        <div className="impact-kpi-tile">
          <div className="kpi-tile-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="impact-stat-big">92%</span>
            <span className="impact-stat-label">Circularity Index Score</span>
          </div>
        </div>
      </div>

      {/* Official Certificate Banner */}
      <div className="cert-preview-card">
        <div className="cert-seal">
          <ShieldCheck size={36} color="#059669" />
        </div>
        <div className="cert-info">
          <h3>Government CPCB Verified Green Facility Certificate</h3>
          <p>
            Issued to <strong>Green Valley Apartments</strong> for circular water recycling in compliance with
            TNPCB & CPCB 2026 Water Sustainability Mandates. Hash: <code>0x98f4...e210</code>
          </p>
        </div>
        <button
          className="btn-outline-sm"
          onClick={handleVerifyOnChain}
        >
          <ExternalLink size={14} /> Verify On-Chain
        </button>
      </div>

      {/* Transaction Log */}
      <div className="impact-ledger-table-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Immutable Water Impact Ledger
          </h4>
          <button
            className="btn-outline-sm"
            onClick={handleExportLedgerCsv}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 14px' }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Source</th>
              <th>Litres Reused</th>
              <th>Freshwater Avoided</th>
              <th>Verifier QA</th>
              <th>Ledger Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>#LEDG-9901</code></td>
              <td>Oct 21, 2026</td>
              <td>Factory A STP</td>
              <td>4,000 L</td>
              <td>8,000 L eq.</td>
              <td><span className="badge-pass">Passed</span></td>
              <td><span className="badge-confirmed">Confirmed</span></td>
            </tr>
            <tr>
              <td><code>#LEDG-9884</code></td>
              <td>Oct 19, 2026</td>
              <td>Apartment Complex</td>
              <td>3,500 L</td>
              <td>7,000 L eq.</td>
              <td><span className="badge-pass">Passed</span></td>
              <td><span className="badge-confirmed">Confirmed</span></td>
            </tr>
            <tr>
              <td><code>#LEDG-9842</code></td>
              <td>Oct 17, 2026</td>
              <td>IT Park RO Plant</td>
              <td>4,000 L</td>
              <td>8,000 L eq.</td>
              <td><span className="badge-pass">Passed</span></td>
              <td><span className="badge-confirmed">Confirmed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
