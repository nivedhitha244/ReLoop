import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Gauge,
  Filter,
  RefreshCw,
  Sliders,
  Check,
  AlertTriangle,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmationDialog from '../common/ConfirmationDialog';
import SkeletonLoader from '../common/SkeletonLoader';

export default function AdminMatchingHub({ onNavigate, showToast, refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'existing'
  const [candidates, setCandidates] = useState([]);
  const [existingMatches, setExistingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Confirmation Modals State
  const [approveModal, setApproveModal] = useState({ isOpen: false, candidate: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, match: null });
  const [overrideModal, setOverrideModal] = useState({ isOpen: false, match: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Existing Matches
  const fetchExistingMatches = async () => {
    try {
      const res = await fetch(`/api/matches?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        setExistingMatches(json);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  // Run AI Candidate Generation Algorithm
  const runCandidateGeneration = async () => {
    try {
      setGenerating(true);
      const res = await fetch('/api/matches/generate-candidates', { method: 'POST' });
      if (!res.ok) throw new Error('Candidate generation failed');
      const json = await res.json();
      setCandidates(json.candidates || []);
    } catch (err) {
      console.error('Error generating candidates:', err);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runCandidateGeneration();
    fetchExistingMatches();
  }, [statusFilter, refreshTrigger]);

  // Execute Match Approval
  const handleApproveConfirm = async (notes) => {
    if (!approveModal.candidate) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/matches/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: approveModal.candidate,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to approve match');

      if (showToast) {
        showToast({
          type: 'success',
          message: 'Match approved! Delivery scheduled & tanker assigned.',
        });
      }

      setApproveModal({ isOpen: false, candidate: null });
      runCandidateGeneration();
      fetchExistingMatches();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_match_approved' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Reject
  const handleRejectConfirm = async (reason) => {
    if (!rejectModal.match) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/matches/${rejectModal.match._id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reject match');

      if (showToast) showToast({ type: 'success', message: 'Match successfully rejected.' });
      setRejectModal({ isOpen: false, match: null });
      fetchExistingMatches();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_match_rejected' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Manual Override
  const handleOverrideConfirm = async (reason) => {
    if (!overrideModal.match) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/matches/${overrideModal.match._id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'override', reason }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to override match');

      if (showToast) {
        showToast({
          type: 'success',
          message: 'Match manually overridden & logged in audit history.',
        });
      }
      setOverrideModal({ isOpen: false, match: null });
      fetchExistingMatches();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_match_overridden' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-content" style={{ gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="admin-card"
        style={{
          background: 'linear-gradient(135deg, #062826 0%, #0c6e5d 100%)',
          color: '#ffffff',
          padding: '1.5rem 1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  background: 'rgba(45, 212, 191, 0.25)',
                  color: '#2dd4bf',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                }}
              >
                Intelligent Matching Engine
              </span>
              <span style={{ fontSize: '0.78rem', color: '#80a7a2' }}>Multi-Criteria Decision System</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Smart Supply & Demand Matching Hub</h2>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '640px', marginTop: '0.25rem' }}>
              Evaluates real-world road corridors, quantity fulfillment ratio, laboratory quality certification, and demand urgency with explainable match scores.
            </p>
          </div>

          <button
            onClick={runCandidateGeneration}
            disabled={generating}
            className="admin-btn admin-btn-primary"
            style={{ background: '#2dd4bf', color: '#062826', fontWeight: 700 }}
          >
            <RefreshCw size={16} className={generating ? 'spin-anim' : ''} />
            {generating ? 'Evaluating Logistics Corridors...' : 'Scan & Re-Calculate Matches'}
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('candidates')}
            style={{
              padding: '0.55rem 1rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'candidates' ? '#0c6e5d' : '#64748b',
              borderBottom: activeTab === 'candidates' ? '2.5px solid #0c6e5d' : 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={16} />
            Proposed Candidates ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            style={{
              padding: '0.55rem 1rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'existing' ? '#0c6e5d' : '#64748b',
              borderBottom: activeTab === 'existing' ? '2.5px solid #0c6e5d' : 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={16} />
            Existing Matches ({existingMatches.length})
          </button>
        </div>

        {activeTab === 'existing' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          >
            <option value="all">All Match Statuses</option>
            <option value="Admin Approved">Admin Approved</option>
            <option value="Completed">Completed</option>
            <option value="Overridden">Overridden</option>
            <option value="Rejected">Rejected</option>
          </select>
        )}
      </div>

      {/* Tab 1: Proposed Candidates */}
      {activeTab === 'candidates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <SkeletonLoader rows={4} height={120} />
          ) : candidates.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
              <CheckCircle2 size={36} color="#0c6e5d" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>All Requests Currently Satisfied</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                No unallocated buyer requests currently require matching. Click 'Scan & Re-Calculate Matches' when new requests are posted.
              </p>
            </div>
          ) : (
            candidates.map((cand, idx) => {
              const { listing, request, factors, matchScore, distanceKm, proposedQuantity } = cand;
              return (
                <div
                  key={idx}
                  className="admin-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    borderLeft: `5px solid ${matchScore >= 85 ? '#0c6e5d' : (matchScore >= 70 ? '#0284c7' : '#f59e0b')}`,
                  }}
                >
                  {/* Top Candidate Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* Match Score Radial Gauge */}
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: matchScore >= 85 ? '#ecfdf5' : '#eff6ff',
                          border: `3px solid ${matchScore >= 85 ? '#059669' : '#2563eb'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: matchScore >= 85 ? '#059669' : '#2563eb' }}>
                          {matchScore}%
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Score
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0c6e5d' }}>
                            RECOMMENDED PAIRING #{idx + 1}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Distance: <strong>{distanceKm} km</strong>
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                          {listing.supplierName} &rarr; {request.buyerName}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <button
                        onClick={() => setApproveModal({ isOpen: true, candidate: cand })}
                        className="admin-btn admin-btn-primary"
                      >
                        <Check size={16} />
                        Approve & Allocate ({proposedQuantity.toLocaleString()} L)
                      </button>
                    </div>
                  </div>

                  {/* Visual Comparison: Supplier Facility vs Buyer Site */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '1rem',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {/* Supplier details */}
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0c6e5d', textTransform: 'uppercase' }}>
                        Source: {listing.supplierName} ({listing.listingCode})
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', margin: '2px 0' }}>
                        {listing.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Category: <strong>{listing.waterCategory}</strong> • Available: <strong>{listing.availableQuantity.toLocaleString()} L</strong>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <StatusBadge status={listing.qualityVerificationStatus} />
                      </div>
                    </div>

                    {/* Buyer demand */}
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
                        Destination: {request.buyerName} ({request.requestCode})
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', margin: '2px 0' }}>
                        {request.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Required: <strong>{request.requiredQuantity.toLocaleString()} L</strong> • Purpose: <strong>{request.purpose}</strong>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <StatusBadge status={request.priority} />
                      </div>
                    </div>
                  </div>

                  {/* Factor Breakdown Bars & Human-Readable AI Reasons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {/* Factor Bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Algorithm Evaluation Breakdown
                      </span>
                      {[
                        { label: 'Proximity Score', value: factors?.proximityScore || 85, color: '#0c6e5d' },
                        { label: 'Quantity Match Ratio', value: factors?.quantityScore || 90, color: '#0284c7' },
                        { label: 'Quality Compatibility', value: factors?.qualityScore || 95, color: '#10b981' },
                        { label: 'Urgency Priority', value: factors?.urgencyScore || 80, color: '#f59e0b' },
                      ].map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                          <span style={{ width: '130px', color: '#64748b' }}>{f.label}:</span>
                          <div style={{ flex: 1, height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${f.value}%`, height: '100%', background: f.color }} />
                          </div>
                          <span style={{ width: '35px', textAlign: 'right', fontWeight: 700 }}>{f.value}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Explainable Reasons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Why ReLoop Recommends This Match:
                      </span>
                      {(factors?.reasons || []).map((reason, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.8rem', color: '#334155' }}>
                          <CheckCircle2 size={14} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Existing Matches Table */}
      {activeTab === 'existing' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Match ID</th>
                <th>Supplier (Source)</th>
                <th>Buyer (Destination)</th>
                <th>Volume</th>
                <th>Distance</th>
                <th>Compatibility</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {existingMatches.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No match records found.
                  </td>
                </tr>
              ) : (
                existingMatches.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <strong>{m.matchCode}</strong>
                    </td>
                    <td>{m.sourceName}</td>
                    <td>{m.destinationName}</td>
                    <td>
                      <strong>{Number(m.quantity || 0).toLocaleString()} L</strong>
                    </td>
                    <td>{m.distanceKm || 3.4} km</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0c6e5d' }}>{m.matchScore}%</span>
                    </td>
                    <td>
                      <StatusBadge status={m.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {m.status === 'Proposed' && (
                          <button
                            onClick={() => setApproveModal({ isOpen: true, candidate: { listing: { _id: m.listingId }, request: { _id: m.requestId }, proposedQuantity: m.quantity } })}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            Approve
                          </button>
                        )}
                        {m.status !== 'Rejected' && m.status !== 'Completed' && (
                          <button
                            onClick={() => setOverrideModal({ isOpen: true, match: m })}
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                            title="Manual Override"
                          >
                            Override
                          </button>
                        )}
                        {m.status !== 'Rejected' && m.status !== 'Completed' && (
                          <button
                            onClick={() => setRejectModal({ isOpen: true, match: m })}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={approveModal.isOpen}
        title="Approve Reusable Water Match & Dispatch Delivery"
        message={`Are you sure you want to approve this allocation? This will securely allocate ${approveModal.candidate?.proposedQuantity?.toLocaleString()} L of water, update supply inventory, and trigger automatic transporter dispatch.`}
        confirmLabel="Approve & Schedule Tanker"
        confirmVariant="primary"
        requireReason={false}
        loading={actionLoading}
        onConfirm={handleApproveConfirm}
        onClose={() => setApproveModal({ isOpen: false, candidate: null })}
      />

      <ConfirmationDialog
        isOpen={rejectModal.isOpen}
        title="Reject Proposed Match"
        message="Please provide a mandatory justification for rejecting this calculated match. The buyer request will return to the active pool."
        confirmLabel="Reject Match"
        confirmVariant="danger"
        requireReason={true}
        reasonPlaceholder="e.g. Incompatible temporal schedule or transporter shortage..."
        loading={actionLoading}
        onConfirm={handleRejectConfirm}
        onClose={() => setRejectModal({ isOpen: false, match: null })}
      />

      <ConfirmationDialog
        isOpen={overrideModal.isOpen}
        title="Manual Match Override (Audited Operation)"
        message="Manual overrides allow administrators to bypass algorithmic scoring. Safety rule: overrides cannot bypass failed water quality lab tests. All overrides are permanently recorded in the Audit Log."
        confirmLabel="Execute Manual Override"
        confirmVariant="primary"
        requireReason={true}
        reasonPlaceholder="Specify operational necessity or emergency municipal directive..."
        loading={actionLoading}
        onConfirm={handleOverrideConfirm}
        onClose={() => setOverrideModal({ isOpen: false, match: null })}
      />
    </div>
  );
}
