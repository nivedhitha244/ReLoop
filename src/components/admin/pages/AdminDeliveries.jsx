import React, { useEffect, useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Filter,
  Eye,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmationDialog from '../common/ConfirmationDialog';
import SkeletonLoader from '../common/SkeletonLoader';

const LIFECYCLE_STAGES = [
  'Requested',
  'Matched',
  'Quality Cleared',
  'Transporter Assigned',
  'In Transit',
  'Delivered',
  'Completed',
];

export default function AdminDeliveries({ onNavigate, showToast, globalSearch = '', refreshTrigger }) {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Timeline / History Modal
  const [historyModal, setHistoryModal] = useState({ isOpen: false, delivery: null });
  // Status Update Modal
  const [statusUpdateModal, setStatusUpdateModal] = useState({ isOpen: false, delivery: null, nextStatus: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const effectiveSearch = globalSearch || localSearch;

  const fetchDeliveries = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch(`/api/deliveries?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        setDeliveries(json);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries(deliveries.length > 0);
  }, [statusFilter, refreshTrigger]);

  const filteredDeliveries = deliveries.filter((d) => {
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return (
        d.deliveryCode.toLowerCase().includes(q) ||
        d.sourceName.toLowerCase().includes(q) ||
        d.destinationName.toLowerCase().includes(q) ||
        (d.vehicleNumber || '').toLowerCase().includes(q) ||
        (d.driverName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusTransitionConfirm = async (note) => {
    if (!statusUpdateModal.delivery || !statusUpdateModal.nextStatus) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/deliveries/${statusUpdateModal.delivery._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusUpdateModal.nextStatus,
          note,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update delivery lifecycle status');

      if (showToast) {
        showToast({
          type: 'success',
          message: `Delivery ${statusUpdateModal.delivery.deliveryCode} updated to ${statusUpdateModal.nextStatus}.`,
        });
      }

      setStatusUpdateModal({ isOpen: false, delivery: null, nextStatus: '' });
      fetchDeliveries();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_delivery_updated' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-content" style={{ gap: '1.25rem' }}>
      {/* Lifecycle Flow Indicator Banner */}
      <div className="admin-card" style={{ padding: '1.25rem 1.5rem' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Standardized Water Transport Lifecycle
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', gap: '0.5rem', paddingBottom: '0.25rem' }}>
          {LIFECYCLE_STAGES.map((stage, idx) => (
            <React.Fragment key={stage}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#0c6e5d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {idx + 1}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>
                  {stage}
                </span>
              </div>
              {idx < LIFECYCLE_STAGES.length - 1 && (
                <ArrowRight size={14} color="#cbd5e1" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
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
          {['all', 'In Transit', 'Transporter Assigned', 'Completed', 'Delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`admin-btn admin-btn-sm ${statusFilter === st ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {st === 'all' ? 'All Deliveries' : st}
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
            placeholder="Search tanker or driver..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '160px' }}
          />
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Delivery Code</th>
              <th>Source &rarr; Destination</th>
              <th>Volume Payload</th>
              <th>Fleet & Driver</th>
              <th>Vehicle Plate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <SkeletonLoader rows={5} height={40} />
                </td>
              </tr>
            ) : filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No delivery transport records found.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((d) => (
                <tr key={d._id}>
                  <td>
                    <strong>{d.deliveryCode}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {d.sourceName} &rarr; {d.destinationName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Corridor: {d.estimatedDistanceKm || 3.4} km
                    </div>
                  </td>
                  <td>
                    <strong>{Number(d.quantity || 0).toLocaleString()} L</strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{d.waterCategory}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.transporterName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Driver: {d.driverName || 'Assigned'} ({d.driverPhone || 'N/A'})
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      {d.vehicleNumber || 'TN-09-CW-8492'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setHistoryModal({ isOpen: true, delivery: d })}
                        className="admin-btn admin-btn-sm admin-btn-secondary"
                        title="View Status History Timeline"
                      >
                        <Clock size={13} /> Log
                      </button>

                      {/* State Transition Dropdown button */}
                      {d.status !== 'Completed' && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setStatusUpdateModal({ isOpen: true, delivery: d, nextStatus: e.target.value });
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #0c6e5d',
                            fontSize: '0.75rem',
                            color: '#0c6e5d',
                            fontWeight: 600,
                            background: '#ffffff',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="" disabled>Change Status &darr;</option>
                          {d.status === 'Transporter Assigned' && <option value="In Transit">Dispatch (In Transit)</option>}
                          {d.status === 'In Transit' && <option value="Delivered">Mark Delivered</option>}
                          {d.status === 'Delivered' && <option value="Completed">Mark Completed</option>}
                          <option value="Cancelled">Cancel Delivery</option>
                        </select>
                      )}

                      <button
                        onClick={() => onNavigate('map')}
                        className="admin-btn admin-btn-sm admin-btn-secondary"
                        title="View on Map"
                      >
                        <Navigation size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* History Log Modal */}
      {historyModal.isOpen && historyModal.delivery && (
        <div className="admin-modal-backdrop" onClick={() => setHistoryModal({ isOpen: false, delivery: null })}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                Delivery Lifecycle History ({historyModal.delivery.deliveryCode})
              </h3>
              <button
                onClick={() => setHistoryModal({ isOpen: false, delivery: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(historyModal.delivery.statusHistory || []).length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No historical events recorded.</p>
                ) : (
                  (historyModal.delivery.statusHistory || []).map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        padding: '0.65rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '3px solid #0c6e5d',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <StatusBadge status={ev.status} />
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                          Updated by: <strong>{ev.updatedBy || 'System'}</strong>
                        </div>
                        {ev.note && (
                          <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '2px' }}>
                            Note: {ev.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setHistoryModal({ isOpen: false, delivery: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Confirmation */}
      <ConfirmationDialog
        isOpen={statusUpdateModal.isOpen}
        title={`Advance Delivery State to "${statusUpdateModal.nextStatus}"`}
        message={`Are you sure you want to transition delivery ${statusUpdateModal.delivery?.deliveryCode} to ${statusUpdateModal.nextStatus}? This action will update platform metrics and log the event.`}
        confirmLabel={`Transition to ${statusUpdateModal.nextStatus}`}
        confirmVariant={statusUpdateModal.nextStatus === 'Cancelled' ? 'danger' : 'primary'}
        requireReason={statusUpdateModal.nextStatus === 'Cancelled'}
        loading={actionLoading}
        onConfirm={handleStatusTransitionConfirm}
        onClose={() => setStatusUpdateModal({ isOpen: false, delivery: null, nextStatus: '' })}
      />
    </div>
  );
}
