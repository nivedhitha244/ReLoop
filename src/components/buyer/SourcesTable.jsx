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

export default function SourcesTable({ sources = [], onRequestClick, onViewAll }) {
  const getSourceIcon = (iconType, name = '') => {
    const n = String(name || '');
    if (n.includes('STP')) return <Leaf size={16} className="text-emerald-600" />;
    if (n.includes('IT Park')) return <Building2 size={16} className="text-blue-600" />;
    if (n.includes('Apartment')) return <Home size={16} className="text-sky-600" />;
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
            {!sources || sources.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  <Droplet size={28} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#334155' }}>No water sources registered yet</p>
                  <span style={{ fontSize: '13px' }}>Switch to the <strong>Supplier Portal</strong> to register a water source, and it will appear here immediately!</span>
                </td>
              </tr>
            ) : (
              sources.map((src) => {
                const quality = src.quality || src.verificationStatus || 'Verified';
                const quantity = Number(src.quantity ?? src.availableQuantity ?? 0);
                const distance = src.distance !== undefined ? src.distance : 5.5;
                const srcName = src.name || src.sourceName || 'Water Source';
                const srcType = src.type || src.waterCategory || src.category || 'Recycled Water';

                return (
                  <tr key={src.id || src._id || Math.random()} className="source-table-row">
                    <td className="td-source-name">
                      <div className="source-icon-cell">
                        <div className="source-avatar-icon">
                          {getSourceIcon(src.iconType, srcName)}
                        </div>
                        <span className="source-label-text">{srcName}</span>
                      </div>
                    </td>
                    <td className="td-type">{srcType}</td>
                    <td className="td-quantity">
                      <strong>{quantity.toLocaleString()} L</strong>
                    </td>
                    <td className="td-distance">{distance} km</td>
                    <td className="td-quality">
                      <span className={`quality-badge badge-${(quality || 'verified').toLowerCase()}`}>
                        {quality === 'Verified' ? (
                          <CheckCircle2 size={12} className="badge-icon" />
                        ) : (
                          <Clock size={12} className="badge-icon" />
                        )}
                        {quality}
                      </span>
                    </td>
                    <td className="td-action">
                      <button 
                        className="request-btn"
                        onClick={() => onRequestClick && onRequestClick(src)}
                      >
                        Request
                      </button>
                    </td>
                    <td className="td-chevron">
                      <ChevronRight size={16} className="row-chevron-icon" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
