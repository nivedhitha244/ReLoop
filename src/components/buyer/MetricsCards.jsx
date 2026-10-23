import React from 'react';
import { Droplet, Check, Leaf, AlertTriangle, ArrowRight } from 'lucide-react';

export default function MetricsCards({ stats, onActionClick }) {
  const formatLiters = (num) => {
    return Number(num !== undefined && num !== null ? num : 0).toLocaleString() + ' L';
  };

  const totalDemandVal = stats?.totalDemand ?? 0;
  const activeRequestsCountVal = stats?.activeRequestsCount ?? 0;
  const matchedQuantityVal = stats?.matchedQuantity ?? 0;
  const matchedPercentVal = stats?.matchedPercent ?? 0;
  const freshwaterSavedVal = stats?.freshwaterSaved ?? 0;
  const freshwaterSavedEqVal = stats?.freshwaterSavedEq ?? 0;
  const unmetDemandVal = stats?.unmetDemand ?? 0;

  const cards = [
    {
      id: 'total-demand',
      title: 'Total Demand',
      value: formatLiters(totalDemandVal),
      subtitle: `Across ${activeRequestsCountVal} active requests`,
      linkText: 'View all →',
      actionKey: 'demands',
      icon: Droplet,
      variant: 'blue',
      watermarkSvg: (
        <svg viewBox="0 0 100 60" fill="none" className="card-watermark-svg">
          <path d="M0 40 Q 25 15 50 35 T 100 20 L 100 60 L 0 60 Z" fill="#38bdf8" fillOpacity="0.2" />
          <path d="M0 48 Q 30 25 60 42 T 100 30 L 100 60 L 0 60 Z" fill="#0284c7" fillOpacity="0.1" />
        </svg>
      )
    },
    {
      id: 'matched-quantity',
      title: 'Matched Quantity',
      value: formatLiters(matchedQuantityVal),
      subtitle: `${matchedPercentVal}% of total demand`,
      linkText: 'View matches →',
      actionKey: 'matches',
      icon: Check,
      variant: 'teal',
      watermarkSvg: (
        <svg viewBox="0 0 100 60" fill="none" className="card-watermark-svg">
          <path d="M0 42 Q 30 20 60 40 T 100 25 L 100 60 L 0 60 Z" fill="#2dd4bf" fillOpacity="0.2" />
        </svg>
      )
    },
    {
      id: 'freshwater-saved',
      title: 'Freshwater Saved (Est.)',
      value: formatLiters(freshwaterSavedVal),
      subtitle: `= ${Number(freshwaterSavedEqVal).toLocaleString()} L of freshwater equivalent`,
      linkText: 'View report →',
      actionKey: 'reports',
      icon: Leaf,
      variant: 'emerald',
      watermarkSvg: (
        <svg viewBox="0 0 100 60" fill="none" className="card-watermark-svg">
          <path d="M70 10 C 85 20 95 40 90 60 C 75 55 60 45 65 25 Z" fill="#10b981" fillOpacity="0.15" />
          <path d="M85 30 C 95 40 100 50 95 60 C 85 58 78 50 82 38 Z" fill="#059669" fillOpacity="0.1" />
        </svg>
      )
    },
    {
      id: 'unmet-demand',
      title: 'Unmet Demand',
      value: formatLiters(unmetDemandVal),
      subtitle: unmetDemandVal > 0 ? 'Requiring verified source' : 'All demands satisfied',
      linkText: 'Find more →',
      actionKey: 'find-water',
      icon: AlertTriangle,
      variant: 'coral',
      watermarkSvg: (
        <svg viewBox="0 0 100 60" fill="none" className="card-watermark-svg">
          <polygon points="80,15 95,45 65,45" fill="#f87171" fillOpacity="0.15" />
        </svg>
      )
    }
  ];

  return (
    <div className="metrics-cards-grid">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.id} className={`metric-card card-${c.variant}`}>
            {c.watermarkSvg}
            <div className="metric-card-content">
              <div className="metric-header-row">
                <div className={`metric-icon-bubble bubble-${c.variant}`}>
                  <Icon size={18} strokeWidth={2.4} />
                </div>
                <span className="metric-title">{c.title}</span>
              </div>

              <div className="metric-value-row">
                <span className="metric-number">{c.value}</span>
              </div>

              <div className="metric-footer-row">
                <span className="metric-sub">{c.subtitle}</span>
                <button 
                  className={`metric-link link-${c.variant}`}
                  onClick={() => onActionClick && onActionClick(c.actionKey)}
                >
                  {c.linkText}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
