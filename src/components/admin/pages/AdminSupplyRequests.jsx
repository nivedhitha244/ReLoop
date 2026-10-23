import React, { useEffect, useState } from 'react';
import {
  Droplets,
  FileQuestion,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  Eye,
  Sliders,
  AlertCircle,
  Tag,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import SkeletonLoader from '../common/SkeletonLoader';
import ConfirmationDialog from '../common/ConfirmationDialog';

export default function AdminSupplyRequests({ onNavigate, showToast, globalSearch = '', refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' | 'requests'
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Selected Detail Modal
  const [detailModal, setDetailModal] = useState({ isOpen: false, item: null, type: 'listing' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, action: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const effectiveSearch = globalSearch || localSearch;

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [listRes, reqRes] = await Promise.all([
        fetch('/api/suppliers/listings'),
        fetch('/api/requests'),
      ]);

      if (listRes.ok) {
        const listJson = await listRes.json();
        setListings(listJson);
      }
      if (reqRes.ok) {
        const reqJson = await reqRes.json();
        setRequests(reqJson);
      }
    } catch (err) {
      console.error('Error fetching supply & requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(listings.length > 0 || requests.length > 0);
  }, [refreshTrigger]);

  // Filter listings
  const filteredListings = listings.filter((l) => {
    if (categoryFilter !== 'all' && l.waterCategory !== categoryFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return (
        l.listingCode.toLowerCase().includes(q) ||
        l.supplierName.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (categoryFilter !== 'all' && r.waterCategory !== categoryFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return (
        r.requestCode.toLowerCase().includes(q) ||
        r.buyerName.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle status update (e.g. suspend listing)
  const handleConfirmStatus = async (reason) => {
    if (!confirmModal.item) return;
    try {
      setActionLoading(true);
      const endpoint =
        confirmModal.type === 'listing'
          ? `/api/suppliers/listings/${confirmModal.item._id}/status`
          : `/api/requests/${confirmModal.item._id}/status`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: confirmModal.action, reason }),
      });

      if (!res.ok) throw new Error('Status update failed');

      if (showToast) {
        showToast({
          type: 'success',
          message: `${confirmModal.type === 'listing' ? 'Listing' : 'Request'} status changed to ${confirmModal.action}.`,
        });
      }
      setConfirmModal({ isOpen: false, item: null, action: '' });
      fetchData();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_supply_request_updated' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-content" style={{ gap: '1.25rem' }}>
      {/* Top Controls Bar */}
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
        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`admin-btn ${activeTab === 'suppliers' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          >
            <Droplets size={16} />
            Supplier Listings ({filteredListings.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`admin-btn ${activeTab === 'requests' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          >
            <FileQuestion size={16} />
            Buyer Requests ({filteredRequests.length})
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          >
            <option value="all">All Water Categories</option>
            <option value="Industrial">Industrial</option>
            <option value="Treated Wastewater">Treated Wastewater</option>
            <option value="Greywater">Greywater</option>
            <option value="RO Reject Water">RO Reject Water</option>
          </select>

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
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '130px' }}
            />
          </div>
        </div>
      </div>

      {/* Main Table: Supplier Listings */}
      {activeTab === 'suppliers' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Listing Code</th>
                <th>Supplier & Facility</th>
                <th>Category</th>
                <th>Available Supply</th>
                <th>Price</th>
                <th>Quality Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No supplier listings match filters.
                  </td>
                </tr>
              ) : (
                filteredListings.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <strong>{l.listingCode}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{l.supplierName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.title}</div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-info">{l.waterCategory}</span>
                    </td>
                    <td>
                      <div>
                        <strong>{Number(l.availableQuantity || 0).toLocaleString()} L</strong>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}> / {Number(l.totalQuantity || 0).toLocaleString()} L</span>
                      </div>
                      <div style={{ width: '80px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '3px' }}>
                        <div
                          style={{
                            width: `${Math.round(((l.availableQuantity || 0) / (l.totalQuantity || 1)) * 100)}%`,
                            height: '100%',
                            background: '#0c6e5d',
                          }}
                        />
                      </div>
                    </td>
                    <td>{l.indicativePrice || '₹0.12/L'}</td>
                    <td>
                      <StatusBadge status={l.qualityVerificationStatus} />
                    </td>
                    <td>
                      <StatusBadge status={l.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setDetailModal({ isOpen: true, item: l, type: 'listing' })}
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                        >
                          <Eye size={13} /> Details
                        </button>
                        {l.status === 'active' ? (
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, item: l, action: 'suspended', type: 'listing' })}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmModal({ isOpen: true, item: l, action: 'active', type: 'listing' })}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            Activate
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

      {/* Main Table: Buyer Requests */}
      {activeTab === 'requests' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request Code</th>
                <th>Buyer Organization</th>
                <th>Intended Use & Title</th>
                <th>Volume Required</th>
                <th>Priority</th>
                <th>Matching Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No buyer requests match filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.requestCode}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.buyerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {r.deliveryLocation?.address || 'Chennai'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#0c6e5d', fontWeight: 600 }}>
                        Purpose: {r.purpose} ({r.waterCategory})
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{Number(r.requiredQuantity || 0).toLocaleString()} L</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669' }}>
                        Fulfilled: {Number(r.fulfilledQuantity || 0).toLocaleString()} L
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={r.priority} />
                    </td>
                    <td>
                      <StatusBadge status={r.matchingStatus} />
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setDetailModal({ isOpen: true, item: r, type: 'request' })}
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          onClick={() => onNavigate('matching')}
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          title="Open Smart Matching Hub"
                        >
                          <Sparkles size={13} /> Match
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {detailModal.isOpen && detailModal.item && (
        <div className="admin-modal-backdrop" onClick={() => setDetailModal({ isOpen: false, item: null, type: 'listing' })}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {detailModal.type === 'listing' ? `Listing ${detailModal.item.listingCode}` : `Request ${detailModal.item.requestCode}`}
              </h3>
              <button
                onClick={() => setDetailModal({ isOpen: false, item: null, type: 'listing' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Organization Name</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {detailModal.item.supplierName || detailModal.item.buyerName}
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Water Category</span>
                  <p style={{ fontWeight: 600 }}>{detailModal.item.waterCategory}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Volume</span>
                  <p style={{ fontWeight: 600 }}>
                    {(detailModal.item.availableQuantity || detailModal.item.requiredQuantity || 0).toLocaleString()} Litres
                  </p>
                </div>
              </div>

              {detailModal.item.intendedUses && detailModal.item.intendedUses.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Permitted Reuse Applications</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {detailModal.item.intendedUses.map((u, i) => (
                      <span key={i} className="admin-badge admin-badge-neutral">
                        <Tag size={10} /> {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detailModal.item.description && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Technical Description</span>
                  <p style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.2rem' }}>
                    {detailModal.item.description}
                  </p>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setDetailModal({ isOpen: false, item: null, type: 'listing' })}
              >
                Close
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setDetailModal({ isOpen: false, item: null, type: 'listing' });
                  onNavigate('map');
                }}
              >
                <MapPin size={14} /> View On Logistics Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmModal.isOpen}
        title={`Confirm Status Modification`}
        message={`Are you sure you want to change the status of this record to "${confirmModal.action}"?`}
        confirmLabel={`Set to ${confirmModal.action}`}
        confirmVariant={confirmModal.action === 'suspended' ? 'danger' : 'primary'}
        requireReason={true}
        loading={actionLoading}
        onConfirm={handleConfirmStatus}
        onClose={() => setConfirmModal({ isOpen: false, item: null, action: '' })}
      />
    </div>
  );
}
