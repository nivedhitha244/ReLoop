import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Wallet, 
  Award, 
  LogOut, 
  Settings, 
  ChevronDown,
  FileCheck2,
  FlaskConical
} from 'lucide-react';

export default function VerifierHeader({ 
  searchQuery, 
  setSearchQuery, 
  currentUser, 
  onLogout,
  onNavigateTab,
  onOpenPayoutModal,
  unreadCount = 3,
  walletBalance = 32500,
  onToggleMobile
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const labName = currentUser?.fullName || currentUser?.organization || "AquaCert Labs Quality Assurance";
  const initials = currentUser?.initials || (labName ? labName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : "AQ");

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
    <header className="reloop-top-header verifier-header">
      {/* Search Field */}
      <div className="header-left-wrap">
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search water sample queues, certified sources, certificates, or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="header-actions">
        {/* NABL Certification Badge */}
        <div className="lab-accreditation-pill" title="NABL Accredited Testing Laboratory (ISO/IEC 17025)">
          <Award size={15} className="text-cyan-500" />
          <span>NABL & CPCB Certified Lab</span>
        </div>

        {/* Quick Wallet & Payout Pill */}
        <div 
          className="header-wallet-pill verifier-wallet-pill"
          onClick={onOpenPayoutModal}
          role="button"
          tabIndex={0}
          title="Click to withdraw audit earnings"
        >
          <Wallet size={16} className="text-cyan-600" />
          <div className="wallet-pill-content">
            <span className="wallet-pill-label">AUDIT WALLET</span>
            <span className="wallet-pill-amount">₹{walletBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Notifications Icon */}
        <button 
          type="button"
          className="notification-bell-btn"
          onClick={() => onNavigateTab('queue')}
          title="Pending water quality inspections"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge-count">{unreadCount}</span>}
        </button>

        {/* Verifier Profile Menu */}
        <div className="header-profile-menu-wrap" ref={menuRef}>
          <div 
            className="header-user-badge verifier-user-badge"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            role="button"
            tabIndex={0}
          >
            <div className="badge-avatar verifier-avatar">{initials}</div>
            <div className="badge-text">
              <span className="badge-name" title={labName}>{labName}</span>
              <span className="badge-role">Quality Verifier</span>
            </div>
            <ChevronDown size={14} className="badge-dropdown-arrow" />
          </div>

          {isProfileMenuOpen && (
            <div className="profile-dropdown-card">
              <div className="dropdown-header">
                <div className="dropdown-avatar verifier-avatar">{initials}</div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{labName}</div>
                  <div className="dropdown-user-email">{currentUser?.email || "verifier@reloop.org"}</div>
                  <span className="dropdown-verified-badge" style={{ backgroundColor: '#ecfeff', color: '#0891b2', borderColor: '#a5f3fc' }}>
                    <Award size={12} /> Accredited Lab
                  </span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-items-list">
                <button 
                  type="button"
                  className="dropdown-item-btn" 
                  onClick={() => { setIsProfileMenuOpen(false); onNavigateTab('audit-testing'); }}
                >
                  <FileCheck2 size={15} />
                  <span>Safety Gate Test Suite</span>
                </button>
                <button 
                  type="button"
                  className="dropdown-item-btn" 
                  onClick={() => { setIsProfileMenuOpen(false); onNavigateTab('payments'); }}
                >
                  <Wallet size={15} />
                  <span>Audit Fees & Wallet</span>
                </button>
                <button 
                  type="button"
                  className="dropdown-item-btn" 
                  onClick={() => { setIsProfileMenuOpen(false); onNavigateTab('settings'); }}
                >
                  <Settings size={15} />
                  <span>Lab Accreditation & Bank</span>
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
