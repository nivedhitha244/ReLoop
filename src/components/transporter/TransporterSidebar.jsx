import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Navigation, 
  Fuel, 
  CheckCircle2, 
  Wallet, 
  LifeBuoy, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

export default function TransporterSidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  activeTripsCount = 2,
  walletBalance = 16800,
  isMobileOpen = false,
  onCloseMobile
}) {
  const orgName = currentUser?.fullName || currentUser?.organization || "EcoFlow Logistics Fleet";
  const initials = currentUser?.initials || (orgName ? orgName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : "EF");

  const navItems = [
    { id: 'dashboard', label: 'Operations Hub', icon: LayoutDashboard },
    { 
      id: 'trips', 
      label: 'Dispatch & Active Trips', 
      icon: Truck,
      badge: activeTripsCount > 0 ? String(activeTripsCount) : null,
      badgeColor: 'emerald'
    },
    { id: 'live-map', label: 'Live Route & GPS Map', icon: Navigation },
    { id: 'fleet', label: 'Fleet & Tankers', icon: Fuel },
    { id: 'proof-of-delivery', label: 'Proof of Delivery (POD)', icon: CheckCircle2 },
    { 
      id: 'payments', 
      label: 'Payment Received & Wallet', 
      icon: Wallet,
      badge: `₹${Math.round(walletBalance / 1000)}k`,
      badgeColor: 'teal'
    },
    { id: 'rescue', label: 'ReLoop Rescue Hauls', icon: LifeBuoy },
    { id: 'settings', label: 'Payout Settings & Bank', icon: Settings },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="mobile-sidebar-backdrop" onClick={onCloseMobile}></div>
      )}

      <aside className={`reloop-sidebar transporter-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        {isMobileOpen && (
          <button className="mobile-sidebar-close" onClick={onCloseMobile}>
            <X size={20} />
          </button>
        )}

        {/* Brand Header matching Seller/Buyer */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <svg className="brand-logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4C20 4 11 15 11 23C11 28 15 32 20 32C25 32 29 28 29 23C29 15 20 4 20 4Z" fill="url(#trans-drop-grad)" />
              <path d="M20 10C20 10 14 17 14 22.5C14 26 16.7 28.8 20 28.8C23.3 28.8 26 26 26 22.5C26 17 20 10 20 10Z" fill="#062826" />
              <path d="M20 13C20 13 24 17 24 21C24 23.5 22 25.5 20 25.5C18 25.5 16 23.5 16 21C16 17 20 13 20 13Z" fill="url(#trans-leaf-grad)" />
              <defs>
                <linearGradient id="trans-drop-grad" x1="11" y1="4" x2="29" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#34d399" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="trans-leaf-grad" x1="16" y1="13" x2="24" y2="25.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#047857" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">ReLoop</span>
            <span className="brand-tagline">Reuse Today, Sustain Tomorrow</span>
          </div>
        </div>

        {/* Transporter Role Badge */}
        <div className="seller-role-pill transporter-role-pill">
          <span className="seller-role-indicator-dot"></span>
          <span>Transporter Portal</span>
        </div>

        {/* Navigation Links with perfect horizontal flex layout */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon-wrap">
                  <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge-pill badge-${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Water Art & Slogan */}
        <div className="sidebar-art-container">
          <div className="sidebar-drop-art">
            <svg className="water-art-svg" viewBox="0 0 240 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="art-t-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#064e3b" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path d="M-10 100 Q 50 40 120 90 T 260 70 L 260 170 L -10 170 Z" fill="url(#art-t-grad1)" />
              <circle cx="65" cy="50" r="4.5" fill="#38bdf8" fillOpacity="0.75" />
              <circle cx="105" cy="30" r="6" fill="#34d399" fillOpacity="0.65" />
            </svg>
          </div>
          <p className="sidebar-slogan">
            Smart logistics for a<br />circular water economy.
          </p>
        </div>

        {/* User Footer Profile & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-row" title={orgName}>
            <div className="user-avatar-gp transporter-avatar">{initials}</div>
            <div className="user-info-text">
              <div className="user-name" title={orgName}>{orgName}</div>
              <div className="user-role">Logistics Fleet</div>
            </div>
          </div>

          <div className="sidebar-quick-links">
            <button className="footer-link-btn" title="Log out of account" onClick={onLogout}>
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
