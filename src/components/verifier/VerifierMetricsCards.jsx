import React from 'react';
import { 
  FlaskConical, 
  ShieldCheck, 
  ShieldAlert, 
  Wallet, 
  TrendingUp, 
  Award,
  ArrowRight
} from 'lucide-react';

export default function VerifierMetricsCards({ stats, onOpenPayoutModal, onNavigateTab }) {
  const pendingAudits = stats?.pendingAudits ?? 3;
  const sourcesCertified = stats?.sourcesCertified ?? 34;
  const sourcesBlocked = stats?.sourcesBlocked ?? 5;
  const totalTests = stats?.totalTestsConducted ?? 39;
  const availableBalance = stats?.availableBalance ?? 32500;
  const escrowBalance = stats?.escrowBalance ?? 5000;
  const totalEarnings = stats?.totalEarnings ?? 97500;
  const standardFee = stats?.standardFee ?? 2500;

  const cards = [
    {
      id: 'pending-audits',
      title: "Pending Sample Audits",
      value: String(pendingAudits),
      subtitle: `${totalTests} total tests completed`,
      icon: FlaskConical,
      variant: "amber",
      badge: "High & Standard Urgency",
      actionKey: 'queue',
      linkText: "Review queue →"
    },
    {
      id: 'certified-sources',
      title: "Certified Safe Sources",
      value: String(sourcesCertified),
      subtitle: "Active for ReLoop matching",
      icon: ShieldCheck,
      variant: "cyan",
      badge: "87.2% Pass Rate",
      actionKey: 'registry',
      linkText: "Registry archive →"
    },
    {
      id: 'blocked-sources',
      title: "Blocked Unsafe Sources",
      value: String(sourcesBlocked),
      subtitle: "ReLoop Rescue Swapped",
      icon: ShieldAlert,
      variant: "rose",
      badge: "Safety Gate Triggered",
      actionKey: 'alerts',
      linkText: "Risk log →"
    },
    {
      id: 'standard-fee',
      title: "Standard Test Fee",
      value: `₹${standardFee.toLocaleString('en-IN')}`,
      subtitle: "Per CPCB lab sample audit",
      icon: Award,
      variant: "teal",
      badge: "Pre-Funded Escrow",
      actionKey: 'audit-testing',
      linkText: "Test suite →"
    },
    {
      id: 'available-wallet',
      title: "Available Audit Wallet",
      value: `₹${availableBalance.toLocaleString('en-IN')}`,
      subtitle: `+₹${escrowBalance.toLocaleString('en-IN')} pending clearance`,
      icon: Wallet,
      variant: "cyan",
      badge: "Instant Withdrawal",
      action: onOpenPayoutModal,
      actionLabel: "Withdraw Payout"
    },
    {
      id: 'total-earnings',
      title: "Total Verification Earnings",
      value: `₹${totalEarnings.toLocaleString('en-IN')}`,
      subtitle: "Lab revenue settled",
      icon: TrendingUp,
      variant: "indigo",
      badge: "100% On-Time Payouts",
      actionKey: 'payments',
      linkText: "Audit ledger →"
    }
  ];

  return (
    <div className="verifier-metrics-grid">
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
                    className="metric-quick-action-btn verifier-quick-btn"
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
