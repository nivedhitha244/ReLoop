import React, { useState } from 'react';
import { 
  X, 
  Droplet, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2, 
  MapPin, 
  Zap, 
  AlertCircle,
  FileText
} from 'lucide-react';

export function CreateDemandModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState(3000);
  const [purpose, setPurpose] = useState('Irrigation');
  const [location, setLocation] = useState('Chennai, Tamil Nadu');
  const [needQualityCheck, setNeedQualityCheck] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      quantity: Number(quantity),
      purpose,
      location,
      needQualityCheck
    });
    setTitle('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-blue-100 text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="modal-title">Create Water Demand</h3>
              <p className="modal-subtitle">Post a new reusable water demand request to the network</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Facility / Destination Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Green Park Sector 4, Sports Arena" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Quantity Needed (Litres)</label>
              <input 
                type="number" 
                step="500" 
                min="500" 
                className="form-input" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reuse Purpose</label>
              <select 
                className="form-select"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="Irrigation">Irrigation / Landscaping</option>
                <option value="Construction">Construction & Dust Control</option>
                <option value="Industrial">Industrial Cooling Tower</option>
                <option value="Flushing">Toilet Flushing & Utilities</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Location</label>
            <div className="input-with-icon">
              <MapPin size={16} className="input-icon" />
              <input 
                type="text" 
                className="form-input with-icon" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Quality Check Option */}
          <div className="qc-question-section" style={{ marginTop: '12px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} className="text-emerald-600" />
              Do you need a Quality Check for this demand?
            </label>
            <div className="quality-check-toggle-row">
              <button
                type="button"
                className={`btn-toggle-qc ${needQualityCheck ? 'active' : ''}`}
                onClick={() => setNeedQualityCheck(true)}
              >
                ✓ Yes, Require Quality Check
              </button>
              <button
                type="button"
                className={`btn-toggle-qc ${!needQualityCheck ? 'active' : ''}`}
                onClick={() => setNeedQualityCheck(false)}
              >
                ✕ No, Direct Supply
              </button>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Demand Request</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RequestModal({ isOpen, onClose, source, demands, onConfirm }) {
  const [selectedDemandId, setSelectedDemandId] = useState(demands[0]?.id || '');
  const [requestedLiters, setRequestedLiters] = useState(source?.quantity || 4000);
  const [needQualityCheck, setNeedQualityCheck] = useState(true);

  if (!isOpen || !source) return null;

  const handleConfirm = () => {
    onConfirm(source.id, selectedDemandId, requestedLiters, needQualityCheck);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container request-allocation-modal">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-emerald-100 text-emerald-600">
              <Droplet size={20} />
            </div>
            <div>
              <h3 className="modal-title">Request Water Allocation</h3>
              <p className="modal-subtitle">Connect with {source.name} for treated water delivery</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="source-summary-box">
            <div className="summary-row">
              <span className="summary-label">Selected Supplier:</span>
              <strong className="summary-val">{source.name}</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Water Category:</span>
              <span className="summary-val">{source.type}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Available Capacity:</span>
              <span className="summary-val">{source.quantity.toLocaleString()} L</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Distance:</span>
              <span className="summary-val">{source.distance} km</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Quality Status:</span>
              <span className={`quality-badge badge-${source.quality.toLowerCase()}`}>
                {source.quality}
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Allocate To My Demand Request</label>
            <select 
              className="form-select"
              value={selectedDemandId}
              onChange={(e) => setSelectedDemandId(e.target.value)}
            >
              {demands.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} — {d.quantity.toLocaleString()} L ({d.purpose})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Requested Volume (Litres)</label>
            <input 
              type="number"
              max={source.quantity}
              className="form-input"
              value={requestedLiters}
              onChange={(e) => setRequestedLiters(e.target.value)}
            />
          </div>

          {/* Quality Check Decision Question */}
          <div className="qc-question-section">
            <div className="qc-question-header">
              <ShieldCheck size={18} className="qc-question-icon" />
              <div>
                <h4 className="qc-question-title">Do you need a Quality Check before delivery?</h4>
                <p className="qc-question-desc">Choose whether an accredited verifier should inspect and certify this batch.</p>
              </div>
            </div>

            <div className="qc-choices-grid">
              <button
                type="button"
                className={`qc-choice-btn ${needQualityCheck === true ? 'selected-yes' : ''}`}
                onClick={() => setNeedQualityCheck(true)}
              >
                <div className="qc-radio-bullet">{needQualityCheck === true ? '✓' : '○'}</div>
                <div className="qc-choice-content">
                  <div className="qc-choice-title">
                    <span>Yes, I need Quality Check</span>
                    <span className="qc-pill-badge">Recommended</span>
                  </div>
                  <p className="qc-choice-sub">
                    Accredited Verifier tests TDS, pH, and BOD levels with digital CPCB certification before tanker dispatch.
                  </p>
                </div>
              </button>

              <button
                type="button"
                className={`qc-choice-btn ${needQualityCheck === false ? 'selected-no' : ''}`}
                onClick={() => setNeedQualityCheck(false)}
              >
                <div className="qc-radio-bullet">{needQualityCheck === false ? '✓' : '○'}</div>
                <div className="qc-choice-content">
                  <div className="qc-choice-title">
                    <span>No Quality Check needed</span>
                  </div>
                  <p className="qc-choice-sub">
                    Direct dispatch based on supplier self-declared specs. Faster turnaround without lab test.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>
            Confirm Matching & Routing
          </button>
        </div>
      </div>
    </div>
  );
}

export function RescueModal({ isOpen, onClose, onExecuteRescue }) {
  const [status, setStatus] = useState('idle'); // idle | running | success
  const [rescueResult, setRescueResult] = useState(null);

  if (!isOpen) return null;

  const runRescue = async () => {
    setStatus('running');
    setTimeout(async () => {
      const result = await onExecuteRescue();
      setRescueResult(result);
      setStatus('success');
    }, 1200);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container rescue-modal">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-teal-800 text-teal-200">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="modal-title">ReLoop Rescue™ Emergency Routing</h3>
              <p className="modal-subtitle">Automated fallback algorithm when a primary supplier is offline</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {status === 'idle' && (
            <div className="rescue-step-box">
              <div className="rescue-alert-notice">
                <AlertCircle size={20} className="text-amber-500" />
                <p>
                  Did a water source drop offline or fail quality standards? 
                  ReLoop Rescue automatically scans local verified producers (STP, Greywater, Industrial) 
                  within a 10 km radius and matches an instant backup.
                </p>
              </div>

              <div className="rescue-features-list">
                <div className="rescue-feat-item">
                  <Zap size={16} className="text-teal-600" />
                  <span>Instant geo-distance re-route</span>
                </div>
                <div className="rescue-feat-item">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Only 100% lab-verified backups</span>
                </div>
                <div className="rescue-feat-item">
                  <Droplet size={16} className="text-blue-600" />
                  <span>Zero interruption to ongoing irrigation & construction</span>
                </div>
              </div>
            </div>
          )}

          {status === 'running' && (
            <div className="rescue-loading-state">
              <div className="pulse-spinner"></div>
              <h4>Analyzing Network & Calculating Optimal Alternative...</h4>
              <p>Scanning 4 nearby sources against Green Park demand requirements.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="rescue-success-state">
              <div className="success-icon-wrap">
                <CheckCircle2 size={36} className="text-emerald-500" />
              </div>
              <h4 className="success-title">Emergency Backup Locked In!</h4>
              <p className="success-subtitle">
                Successfully redirected supply from <strong>Apartment Complex</strong> (Greywater, 3,000 L, 4.2 km)
                to fulfill Green Park irrigation.
              </p>
              <div className="stat-pill-summary">
                <span>Distance: 4.2 km</span> · <span>Quality: Verified</span> · <span>Status: Dispatched</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {status === 'idle' && (
            <>
              <button className="btn-cancel" onClick={onClose}>Close</button>
              <button className="btn-primary btn-rescue-primary" onClick={runRescue}>
                Activate ReLoop Rescue Now
              </button>
            </>
          )}
          {status === 'success' && (
            <button className="btn-primary" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Intelligent Matching Results Modal
 * Discovers, filters, and ranks eligible water sources for a specific demand.
 */
export function DemandMatchesModal({ isOpen, onClose, demand, onSelectSourceForRequest, onRequestWater }) {
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState(25);
  const [requestingSourceId, setRequestingSourceId] = useState(null);

  React.useEffect(() => {
    if (!isOpen || !demand) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/demands/${demand.id}/matches`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to evaluate matching sources.");
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setMatchData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [isOpen, demand]);

  if (!isOpen || !demand) return null;

  const eligible = (matchData?.eligibleMatches || []).filter(m => {
    const matchesCat = selectedCategory === 'All' || m.waterCategory.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesDist = (m.distanceKm || 0) <= maxDistance;
    return matchesCat && matchesDist;
  });

  const categories = ['All', 'Treated Wastewater', 'Industrial', 'Greywater', 'RO Reject Water', 'Rainwater'];

  const handleSendRequest = async (candidate) => {
    try {
      setRequestingSourceId(candidate.sourceId);
      await onRequestWater(candidate, demand);
      onClose();
    } catch (err) {
      alert(`Error requesting water: ${err.message}`);
    } finally {
      setRequestingSourceId(null);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container demand-matches-modal" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-emerald-100 text-emerald-800">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="modal-title">Intelligent Water Matches for "{demand.title}"</h3>
              <p className="modal-subtitle">
                Target Demand: <strong>{(demand.quantity || demand.requiredQuantity || 0).toLocaleString()} L</strong> · Intended Reuse: <strong>{demand.purpose}</strong> · Location: <strong>{demand.deliveryLocation || "Chennai"}</strong>
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 24px' }}>
          {/* Quick Filters */}
          <div className="tab-filter-bar" style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div className="tab-category-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <label>Max Dist: <strong>{maxDistance} km</strong></label>
              <input
                type="range"
                min="2"
                max="30"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Partial Fulfillment Multi-Source Banner if applicable */}
          {matchData?.partialFulfillmentPlan && !matchData.partialFulfillmentPlan.hasSingleSourceFullFulfillment && matchData.partialFulfillmentPlan.allocations.length > 1 && (
            <div className="partial-fulfillment-banner" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                <CheckCircle2 size={16} />
                <span>Multi-Supplier Partial Fulfillment Solution</span>
              </div>
              <p style={{ fontSize: '12px', color: '#047857', margin: 0 }}>
                A single supplier cannot cover 100% of this demand volume. The matching engine identified a combination of {matchData.partialFulfillmentPlan.allocations.length} eligible suppliers capable of fulfilling {matchData.partialFulfillmentPlan.coveredQuantity.toLocaleString()} L:
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                {matchData.partialFulfillmentPlan.allocations.map((a, idx) => (
                  <span key={a.sourceId} style={{ background: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #6ee7b7', color: '#064e3b' }}>
                    #{idx + 1} {a.sourceName}: <strong>{a.allocatedQuantity.toLocaleString()} L</strong> ({a.distanceKm} km away)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div className="pulse-spinner" style={{ margin: '0 auto 12px' }}></div>
              <p style={{ fontWeight: 600 }}>Running Intelligent Matching Engine (CPCB Safety & Proximity Rules)...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px', color: '#b91c1c' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Error loading matching candidates: {error}</p>
            </div>
          )}

          {/* Eligible candidates list */}
          {!loading && !error && eligible.length > 0 && (
            <div className="matched-sources-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {eligible.map((candidate, idx) => (
                <div 
                  key={candidate.sourceId} 
                  className="matched-candidate-card"
                  style={{
                    background: '#fff',
                    border: idx === 0 ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  {idx === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ★ Ranked #1 Best Match
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                          {candidate.sourceName}
                        </h4>
                        <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                          {candidate.waterCategory}
                        </span>
                        <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} />
                          {candidate.qualityVerificationStatus}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Supplier: <strong>{candidate.supplierName}</strong> · Location: {candidate.location}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: candidate.matchScore >= 80 ? 'linear-gradient(135deg, #059669, #10b981)' : '#0284c7',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '15px',
                        padding: '4px 12px',
                        borderRadius: '20px'
                      }}>
                        {candidate.matchScore}% Match
                      </div>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', margin: '10px 0' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Available Capacity</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{candidate.availableQuantity.toLocaleString()} L</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Distance from Buyer</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{candidate.distanceKm} km</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Est. Logistics Fee</span>
                      <strong style={{ fontSize: '13px', color: '#059669' }}>₹{candidate.estimatedTransportCost || 950}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Demand Coverage</span>
                      <strong style={{ fontSize: '13px', color: candidate.isFullFulfillment ? '#059669' : '#d97706' }}>
                        {candidate.fulfillmentPercentage}% {candidate.isFullFulfillment ? '(Full)' : '(Partial)'}
                      </strong>
                    </div>
                  </div>

                  {/* Transparent Explanation Reasons */}
                  <div style={{ margin: '10px 0 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
                      Why This Source Matches:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(candidate.scoreFactors?.reasons || []).slice(0, 4).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      className="btn-primary"
                      disabled={requestingSourceId === candidate.sourceId}
                      onClick={() => handleSendRequest(candidate)}
                      style={{
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Droplet size={14} />
                      {requestingSourceId === candidate.sourceId ? "Sending Water Request..." : "Request Water Allocation"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state when no eligible candidates exist */}
          {!loading && !error && eligible.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#334155' }}>
                No Eligible Water Sources Found in Range
              </h4>
              <p style={{ margin: '0 auto 14px', maxWidth: '480px', fontSize: '13px', color: '#64748b' }}>
                ReLoop enforces strict CPCB safety and quality filters. No available water sources currently satisfy all mandatory eligibility criteria for <strong>{demand.purpose}</strong> within {maxDistance} km.
              </p>
              {matchData?.exclusionSummary && (
                <div style={{ display: 'inline-block', textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', color: '#475569' }}>
                  <strong>Safety Filter Exclusions:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                    {matchData.exclusionSummary.expiredQuality > 0 && (
                      <li>{matchData.exclusionSummary.expiredQuality} source(s) excluded due to expired water quality lab certificates.</li>
                    )}
                    {matchData.exclusionSummary.unverifiedQuality > 0 && (
                      <li>{matchData.exclusionSummary.unverifiedQuality} source(s) excluded awaiting official lab verification.</li>
                    )}
                    {matchData.exclusionSummary.incompatibleReuse > 0 && (
                      <li>{matchData.exclusionSummary.incompatibleReuse} source(s) excluded due to application incompatibility with {demand.purpose}.</li>
                    )}
                    {matchData.exclusionSummary.insufficientQuantity > 0 && (
                      <li>{matchData.exclusionSummary.insufficientQuantity} source(s) currently exhausted (0 L inventory).</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

