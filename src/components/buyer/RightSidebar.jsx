import React from 'react';
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
  Receipt
} from 'lucide-react';

export default function RightSidebar({ 
  demands, 
  activities, 
  onQuickAction, 
  onOpenDemandModal, 
  onOpenRescueModal 
}) {
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

          <button 
            className="quick-action-item action-amber"
            onClick={() => onQuickAction('order-history')}
          >
            <div className="action-circle bg-amber-100 text-amber-700">
              <Receipt size={16} />
            </div>
            <div className="action-text">
              <div className="action-name">Order History & Refunds</div>
              <div className="action-desc">View receipts & cancellations →</div>
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
          </div>
          <button className="view-all-link-btn" onClick={() => onQuickAction('my-demands')}>
            View all →
          </button>
        </div>

        <div className="demands-list">
          {!demands || demands.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '13px' }}>
              <p style={{ margin: '0 0 6px', color: '#64748b', fontWeight: 600 }}>No Demands Registered</p>
              <span>Click 'Create Demand' above to post your requirement</span>
            </div>
          ) : (
            demands.map((item) => (
              <div key={item.id} className="demand-row-item">
                <div className="demand-icon-col">
                  <div className={`demand-icon-pill pill-${item.statusColor}`}>
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

      {/* 4. Recent Activity */}
      <div className="side-card activity-card">
        <div className="side-card-header flex-between">
          <div className="header-icon-label">
            <Clock size={16} className="text-emerald-700" />
            <h3 className="side-card-title">Recent Activity</h3>
          </div>
          <button className="view-all-link-btn">
            View all →
          </button>
        </div>

        <div className="activity-list">
          {!activities || activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '13px' }}>
              <span>No recent activities recorded yet</span>
            </div>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="activity-item-row">
                <div className={`activity-icon-wrap icon-${act.type}`}>
                  {act.type === 'match' && <Link2 size={13} />}
                  {act.type === 'approval' && <FileText size={13} />}
                  {act.type === 'source' && <Droplet size={13} />}
                  {act.type === 'complete' && <CheckCircle2 size={13} />}
                  {act.type === 'rescue' && <ShieldAlert size={13} />}
                </div>
                <div className="activity-text">
                  <div className="act-title-time">
                    <span className="act-title">{act.title}</span>
                    <span className="act-time">{act.time}</span>
                  </div>
                  <div className="act-detail">{act.detail}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
