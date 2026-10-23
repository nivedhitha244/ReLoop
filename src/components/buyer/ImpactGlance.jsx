import React from 'react';
import { Leaf, Droplet, Trees } from 'lucide-react';

export default function ImpactGlance({ stats }) {
  const waterReused = ((stats?.freshwaterSaved ?? 0)).toLocaleString() + ' L';
  const freshwaterAvoided = ((stats?.freshwaterSavedEq ?? 0)).toLocaleString() + ' L';
  const transportCost = '₹ ' + ((stats?.transportCost ?? 0)).toLocaleString();
  const sourcesUsed = stats?.sourcesUsed ?? 0;

  return (
    <div className="impact-glance-card">
      <div className="impact-card-header">
        <div className="impact-leaf-circle">
          <Leaf size={16} className="text-emerald-600" />
        </div>
        <h3 className="impact-title">Impact at a Glance</h3>
      </div>

      <div className="impact-stats-row">
        {/* Stat 1 */}
        <div className="impact-stat-item">
          <div className="stat-icon-wrap stat-icon-blue">
            <Droplet size={18} fill="#0284c7" stroke="#0284c7" />
          </div>
          <div className="stat-content">
            <span className="stat-highlight-val">{waterReused}</span>
            <span className="stat-sub-label">Water Reused</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="impact-stat-item">
          <div className="stat-icon-wrap stat-icon-green">
            <span className="co2-badge-text">CO₂</span>
          </div>
          <div className="stat-content">
            <span className="stat-highlight-val">{freshwaterAvoided}</span>
            <span className="stat-sub-label">Freshwater Avoided <small>(est.)</small></span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="impact-stat-item">
          <div className="stat-icon-wrap stat-icon-teal">
            <span className="currency-rupee">₹</span>
          </div>
          <div className="stat-content">
            <span className="stat-highlight-val">{transportCost}</span>
            <span className="stat-sub-label">Transport Cost <small>(est.)</small></span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="impact-stat-item">
          <div className="stat-icon-wrap stat-icon-forest">
            <Trees size={18} className="text-emerald-700" />
          </div>
          <div className="stat-content">
            <span className="stat-highlight-val">{sourcesUsed}</span>
            <span className="stat-sub-label">Sources Used</span>
          </div>
        </div>

        {/* Droplet ripple art graphic on far right */}
        <div className="impact-ripple-art">
          <svg viewBox="0 0 80 80" width="60" height="60" fill="none">
            <ellipse cx="40" cy="55" rx="32" ry="12" fill="#0284c7" fillOpacity="0.1" />
            <ellipse cx="40" cy="55" rx="20" ry="7" fill="#0284c7" fillOpacity="0.18" />
            <path d="M40 22 C40 22 49 38 49 45 C49 50 45 54 40 54 C35 54 31 50 31 45 C31 38 40 22 40 22 Z" fill="#0284c7" />
            <path d="M37 36 C37 36 34 42 34 46 C34 48 35.5 49 37 49 C38 49 38.5 48 38.5 46 C38.5 42 37 36 37 36 Z" fill="#7dd3fc" />
          </svg>
        </div>
      </div>
    </div>
  );
}
