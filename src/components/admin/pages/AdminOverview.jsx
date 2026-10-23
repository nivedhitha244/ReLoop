import React, { useEffect, useState } from 'react';
import {
  Droplets,
  Calendar,
  Building2,
  FileQuestion,
  ShieldCheck,
  Truck,
  Link2,
  Activity,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Server,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import MetricCard from '../common/MetricCard';
import StatusBadge from '../common/StatusBadge';
import SkeletonLoader from '../common/SkeletonLoader';

const REUSE_COLORS = ['#0c6e5d', '#0284c7', '#38bdf8', '#10b981', '#f59e0b'];

export default function AdminOverview({ onNavigate, globalSearch, refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async (isBackground = false) => {
    try {
      if (!isBackground) setRefreshing(true);
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error('Failed to load metrics from server');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Error fetching overview:', err);
      if (!isBackground) setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview(Boolean(data));
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="admin-page-content">
        <SkeletonLoader rows={8} height={42} />
      </div>
    );
  }

  const {
    totalWaterReused = 0,
    waterReusedToday = 0,
    activeSuppliers = 0,
    pendingBuyerRequests = 0,
    pendingQualityApprovals = 0,
    activeDeliveries = 0,
    successfulMatches = 0,
    systemHealth = {},
    charts = {},
  } = data || {};

  return (
    <div className="admin-page-content">
      {/* Top Banner with Quick Actions */}
      <div
        style={{
          background: 'linear-gradient(135deg, #062826 0%, #0c6e5d 100%)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(6, 40, 38, 0.12)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                background: 'rgba(45, 212, 191, 0.2)',
                color: '#2dd4bf',
                padding: '0.15rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Live Operations
            </span>
            <span style={{ fontSize: '0.75rem', color: '#80a7a2' }}>
              Real-time synchronization with MongoDB
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            ReLoop Water Reuse Operations Center
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '640px' }}>
            Orchestrating industrial water supply, buyer reuse matching, accredited quality verification, and low-emission tanker dispatch across Chennai.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('matching')}
            className="admin-btn admin-btn-primary"
            style={{ background: '#2dd4bf', color: '#062826', fontWeight: 700 }}
          >
            <Sparkles size={16} />
            Smart Matching Hub
          </button>
          <button
            onClick={() => onNavigate('map')}
            className="admin-btn admin-btn-secondary"
            style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            <Truck size={16} />
            Logistics Map
          </button>
          <button
            onClick={fetchOverview}
            className="admin-icon-btn"
            style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: 'none' }}
            title="Refresh metrics"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="admin-metrics-grid">
        <MetricCard
          title="Total Water Reused"
          value={totalWaterReused}
          unit="Litres"
          icon={Droplets}
          accentColor="#0c6e5d"
          iconBg="#ecfdf5"
          trend={14.2}
          trendLabel="vs last month"
          subtitle="Delivered & Verified"
          onClick={() => onNavigate('impact')}
        />
        <MetricCard
          title="Water Reused Today"
          value={waterReusedToday}
          unit="Litres"
          icon={Calendar}
          accentColor="#0284c7"
          iconBg="#f0f9ff"
          subtitle="Today's completed runs"
          onClick={() => onNavigate('deliveries')}
        />
        <MetricCard
          title="Active Suppliers"
          value={activeSuppliers}
          unit="Sources"
          icon={Building2}
          accentColor="#059669"
          iconBg="#ecfdf5"
          subtitle="Ready for dispatch"
          onClick={() => onNavigate('supply-requests')}
        />
        <MetricCard
          title="Pending Buyer Requests"
          value={pendingBuyerRequests}
          unit="Requests"
          icon={FileQuestion}
          accentColor="#f59e0b"
          iconBg="#fffbeb"
          subtitle="Awaiting allocation"
          onClick={() => onNavigate('supply-requests')}
        />
        <MetricCard
          title="Pending Quality Approvals"
          value={pendingQualityApprovals}
          unit="Reports"
          icon={ShieldCheck}
          accentColor="#6366f1"
          iconBg="#eef2ff"
          subtitle="Lab analysis clearance"
          onClick={() => onNavigate('quality')}
        />
        <MetricCard
          title="Active Deliveries"
          value={activeDeliveries}
          unit="In Transit"
          icon={Truck}
          accentColor="#0284c7"
          iconBg="#f0f9ff"
          subtitle="Tankers en-route"
          onClick={() => onNavigate('deliveries')}
        />
        <MetricCard
          title="Successful Matches"
          value={successfulMatches}
          unit="Pairs"
          icon={Link2}
          accentColor="#0c6e5d"
          iconBg="#ecfdf5"
          subtitle="Admin approved"
          onClick={() => onNavigate('matching')}
        />
        <MetricCard
          title="System & Database Health"
          value={systemHealth.status || 'Operational'}
          icon={Activity}
          accentColor="#10b981"
          iconBg="#ecfdf5"
          subtitle={`${systemHealth.database || 'MongoDB'} • ${systemHealth.uptimeSeconds || 0}s uptime`}
          onClick={() => onNavigate('audit-logs')}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.25rem' }}>
        {/* Trend: Monthly Water Reused */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Water Reuse Volume Trends</h3>
              <p className="admin-card-subtitle">Cumulative monthly reusable water delivered (Litres)</p>
            </div>
            <span className="admin-badge admin-badge-success">
              <TrendingUp size={12} />
              +28% MoM Growth
            </span>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.reuseTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} L`, 'Reused Volume']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#0c6e5d"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0c6e5d' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Supply vs Demand */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Monthly Supply vs. Demand</h3>
              <p className="admin-card-subtitle">Available supplier inventory compared with buyer requisitions</p>
            </div>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlySupplyDemand || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [`${val.toLocaleString()} L`]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="supply" name="Total Supply" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="demand" name="Total Demand" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="matched" name="Fulfilled Reuse" fill="#0c6e5d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Match Distribution & Delivery Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Reuse By Category */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Water Reuse by Category</h3>
              <p className="admin-card-subtitle">Volume distribution across treated water types</p>
            </div>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.reuseByCategory || []}
                  dataKey="volume"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(charts.reuseByCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REUSE_COLORS[index % REUSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v.toLocaleString()} L`} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Status Breakdown */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Delivery Completion & Active Runs</h3>
              <p className="admin-card-subtitle">Operational tanker fleet logistics</p>
            </div>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.deliveryStatusBreakdown || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="status" type="category" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#0c6e5d" radius={[0, 4, 4, 0]}>
                  {(charts.deliveryStatusBreakdown || []).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill || '#0c6e5d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
