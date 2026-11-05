import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Link2, 
  ShieldAlert, 
  ChevronRight, 
  Droplet, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  RefreshCw,
  AlertCircle,
  Truck,
  Activity
} from 'lucide-react';

export default function RightSidebar({ 
  demands, 
  activities = [], 
  onQuickAction, 
  onOpenDemandModal, 
  onOpenRescueModal 
}) {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const totalActivities = (activities || []).length;
  const initialDisplayCount = 5;
  const displayedActivities = showAllActivities 
    ? (activities || []) 
    : (activities || []).slice(0, initialDisplayCount);

  return (
    <aside className="reloop-right-column">
      {/* 1. Quick Actions */}
      <div className="side-card quick-actions-card">
        <div className="side-card-header">
          <Sparkles size={16} className="text-emerald-600" />
          <h3 className="side-card-title">Quick Actions</h3>
        </div>

        <div className="quick-action-list">
          <button 
            className="quick-action-item action-green"
            onClick={() => onQuickAction('find-water')}
          >
            <div className="action-circle bg-emerald-100 text-emerald-700">
              <Search size={16} />
            </div>
            <div className="action-text">
              <div className="action-name">Find Water</div>
              <div className="action-desc">Browse available sources →</div>
            </div>
          </button>

          <button 
            className="quick-action-item action-blue"
            onClick={onOpenDemandModal}
          >
            <div className="action-circle bg-blue-100 text-blue-700">
              <FileText size={16} />
            </div>
            <div className="action-text">
              <div className="action-name">Create Demand</div>
              <div className="action-desc">Request water for your needs →</div>
            </div>
          </button>

          <button 
            className="quick-action-item action-purple"
            onClick={() => onQuickAction('my-matches')}
          >
            <div className="action-circle bg-purple-100 text-purple-700">
              <Link2 size={16} />
            </div>
            <div className="action-text">
              <div className="action-name">View Matches</div>
              <div className="action-desc">Check suitable options →</div>
            </div>
          </button>

          <button 
            className="quick-action-item action-teal"
            onClick={onOpenRescueModal}
          >
            <div className="action-circle bg-teal-100 text-teal-700">
              <ShieldAlert size={16} />
            </div>
            <div className="action-text">
              <div className="action-name">ReLoop Rescue</div>
              <div className="action-desc">Find alternative sources →</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Promo Banner Card */}
      <div className="side-card promo-banner-card">
        <div className="promo-img-wrapper">
          <img 
            src="/city-banner.jpg" 
            alt="Greener cities through water reuse" 
            className="promo-bg-img"
          />
          <div className="promo-overlay-gradient"></div>
          <div className="promo-overlay-content">
            <h4 className="promo-title">
              Greener cities<br />through smarter<br />water reuse.
            </h4>
            <div className="promo-brand-tag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="#2dd4bf"/>
              </svg>
              <span>ReLoop</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. My Demands List */}
      <div className="side-card my-demands-card">
        <div className="side-card-header flex-between">
          <div className="header-icon-label">
            <FileText size={16} className="text-emerald-700" />
            <h3 className="side-card-title">My Demands</h3>
            {demands && demands.length > 0 && (
              <span className="activity-count-badge">{demands.length}</span>
            )}
          </div>
          <button className="view-all-link-btn" onClick={() => onQuickAction('my-demands')}>
            View all →
          </button>
        </div>

        <div className="demands-list">
          {(!demands || demands.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '13px' }}>
              <span>No active demands</span>
            </div>
          ) : (
            demands.slice(0, 4).map((item) => (
              <div key={item.id} className="demand-row-item">
                <div className="demand-icon-col">
                  <div className={`demand-icon-pill pill-${item.statusColor || 'green'}`}>
                    <FileText size={15} />
                  </div>
                </div>

                <div className="demand-details">
                  <div className="demand-name">{item.title}</div>
                  <div className="demand-meta">
                    {(item.quantity || item.requiredQuantity || 0).toLocaleString()} L · {item.purpose}
                  </div>
                </div>

                <div className="demand-status-col">
                  <span className={`status-pill pill-${(item.status || 'Active').toLowerCase()}`}>
                    {item.status || 'Active'}
                  </span>
                  <ChevronRight size={15} className="demand-chevron" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Recent Activity (Compact, Fixed Max-Height with Independent Scrolling) */}
      <div className="side-card activity-card">
        <div className="side-card-header flex-between">
          <div className="header-icon-label">
            <Clock size={16} className="text-emerald-700" />
            <h3 className="side-card-title">Recent Activity</h3>
            {totalActivities > 0 && (
              <span className="activity-count-badge">{totalActivities}</span>
            )}
          </div>
          {totalActivities > initialDisplayCount && (
            <button 
              type="button"
              className="view-all-link-btn"
              onClick={() => setShowAllActivities(!showAllActivities)}
              title={showAllActivities ? "Show compact view" : "View full activity history"}
            >
              {showAllActivities ? 'Show less ↑' : `View all (${totalActivities}) →`}
            </button>
          )}
        </div>

        <div className={`activity-list ${showAllActivities ? 'expanded-scroll' : ''}`}>
          {(!activities || activities.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '13px' }}>
              <span>No recent activities recorded</span>
            </div>
          ) : (
            displayedActivities.map((act) => (
              <div key={act.id} className="activity-item-row">
                <div className={`activity-icon-wrap icon-${act.type || 'source'}`}>
                  {act.type === 'match' && <Link2 size={13} />}
                  {act.type === 'approval' && <FileText size={13} />}
                  {act.type === 'source' && <Droplet size={13} />}
                  {act.type === 'complete' && <CheckCircle2 size={13} />}
                  {act.type === 'rescue' && <ShieldAlert size={13} />}
                  {act.type === 'demand' && <FileText size={13} />}
                  {act.type === 'request' && <Droplet size={13} />}
                  {act.type === 'rejection' && <AlertCircle size={13} />}
                  {act.type === 'transit' && <Truck size={13} />}
                  {!['match', 'approval', 'source', 'complete', 'rescue', 'demand', 'request', 'rejection', 'transit'].includes(act.type) && (
                    <Clock size={13} />
                  )}
                </div>
                <div className="activity-text">
                  <div className="act-title-time">
                    <span className="act-title">{act.title}</span>
                    <span className="act-time">{act.time || 'Recently'}</span>
                  </div>
                  <div className="act-detail">{act.detail}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalActivities > initialDisplayCount && !showAllActivities && (
          <div className="activity-footer-fade">
            <button 
              type="button"
              className="activity-expand-btn"
              onClick={() => setShowAllActivities(true)}
            >
              Show {totalActivities - initialDisplayCount} more activities...
            </button>
          </div>
        )}
      </div>

      {/* 5. Need More Water Card */}
      <div className="side-card need-water-card">
        <div className="need-water-leaf-art">
          <Droplet size={20} className="text-emerald-500" />
        </div>
        <div className="need-water-title">Need more water?</div>
        <p className="need-water-desc">
          Find better matches, explore nearby sources or create a new request.
        </p>
        <button 
          className="find-water-btn"
          onClick={() => onQuickAction('find-water')}
        >
          Find Water →
        </button>
      </div>

      {/* 6. ReLoop Rescue Card */}
      <div className="side-card rescue-promo-card">
        <div className="rescue-card-top">
          <div className="rescue-shield-icon">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <button className="rescue-sync-icon" onClick={onOpenRescueModal} title="Refresh Backup">
            <RefreshCw size={17} />
          </button>
        </div>

        <h4 className="rescue-heading">ReLoop Rescue</h4>
        <p className="rescue-desc">
          A source becomes unavailable? We'll find an alternative for you within 10 km.
        </p>

        <button 
          className="try-rescue-btn"
          onClick={onOpenRescueModal}
        >
          Try Rescue →
        </button>
      </div>
    </aside>
  );
}
