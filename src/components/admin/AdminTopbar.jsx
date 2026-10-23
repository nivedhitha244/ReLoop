import React, { useState } from 'react';
import {
  Search,
  Bell,
  Calendar,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  RefreshCw,
} from 'lucide-react';

export default function AdminTopbar({
  currentSection,
  sectionTitle,
  globalSearch,
  onGlobalSearchChange,
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAllRead,
  currentUser,
  onLogout,
  onNavigateSection,
  onRefresh,
  isRefreshing = false,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');

  const rawName = currentUser?.fullName || currentUser?.name || 'Admin';
  const adminName = (rawName === 'System Administrator' || !rawName) ? 'Admin' : rawName;
  const initials = adminName === 'Admin' ? 'A' : (adminName.slice(0, 2).toUpperCase() || 'A');

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="admin-topbar">
      {/* Left: Clean Page Heading without redundant breadcrumbs */}
      <div className="admin-topbar-left">
        <h1 className="admin-page-title-heading">{sectionTitle}</h1>
      </div>

      {/* Center: Global Search */}
      <div className="admin-topbar-center">
        <div className="admin-global-search">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search suppliers, buyers, requests, matches, or reports..."
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
          />
          {globalSearch && (
            <button
              onClick={() => onGlobalSearchChange('')}
              style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'none' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Date, Notifications, Profile */}
      <div className="admin-topbar-right">
        {/* Date / Reporting Period */}
        <div className="admin-period-badge" title="Active Platform Date">
          <Calendar size={14} color="#0c6e5d" />
          <span>{todayStr}</span>
        </div>

        {/* Live Sync Status & Manual Refresh Trigger */}
        <button
          className="admin-period-badge"
          onClick={onRefresh}
          title="Click to manually refresh all live admin metrics"
          style={{
            cursor: 'pointer',
            background: isRefreshing ? '#ecfdf5' : '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
          }}
        >
          <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', color: '#16a34a' }} />
          <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
        </button>

        {/* Notifications Popover Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            className="admin-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="admin-badge-dot" />}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '360px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                animation: 'scaleUp 0.15s ease-out',
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    style={{ fontSize: '0.75rem', color: '#0c6e5d', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications at this time.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id || n.id}
                      onClick={() => {
                        if (n.link && onNavigateSection) {
                          const target = n.link.replace('/admin/', '');
                          onNavigateSection(target);
                        }
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        background: n.read ? '#ffffff' : '#f8fafc',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: n.read ? 'transparent' : '#0c6e5d',
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                          {n.message}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.3rem 0.5rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0c6e5d, #0284c7)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', marginRight: '0.25rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {adminName}
              </span>
              {adminName.toLowerCase() !== 'admin' && (
                <span style={{ fontSize: '0.68rem', color: '#0c6e5d', fontWeight: 600 }}>
                  Admin
                </span>
              )}
            </div>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '220px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                zIndex: 60,
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Signed in as</span>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  {currentUser?.email || 'admin@reloop.org'}
                </p>
              </div>

              <button
                onClick={() => {
                  onNavigateSection('users');
                  setShowProfileMenu(false);
                }}
                className="admin-nav-item"
                style={{ color: '#334155', padding: '0.5rem 0.75rem' }}
              >
                <User size={15} />
                <span>Admin Profile & Users</span>
              </button>

              <button
                onClick={() => {
                  onNavigateSection('audit-logs');
                  setShowProfileMenu(false);
                }}
                className="admin-nav-item"
                style={{ color: '#334155', padding: '0.5rem 0.75rem' }}
              >
                <Shield size={15} />
                <span>Audit Logs & Security</span>
              </button>

              <button
                onClick={onLogout}
                className="admin-logout-btn"
                style={{ marginTop: '0.25rem', padding: '0.5rem 0.75rem' }}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
