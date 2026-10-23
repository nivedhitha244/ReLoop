import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Server,
  Database,
  Lock,
  Download,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import SkeletonLoader from '../common/SkeletonLoader';

export default function AdminAuditLogs({ onNavigate, globalSearch = '', refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = globalSearch || localSearch;

  const fetchLogs = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch(`/api/audit-logs?entity=${entityFilter}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(logs.length > 0);
  }, [entityFilter, refreshTrigger]);

  const filteredLogs = logs.filter((l) => {
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        (l.targetId || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.actor?.name || '').toLowerCase().includes(q) ||
        (l.reason || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="admin-page-content" style={{ gap: '1.25rem' }}>
      {/* Top Banner */}
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
                Immutable Audit Trail
              </span>
              <span style={{ fontSize: '0.78rem', color: '#80a7a2' }}>ISO 27001 Compliance</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Settings & Administrative Audit Logs</h2>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '640px', marginTop: '0.25rem' }}>
              Non-repudiable audit recording of all user status changes, match approvals, quality verification clearances, and manual overrides.
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
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Filter Entity:</span>
          {['all', 'Match', 'QualityReport', 'User', 'Delivery', 'SupplierListing'].map((ent) => (
            <button
              key={ent}
              onClick={() => setEntityFilter(ent)}
              className={`admin-btn admin-btn-sm ${entityFilter === ent ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {ent === 'all' ? 'All Entities' : ent}
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
            placeholder="Search action or target ID..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '180px' }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action Code</th>
              <th>Target Entity</th>
              <th>Target ID</th>
              <th>Details & Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <SkeletonLoader rows={5} height={40} />
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No administrative audit records found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.actor?.name || 'Admin'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.actor?.email}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        background: '#eff6ff',
                        color: '#2563eb',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-neutral">{log.targetEntity}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155' }}>
                      {log.targetId}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#0f172a' }}>{log.details}</div>
                    {log.reason && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                        Reason: "{log.reason}"
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* System Settings & Configuration Panel */}
      <div className="admin-card">
        <h4 className="admin-card-title">
          <Server size={18} color="#0c6e5d" />
          Environment & Security Configuration
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Authentication Strategy</span>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>
              JWT (JSON Web Tokens) • 7 Days Validity
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>
              Role-Based Access Control (RBAC) Enforced
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Database Engine</span>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>
              MongoDB with Mongoose ODM
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>
              Resilient In-Memory Fallback Active
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Geospatial Routing Provider</span>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>
              OpenStreetMap + Leaflet Engine
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0c6e5d', marginTop: '4px' }}>
              Haversine & OSRM Corridors Enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
