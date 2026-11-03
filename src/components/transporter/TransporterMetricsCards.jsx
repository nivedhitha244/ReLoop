import React from 'react';
import { 
  Truck, 
  Droplet, 
  Navigation, 
  Wallet, 
  Fuel, 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';

export default function TransporterMetricsCards({ stats, onOpenPayoutModal, onNavigateTab }) {
  const activeDispatches = stats?.activeDispatches ?? 2;
  const completedDeliveries = stats?.completedDeliveries ?? 26;
  const totalLitres = stats?.totalLitresTransported ?? 104000;
  const totalKm = stats?.totalKmTraversed ?? 485;
  const totalEarnings = stats?.totalEarnings ?? 52400;
  const availableBalance = stats?.availableBalance ?? 16800;
  const escrowBalance = stats?.escrowBalance ?? 3950;
  const fleetTotal = stats?.fleetTotal ?? 4;
  const availableTankers = stats?.availableTankers ?? 2;

  const cards = [
    {
      id: 'active-dispatches',
      title: "Active Dispatches",
      value: String(activeDispatches),
      subtitle: `${completedDeliveries} completed deliveries`,
      icon: Truck,
      variant: "emerald",
      badge: "In Transit & Assigned",
      actionKey: 'trips',
      linkText: "View dispatches →"
    },
    {
      id: 'litres-hauled',
      title: "Total Litres Hauled",
      value: `${(totalLitres / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}k L`,
      subtitle: `${totalLitres.toLocaleString('en-IN')} L confirmed reused`,
      icon: Droplet,
      variant: "blue",
      badge: "Zero Freshwater Wasted",
      actionKey: 'trips',
      linkText: "Water log →"
    },
    {
      id: 'distance-covered',
      title: "Transit Distance Covered",
      value: `${totalKm} km`,
      subtitle: "Optimized route corridors",
      icon: Navigation,
      variant: "teal",
      badge: "Avg 4.8 km / trip",
      actionKey: 'live-map',
      linkText: "Route map →"
    },
    {
      id: 'fleet-readiness',
      title: "Fleet Readiness",
      value: `${availableTankers} / ${fleetTotal}`,
      subtitle: "Tanker bowlers on standby",
      icon: Fuel,
      variant: "amber",
      badge: "100% Sanitized",
      actionKey: 'fleet',
      linkText: "Manage fleet →"
    },
    {
      id: 'available-wallet',
      title: "Available Wallet Payout",
      value: `₹${availableBalance.toLocaleString('en-IN')}`,
      subtitle: `+₹${escrowBalance.toLocaleString('en-IN')} in escrow`,
      icon: Wallet,
      variant: "teal",
      badge: "Instant Withdrawal",
      action: onOpenPayoutModal,
      actionLabel: "Withdraw Payout"
    },
    {
      id: 'lifetime-fees',
      title: "Lifetime Transport Fees",
      value: `₹${totalEarnings.toLocaleString('en-IN')}`,
      subtitle: "Gross logistics revenue settled",
      icon: TrendingUp,
      variant: "indigo",
      badge: "Avg ₹1,340 / delivery",
      actionKey: 'payments',
      linkText: "Payment ledger →"
    }
  ];

  return (
    <div className="transporter-metrics-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div 
            key={card.id} 
            className={`metric-card card-${card.variant} ${card.actionKey ? 'clickable-metric-card' : ''}`}
            onClick={() => {
              if (card.action) card.action();
              else if (card.actionKey && onNavigateTab) onNavigateTab(card.actionKey);
            }}
          >
            {/* Background wave watermark */}
            <svg viewBox="0 0 100 60" fill="none" className="card-watermark-svg">
              <path d="M0 42 Q 30 20 60 40 T 100 25 L 100 60 L 0 60 Z" fill="currentColor" fillOpacity="0.08" />
            </svg>

            <div className="metric-card-content">
              <div className="metric-header-row">
                <div className={`metric-icon-bubble bubble-${card.variant}`}>
                  <Icon size={18} strokeWidth={2.4} />
                </div>
                <span className="metric-title">{card.title}</span>
              </div>

              <div className="metric-value-row">
                <span className="metric-number">{card.value}</span>
              </div>

              <div className="metric-footer-row">
                <span className="metric-sub">{card.subtitle}</span>
                {card.action ? (
                  <button 
                    type="button"
                    className="metric-quick-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      card.action();
                    }}
                  >
                    {card.actionLabel}
                  </button>
                ) : (
                  <span className={`metric-link link-${card.variant}`}>
                    {card.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
