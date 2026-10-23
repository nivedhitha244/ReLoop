import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  Check,
  FileText,
  Building,
  RotateCcw,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmationDialog from '../common/ConfirmationDialog';
import SkeletonLoader from '../common/SkeletonLoader';

export default function AdminQualityVerification({ onNavigate, showToast, globalSearch = '', refreshTrigger }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Report Inspection Modal
  const [inspectModal, setInspectModal] = useState({ isOpen: false, report: null });
  // Review Decision Modal
  const [reviewModal, setReviewModal] = useState({ isOpen: false, report: null, status: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const effectiveSearch = globalSearch || localSearch;

  const fetchReports = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch(`/api/quality-reports?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        setReports(json);
      }
    } catch (err) {
      console.error('Error fetching quality reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(reports.length > 0);
  }, [statusFilter, refreshTrigger]);

  const filteredReports = reports.filter((r) => {
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return (
        r.reportCode.toLowerCase().includes(q) ||
        r.sourceName.toLowerCase().includes(q) ||
        (r.verifierName || '').toLowerCase().includes(q) ||
        (r.certificateNumber || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleReviewConfirm = async (reasonOrNotes) => {
    if (!reviewModal.report || !reviewModal.status) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/quality-reports/${reviewModal.report._id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewModal.status,
          reviewerNotes: reasonOrNotes,
          reason: reasonOrNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to review quality report');

      if (showToast) {
        showToast({
          type: 'success',
          message: `Quality report ${reviewModal.report.reportCode} marked as ${reviewModal.status}.`,
        });
      }

      setReviewModal({ isOpen: false, report: null, status: '' });
      if (inspectModal.isOpen) setInspectModal({ isOpen: false, report: null });
      fetchReports();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_quality_reviewed' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-content" style={{ gap: '1.25rem' }}>
      {/* Banner */}
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
                Accredited Testing Oversight
              </span>
              <span style={{ fontSize: '0.78rem', color: '#80a7a2' }}>CPCB Class IV Standards</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Water Quality Verification & Lab Control</h2>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '640px', marginTop: '0.25rem' }}>
              Enforces mandatory laboratory parameter thresholds (pH, turbidity, TDS, BOD, COD, E. coli) before water allocations can be dispatched to buyers.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="admin-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Filter by Status:</span>
          {['all', 'Pending', 'Approved', 'Rejected', 'Needs Re-test'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`admin-btn admin-btn-sm ${statusFilter === st ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {st === 'all' ? 'All Reports' : st}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.35rem 0.65rem',
          }}
        >
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Search report or certificate..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '180px' }}
          />
        </div>
      </div>

      {/* Quality Reports Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Source / Listing</th>
              <th>Laboratory & Verifier</th>
              <th>Sample & Test Date</th>
              <th>Intended Application</th>
              <th>Overall Result</th>
              <th>Verification Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <SkeletonLoader rows={4} height={40} />
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No water quality reports found matching filters.
                </td>
              </tr>
            ) : (
              filteredReports.map((r) => (
                <tr key={r._id}>
                  <td>
                    <strong>{r.reportCode}</strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {r.certificateNumber || 'Cert Pending'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.sourceName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.waterCategory}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.verifierName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {r.labName || 'AquaCert Testing'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      {r.testDate ? new Date(r.testDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Sample: {r.sampleCollectionDate ? new Date(r.sampleCollectionDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-neutral">{r.intendedReuseCategory}</span>
                  </td>
                  <td>
                    <StatusBadge status={r.overallResult} />
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => setInspectModal({ isOpen: true, report: r })}
                        className="admin-btn admin-btn-sm admin-btn-secondary"
                        title="Inspect Lab Parameters"
                      >
                        <Eye size={13} /> Inspect
                      </button>

                      {r.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => setReviewModal({ isOpen: true, report: r, status: 'Approved' })}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setReviewModal({ isOpen: true, report: r, status: 'Rejected' })}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Report Inspection Modal */}
      {inspectModal.isOpen && inspectModal.report && (
        <div className="admin-modal-backdrop" onClick={() => setInspectModal({ isOpen: false, report: null })}>
          <div className="admin-modal-card" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">
                  Laboratory Test Certificate ({inspectModal.report.reportCode})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Certificate #{inspectModal.report.certificateNumber || 'TN-PCB-PENDING'}
                </span>
              </div>
              <button
                onClick={() => setInspectModal({ isOpen: false, report: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Facility & Lab Metadata */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Water Source</span>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{inspectModal.report.sourceName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Testing Laboratory</span>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{inspectModal.report.verifierName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Permitted Application</span>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0c6e5d' }}>
                    {inspectModal.report.intendedReuseCategory}
                  </div>
                </div>
              </div>

              {/* Tested Parameters Grid */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Physicochemical & Microbiological Test Results
                </h4>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Recorded Value</th>
                        <th>Reference Limit</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(inspectModal.report.parameters || []).map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>
                            <strong>{p.value}</strong> {p.unit}
                          </td>
                          <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {p.minLimit !== undefined ? `${p.minLimit} - ` : '< '}{p.maxLimit} {p.unit}
                          </td>
                          <td>
                            {p.passed ? (
                              <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                <CheckCircle2 size={14} /> Passed
                              </span>
                            ) : (
                              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                <XCircle size={14} /> Non-compliant
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reviewer Notes & Decision History */}
              {inspectModal.report.reviewerNotes && (
                <div style={{ background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Reviewer Notes:</span>
                  <p style={{ fontSize: '0.82rem', color: '#1e293b', marginTop: '0.2rem' }}>
                    {inspectModal.report.reviewerNotes}
                  </p>
                  {inspectModal.report.reviewedByName && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Signed by {inspectModal.report.reviewedByName} on {new Date(inspectModal.report.reviewedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setInspectModal({ isOpen: false, report: null })}
              >
                Close Certificate
              </button>
              {inspectModal.report.status === 'Pending' && (
                <>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => {
                      setReviewModal({ isOpen: true, report: inspectModal.report, status: 'Rejected' });
                    }}
                  >
                    Reject Report
                  </button>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      setReviewModal({ isOpen: true, report: inspectModal.report, status: 'Approved' });
                    }}
                  >
                    Approve Verification
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={reviewModal.isOpen}
        title={reviewModal.status === 'Approved' ? 'Approve Water Quality Verification' : 'Reject Water Quality Report'}
        message={
          reviewModal.status === 'Approved'
            ? 'Approving this laboratory certificate certifies this water supply for authorized non-potable reuse and enables automated dispatch matching.'
            : 'Rejecting this report will flag the source facility as non-compliant and prevent any allocations.'
        }
        confirmLabel={reviewModal.status === 'Approved' ? 'Approve Certificate' : 'Reject Report'}
        confirmVariant={reviewModal.status === 'Approved' ? 'primary' : 'danger'}
        requireReason={reviewModal.status === 'Rejected'}
        reasonPlaceholder="Mandatory reason for rejection (e.g. Turbidity exceeds CPCB Class IV threshold)..."
        loading={actionLoading}
        onConfirm={handleReviewConfirm}
        onClose={() => setReviewModal({ isOpen: false, report: null, status: '' })}
      />
    </div>
  );
}
