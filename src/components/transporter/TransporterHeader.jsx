import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Wallet, 
  Truck, 
  Radio, 
  LogOut, 
  Settings, 
  ChevronDown
} from 'lucide-react';

export default function TransporterHeader({ 
  searchQuery, 
  setSearchQuery, 
  currentUser, 
  onLogout,
  onNavigateTab,
  onOpenPayoutModal,
  unreadCount = 2,
  walletBalance = 16800,
  onToggleMobile
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const menuRef = useRef(null);

  const orgName = currentUser?.fullName || currentUser?.organization || "EcoFlow Logistics Fleet";
  const initials = currentUser?.initials || (orgName ? orgName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : "EF");

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
    <header className="reloop-top-header transporter-header">
      {/* Search Field */}
      <div className="header-left-wrap">
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search trips, vehicles, drivers, pickup docks or buyers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="header-actions">
        {/* Live Dispatch Status Switch */}
        <button 
          type="button"
          className={`dispatch-status-toggle ${isOnline ? 'online' : 'offline'}`}
          onClick={() => setIsOnline(!isOnline)}
          title="Toggle fleet dispatch availability"
        >
          <Radio size={14} className={isOnline ? 'pulse-radio' : ''} />
          <span>{isOnline ? 'Fleet Online & Dispatch Ready' : 'Fleet Standby'}</span>
        </button>

        {/* Quick Wallet & Payout Pill */}
        <div 
          className="header-wallet-pill"
          onClick={onOpenPayoutModal}
          role="button"
          tabIndex={0}
          title="Click to withdraw transport earnings"
        >
          <Wallet size={16} className="text-emerald-500" />
          <div className="wallet-pill-content">
            <span className="wallet-pill-label">AVAILABLE BALANCE</span>
            <span className="wallet-pill-amount">₹{walletBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Notifications Icon */}
        <button 
          type="button"
          className="notification-bell-btn"
          onClick={() => onNavigateTab('trips')}
          title="Transporter dispatch notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge-count">{unreadCount}</span>}
        </button>

        {/* Transporter Profile Menu */}
        <div className="header-profile-menu-wrap" ref={menuRef}>
          <div 
            className="header-user-badge transporter-user-badge"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            role="button"
            tabIndex={0}
          >
            <div className="badge-avatar transporter-avatar">{initials}</div>
            <div className="badge-text">
              <span className="badge-name" title={orgName}>{orgName}</span>
              <span className="badge-role">Transporter Fleet</span>
            </div>
            <ChevronDown size={14} className="badge-dropdown-arrow" />
          </div>

          {isProfileMenuOpen && (
            <div className="profile-dropdown-card">
              <div className="dropdown-header">
                <div className="dropdown-avatar transporter-avatar">{initials}</div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{orgName}</div>
                  <div className="dropdown-user-email">{currentUser?.email || "transporter@reloop.org"}</div>
                  <span className="dropdown-verified-badge">
                    <Truck size={12} /> Verified Carrier
                  </span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-items-list">
                <button 
                  type="button"
                  className="dropdown-item-btn" 
                  onClick={() => { setIsProfileMenuOpen(false); onNavigateTab('payments'); }}
                >
                  <Wallet size={15} />
                  <span>Payment Received & Wallet</span>
                </button>
                <button 
                  type="button"
                  className="dropdown-item-btn" 
                  onClick={() => { setIsProfileMenuOpen(false); onNavigateTab('fleet'); }}
                >
                  <Truck size={15} />
                  <span>Fleet & Tankers</span>
                </button>
                <button 
                  type="button"
                  className="dropdown-item-btn" 
                  onClick={() => { setIsProfileMenuOpen(false); onNavigateTab('settings'); }}
                >
                  <Settings size={15} />
                  <span>Bank & UPI Settings</span>
                </button>
                <div className="dropdown-divider"></div>
                <button type="button" className="dropdown-item-btn logout-action-btn" onClick={onLogout}>
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
