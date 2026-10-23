import React from 'react';
import { 
  Factory, 
  Leaf, 
  Building2, 
  Home, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Droplet 
} from 'lucide-react';

export default function SourcesTable({ sources, onRequestClick, onViewAll }) {
  const getSourceIcon = (iconType, name = '') => {
    if (name.includes('Rain') || iconType === 'rain') return <Droplet size={16} className="text-teal-600" />;
    if (name.includes('STP')) return <Leaf size={16} className="text-emerald-600" />;
    if (name.includes('IT Park')) return <Building2 size={16} className="text-blue-600" />;
    if (name.includes('Apartment')) return <Home size={16} className="text-sky-600" />;
    return <Factory size={16} className="text-blue-600" />;
  };

  return (
    <div className="sources-table-card">
      <div className="sources-table-header">
        <div className="table-header-left">
          <Droplet size={18} className="sources-header-icon" />
          <h2 className="sources-table-title">Available Water Sources (Nearby)</h2>
        </div>
        <button className="view-all-link-btn" onClick={onViewAll}>
          View all →
        </button>
      </div>

      <div className="table-responsive-wrapper">
        <table className="custom-reloop-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Distance</th>
              <th>Quality</th>
              <th className="th-action">Action</th>
              <th className="th-chevron"></th>
            </tr>
          </thead>
          <tbody>
            {sources.map((src) => (
              <tr key={src.id} className="source-table-row">
                <td className="td-source-name">
                  <div className="source-icon-cell">
                    <div className="source-avatar-icon">
                      {getSourceIcon(src.iconType, src.name || '')}
                    </div>
                    <span className="source-label-text">{src.name}</span>
                  </div>
                </td>
                <td className="td-type">{src.type}</td>
                <td className="td-quantity">
                  <strong>{(src.quantity || 0).toLocaleString()} L</strong>
                </td>
                <td className="td-distance">{src.distance !== undefined ? src.distance : 5.5} km</td>
                <td className="td-quality">
                  <span className={`quality-badge badge-${(src.quality || 'Verified').toLowerCase()}`}>
                    {src.quality === 'Verified' ? (
                      <CheckCircle2 size={12} className="badge-icon" />
                    ) : (
                      <Clock size={12} className="badge-icon" />
                    )}
                    {src.quality || 'Verified'}
                  </span>
                </td>
                <td className="td-action">
                  <button 
                    className="request-btn"
                    onClick={() => onRequestClick(src)}
                  >
                    Request
                  </button>
                </td>
                <td className="td-chevron">
                  <ChevronRight size={16} className="row-chevron-icon" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
