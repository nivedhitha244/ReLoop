import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  PlusCircle, 
  User, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck,
  ChevronDown 
} from 'lucide-react';

export default function SellerHeader({ 
  searchQuery, 
  setSearchQuery, 
  onNotificationClick,
  onOpenAddSource,
  currentUser,
  onLogout,
  onNavigateTab,
  unreadCount = 0,
  onToggleMobile
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const orgName = currentUser?.fullName || currentUser?.organization || "Apex Tech Park STP";
  const initials = currentUser?.initials || (orgName ? orgName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : "AT");

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="reloop-top-header seller-header">
      {/* Search Field */}
      <div className="header-left-wrap">
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search water sources, requests, lab reports, or matches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="header-actions">
        {/* Quick Add Water Source Action Button */}
        <button 
          type="button"
          className="header-add-source-btn"
          onClick={onOpenAddSource}
          title="Register a new water resource"
        >
          <PlusCircle size={16} />
          <span>Add Water Source</span>
        </button>

        {/* Notification Bell */}
        <button 
          className="notification-bell-btn" 
          aria-label="Notifications"
          onClick={onNotificationClick}
          title={`${unreadCount} unread notification(s)`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge-count">{unreadCount}</span>
          )}
        </button>

        {/* Seller Profile Avatar & Dropdown */}
        <div className="header-profile-menu-wrap" ref={menuRef}>
          <div 
            className="header-user-badge seller-user-badge" 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            role="button"
            tabIndex={0}
          >
            <div className="badge-avatar seller-avatar">{initials}</div>
            <div className="badge-text">
              <span className="badge-name" title={orgName}>{orgName}</span>
              <span className="badge-role">Seller</span>
            </div>
            <ChevronDown size={14} className="badge-dropdown-arrow" />
          </div>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="profile-dropdown-card">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{initials}</div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{orgName}</div>
                  <div className="dropdown-user-email">{currentUser?.email || "supplier@reloop.org"}</div>
                  <span className="dropdown-verified-badge">
                    <ShieldCheck size={12} /> Verified Supplier
                  </span>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-items-list">
                <button 
                  className="dropdown-item-btn"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onNavigateTab) onNavigateTab('settings');
                  }}
                >
                  <Settings size={15} />
                  <span>Account & Facility Settings</span>
                </button>

                <button 
                  className="dropdown-item-btn"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onNavigateTab) onNavigateTab('quality-verification');
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Quality Documents</span>
                </button>
              </div>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-logout-btn"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
