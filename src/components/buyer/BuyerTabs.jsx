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
} from 'lucide-react';
import WaterMap from './WaterMap';

// ============================================================================
// 1. FIND WATER TAB VIEW
// ============================================================================
export function FindWaterTab({ sources, onRequestClick, demands }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState(15);

  const categories = ['All', 'Industrial', 'Treated Wastewater', 'RO Reject Water', 'Greywater'];

  const filtered = (sources || []).filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.type.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesQuery = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase());
    const matchesDist = (s.distance || 0) <= maxDistance;
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
        {filtered.map((src) => (
          <div key={src.id} className="supplier-detail-card">
            <div className="card-top-row">
              <div className="supplier-avatar-box">
                <Droplet size={22} />
              </div>
              <div>
                <h4 className="supplier-name">{src.name}</h4>
                <span className="supplier-type-tag">{src.type}</span>
              </div>
              <span className={`quality-badge ${src.quality === 'Verified' ? 'verified' : 'pending'}`}>
                {src.quality === 'Verified' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                {src.quality}
              </span>
            </div>

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
            >
              Request Water Allocation
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
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
        {(demands || []).map((dem) => {
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
        })}
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
  onOpenRescue, 
  onRefresh, 
  showToast 
}) {
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'matches' | 'requests'

  const completedCount = matches.filter(m => m.status === 'Completed').length;
  const inTransitCount = matches.filter(m => m.status === 'In Transit' || m.status === 'Scheduled').length;
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
            const isScheduled = m.status === 'Scheduled';

            return (
              <div key={m.id} className="match-order-card" style={{ border: isCompleted ? '1px solid #a7f3d0' : isDelivered ? '2px solid #0284c7' : '1px solid #e2e8f0' }}>
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
                  <span className={`match-status-badge ${isCompleted ? 'completed' : isInTransit ? 'transit' : 'scheduled'}`}>
                    {isCompleted ? <CheckCircle2 size={14} /> : isInTransit ? <Truck size={14} /> : <Clock size={14} />}
                    {m.status}
                  </span>
                </div>

                {/* Stepper Progress */}
                <div className="delivery-stepper">
                  <div className="step-point completed">
                    <div className="step-dot">✓</div>
                    <span>Agreed</span>
                  </div>
                  <div className="step-line completed"></div>
                  <div className="step-point completed">
                    <div className="step-dot">✓</div>
                    <span>QA Lab Verified</span>
                  </div>
                  <div className={`step-line ${isInTransit || isDelivered || isCompleted ? 'completed' : ''}`}></div>
                  <div className={`step-point ${isInTransit || isDelivered || isCompleted ? 'completed' : isScheduled ? 'active' : 'pending'}`}>
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

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {isDelivered && (
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
                          gap: '6px'
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

                    {!isCompleted && !isDelivered && (
                      <button
                        className="btn-outline-sm"
                        onClick={() => showToast(`Tanker #${m.deliveryRef || m.id} is en route. Driver contact: ${m.driverPhone || "+91 97890 44556"}`, 'info')}
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
                    border: isRejected ? '1px solid #fecaca' : isAccepted ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
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
                        Requested: <strong>{r.requestedQuantity.toLocaleString()} L</strong> for <strong>{r.intendedReuse}</strong> · Scheduled for {r.requestedDate || "ASAP"}
                      </p>
                    </div>

                    <div>
                      <span className={`status-pill pill-${(r.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                        {r.status === 'Pending' ? 'Awaiting Supplier Response' : r.status}
                      </span>
                    </div>
                  </div>

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
                      Supplier notified. Inventory will be reserved upon acceptance.
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
          onClick={() => showToast('Generating official Circularity Certificate PDF...', 'success')}
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
          onClick={() => showToast('Opening certificate verification ledger...', 'info')}
        >
          <ExternalLink size={14} /> Verify On-Chain
        </button>
      </div>

      {/* Transaction Log */}
      <div className="impact-ledger-table-wrap">
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Immutable Water Impact Ledger
        </h4>
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
