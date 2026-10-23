import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Eye,
  Building,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmationDialog from '../common/ConfirmationDialog';
import SkeletonLoader from '../common/SkeletonLoader';

const ROLE_COLORS = {
  admin: { bg: '#eef2ff', color: '#4f46e5', label: 'Admin' },
  supplier: { bg: '#ecfdf5', color: '#0c6e5d', label: 'Supplier' },
  buyer: { bg: '#fffbeb', color: '#d97706', label: 'Buyer' },
  transporter: { bg: '#f0f9ff', color: '#0284c7', label: 'Transporter' },
  verifier: { bg: '#faf5ff', color: '#9333ea', label: 'Verifier' },
};

export default function AdminUserManagement({ onNavigate, showToast, globalSearch = '', refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Selected Profile Modal
  const [profileModal, setProfileModal] = useState({ isOpen: false, user: null });
  // Account Status (Suspend/Activate) Modal
  const [statusModal, setStatusModal] = useState({ isOpen: false, user: null, nextStatus: '' });
  // Role Modification Modal
  const [roleModal, setRoleModal] = useState({ isOpen: false, user: null, nextRole: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const effectiveSearch = globalSearch || localSearch;

  const fetchUsers = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch(`/api/admin/users?role=${roleFilter}&status=${statusFilter}&search=${encodeURIComponent(effectiveSearch)}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(users.length > 0);
  }, [roleFilter, statusFilter, effectiveSearch, refreshTrigger]);

  const handleStatusConfirm = async (reason) => {
    if (!statusModal.user || !statusModal.nextStatus) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${statusModal.user._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusModal.nextStatus, reason }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update account status');

      if (showToast) {
        showToast({
          type: 'success',
          message: `User account ${statusModal.user.fullName} is now ${statusModal.nextStatus}.`,
        });
      }

      setStatusModal({ isOpen: false, user: null, nextStatus: '' });
      fetchUsers();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_user_status_updated' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleConfirm = async (reason) => {
    if (!roleModal.user || !roleModal.nextRole) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${roleModal.user._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleModal.nextRole, reason }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update user role');

      if (showToast) {
        showToast({
          type: 'success',
          message: `Role for ${roleModal.user.fullName} updated to ${roleModal.nextRole}.`,
        });
      }

      setRoleModal({ isOpen: false, user: null, nextRole: '' });
      fetchUsers();
      window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'admin_user_role_updated' } }));
      localStorage.setItem('reloop_last_mutation', String(Date.now()));
    } catch (err) {
      if (showToast) showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-content" style={{ gap: '1.25rem' }}>
      {/* Top Filter and Search Bar */}
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
        {/* Role Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Platform Roles:</span>
          {['all', 'admin', 'supplier', 'buyer', 'transporter', 'verifier'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`admin-btn admin-btn-sm ${roleFilter === r ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {r === 'all' ? 'All Roles' : (ROLE_COLORS[r]?.label || r)}
            </button>
          ))}
        </div>

        {/* Status Filter & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_verification">Pending Verification</option>
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
              placeholder="Search user or email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '160px' }}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Name & Org</th>
              <th>Contact Details</th>
              <th>Role</th>
              <th>Account Status</th>
              <th>Verification</th>
              <th>Activity / Records</th>
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No registered platform users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const roleConfig = ROLE_COLORS[u.role] || { bg: '#f1f5f9', color: '#475569', label: u.role };
                const initials = (u.fullName || 'User')
                  .split(' ')
                  .map(w => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const isSuspended = u.accountStatus === 'suspended';

                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: roleConfig.bg,
                            color: roleConfig.color,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.78rem',
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {u.organization || 'Independent Entity'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>{u.email}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{u.phone || 'No phone recorded'}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          background: roleConfig.bg,
                          color: roleConfig.color,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {roleConfig.label}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={u.accountStatus || 'active'} />
                    </td>
                    <td>
                      <span className={`admin-badge ${u.verified ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                        {u.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {u.role === 'supplier' && `${u.associatedListingsCount || 0} listings`}
                        {u.role === 'buyer' && `${u.associatedRequestsCount || 0} demands`}
                        {u.role === 'transporter' && `${u.associatedDeliveriesCount || 0} deliveries`}
                        {u.role === 'verifier' && `${u.associatedReportsCount || 0} lab tests`}
                        {u.role === 'admin' && 'Full Administrative Access'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setProfileModal({ isOpen: true, user: u })}
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                          title="Inspect Profile"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Suspend or Activate Button */}
                        {isSuspended ? (
                          <button
                            onClick={() => setStatusModal({ isOpen: true, user: u, nextStatus: 'active' })}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            title="Activate Account"
                          >
                            <UserCheck size={13} /> Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatusModal({ isOpen: true, user: u, nextStatus: 'suspended' })}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            title="Suspend Account"
                            disabled={u.email === 'admin@reloop.org'}
                          >
                            <UserX size={13} /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User Profile Modal */}
      {profileModal.isOpen && profileModal.user && (
        <div className="admin-modal-backdrop" onClick={() => setProfileModal({ isOpen: false, user: null })}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">User Account Profile</h3>
              <button
                onClick={() => setProfileModal({ isOpen: false, user: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#0c6e5d',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                  }}
                >
                  {(profileModal.user.fullName || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    {profileModal.user.fullName}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Role: <strong>{profileModal.user.role?.toUpperCase()}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Email Address</span>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{profileModal.user.email}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Phone Number</span>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{profileModal.user.phone || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Account Status</span>
                  <div style={{ marginTop: '2px' }}><StatusBadge status={profileModal.user.accountStatus || 'active'} /></div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Verification Status</span>
                  <div style={{ marginTop: '2px' }}>
                    <StatusBadge status={profileModal.user.verified ? 'Verified' : 'Pending'} />
                  </div>
                </div>
              </div>

              {profileModal.user.organization && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Registered Organization</span>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{profileModal.user.organization}</p>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setProfileModal({ isOpen: false, user: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Confirmation Modal */}
      <ConfirmationDialog
        isOpen={statusModal.isOpen}
        title={statusModal.nextStatus === 'suspended' ? 'Suspend Platform Account' : 'Reactivate Platform Account'}
        message={`Are you sure you want to set the account of ${statusModal.user?.fullName} to "${statusModal.nextStatus}"? Suspended accounts cannot log in or participate in water reuse operations.`}
        confirmLabel={statusModal.nextStatus === 'suspended' ? 'Suspend Account' : 'Reactivate'}
        confirmVariant={statusModal.nextStatus === 'suspended' ? 'danger' : 'primary'}
        requireReason={statusModal.nextStatus === 'suspended'}
        reasonPlaceholder="Mandatory reason for suspension (e.g. Incomplete documentation, violation of terms)..."
        loading={actionLoading}
        onConfirm={handleStatusConfirm}
        onClose={() => setStatusModal({ isOpen: false, user: null, nextStatus: '' })}
      />
    </div>
  );
}
