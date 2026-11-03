import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Droplet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Wallet, 
  ArrowRight, 
  Fuel, 
  ShieldCheck, 
  Download, 
  FileText, 
  ChevronRight, 
  Layers, 
  Radio, 
  Play, 
  RefreshCw, 
  ExternalLink,
  PlusCircle,
  Building,
  UserCheck
} from 'lucide-react';

// ============================================================================
// 1. OPERATIONS HUB / OVERVIEW TAB
// ============================================================================
export function TransporterOverviewTab({ 
  stats, 
  trips = [], 
  fleet = [], 
  onNavigateTab, 
  onOpenPayoutModal, 
  onOpenPodModal, 
  onAdvanceTripStatus 
}) {
  const activeTrip = trips.find(t => t.currentStatus === 'In Transit') || trips[0];

  return (
    <div className="transporter-tab-content">
      {/* Active Trip Hero Banner */}
      {activeTrip && (
        <div className="active-dispatch-hero">
          <div className="dispatch-hero-badge">
            <span className="live-dot pulse"></span>
            <span>LIVE HAUL IN PROGRESS • {activeTrip.deliveryRef}</span>
          </div>
          <div className="dispatch-hero-grid">
            <div className="dispatch-route-visual">
              <div className="route-point">
                <div className="point-icon pickup">
                  <Droplet size={16} />
                </div>
                <div className="point-meta">
                  <span className="point-label">PICKUP SOURCE</span>
                  <strong className="point-name">{activeTrip.sourceName}</strong>
                  <p className="point-addr">{activeTrip.sourceAddress}</p>
                </div>
              </div>

              <div className="route-connector">
                <div className="connector-line"></div>
                <div className="connector-badge">
                  <Truck size={14} />
                  <span>{activeTrip.distanceKm} km • ~{activeTrip.estimatedTimeMinutes} mins</span>
                </div>
              </div>

              <div className="route-point">
                <div className="point-icon dropoff">
                  <MapPin size={16} />
                </div>
                <div className="point-meta">
                  <span className="point-label">BUYER DESTINATION</span>
                  <strong className="point-name">{activeTrip.destinationName}</strong>
                  <p className="point-addr">{activeTrip.destinationAddress}</p>
                </div>
              </div>
            </div>

            <div className="dispatch-telemetry-panel">
              <div className="telemetry-item">
                <span className="tel-label">Assigned Vehicle</span>
                <strong className="tel-val">{activeTrip.vehicleNumber}</strong>
                <span className="tel-sub">{activeTrip.tankerModel}</span>
              </div>
              <div className="telemetry-item">
                <span className="tel-label">Driver In Cab</span>
                <strong className="tel-val">{activeTrip.driverName}</strong>
                <a href={`tel:${activeTrip.driverPhone}`} className="tel-link">
                  <Phone size={12} /> {activeTrip.driverPhone}
                </a>
              </div>
              <div className="telemetry-item">
                <span className="tel-label">Water Cargo</span>
                <strong className="tel-val text-emerald-400">
                  {activeTrip.quantityLitres.toLocaleString('en-IN')} L
                </strong>
                <span className="tel-sub">{activeTrip.waterCategory}</span>
              </div>
              <div className="telemetry-item">
                <span className="tel-label">Transport Fee</span>
                <strong className="tel-val text-teal-400">
                  ₹{activeTrip.transportFee?.toLocaleString('en-IN')}
                </strong>
                <span className="tel-sub">Escrow Protected</span>
              </div>
            </div>
          </div>

          <div className="dispatch-hero-actions">
            <div className="status-indicator-strip">
              <span className="strip-label">Trip State:</span>
              <span className={`status-pill pill-${activeTrip.currentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                {activeTrip.currentStatus}
              </span>
            </div>
            <div className="hero-action-buttons">
              <button 
                className="btn-secondary"
                onClick={() => onNavigateTab('live-map')}
              >
                <Navigation size={15} />
                <span>Track on Live GPS Map</span>
              </button>
              {activeTrip.currentStatus === 'In Transit' && (
                <button 
                  className="btn-primary"
                  onClick={() => onOpenPodModal(activeTrip)}
                >
                  <CheckCircle2 size={15} />
                  <span>Verify Buyer Delivery & OTP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Section: Recent Trips & Fleet Telemetry */}
      <div className="dashboard-columns-grid">
        {/* Left Column: Assigned Trips Snapshot */}
        <div className="content-card">
          <div className="content-card-header">
            <div className="header-title-lockup">
              <Truck size={18} className="text-emerald-500" />
              <h3>Today's Logistics Dispatches</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('trips')}>
              <span>View All ({trips.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="trips-mini-list">
            {trips.slice(0, 4).map((trip) => (
              <div key={trip.id} className="trip-mini-card">
                <div className="trip-mini-header">
                  <div className="trip-ref-badge">{trip.deliveryRef}</div>
                  <span className={`status-pill pill-${trip.currentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                    {trip.currentStatus}
                  </span>
                </div>
                <div className="trip-mini-body">
                  <div className="trip-route-summary">
                    <span className="truncate-text">{trip.sourceName}</span>
                    <ArrowRight size={13} className="text-slate-400" />
                    <span className="truncate-text">{trip.destinationName}</span>
                  </div>
                  <div className="trip-details-row">
                    <span>{trip.quantityLitres.toLocaleString('en-IN')} L • {trip.waterCategory}</span>
                    <strong className="text-emerald-600">₹{trip.transportFee?.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Wallet & Payout Received Summary */}
        <div className="content-card">
          <div className="content-card-header">
            <div className="header-title-lockup">
              <Wallet size={18} className="text-teal-500" />
              <h3>Logistics Payout & Wallet</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('payments')}>
              <span>Payment Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="wallet-mini-card">
            <div className="wallet-balances-row">
              <div className="balance-block">
                <span className="bal-label">Available for Withdrawal</span>
                <h2 className="bal-amount">₹{(stats?.availableBalance || 16800).toLocaleString('en-IN')}</h2>
                <span className="bal-sub text-emerald-500">Ready for instant settlement</span>
              </div>
              <div className="balance-block">
                <span className="bal-label">In-Escrow Funds</span>
                <h3 className="bal-amount-secondary">₹{(stats?.escrowBalance || 3950).toLocaleString('en-IN')}</h3>
                <span className="bal-sub">Auto-releases upon Buyer POD</span>
              </div>
            </div>

            <div className="payout-channels-snapshot">
              <span className="channels-title">Configured Payout Methods:</span>
              <div className="channel-pill">
                <Building size={14} />
                <span>HDFC Bank (A/C ...2391)</span>
              </div>
              <div className="channel-pill">
                <Phone size={14} />
                <span>UPI: ecoflow.fleet@okhdfcbank</span>
              </div>
            </div>

            <button className="btn-withdraw-full" onClick={onOpenPayoutModal}>
              <Wallet size={16} />
              <span>Withdraw Payout to Bank / UPI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. DISPATCH & ASSIGNED TRIPS TAB
// ============================================================================
export function DispatchTripsTab({ 
  trips = [], 
  onAdvanceStatus, 
  onOpenPodModal, 
  onNavigateTab 
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTrips = trips.filter(t => {
    if (filter === 'in-transit' && t.currentStatus !== 'In Transit') return false;
    if (filter === 'scheduled' && t.currentStatus !== 'Scheduled' && t.currentStatus !== 'Transporter Assigned') return false;
    if (filter === 'completed' && t.currentStatus !== 'Completed' && t.currentStatus !== 'Delivered') return false;
    if (filter === 'rescue' && !t.isRescue) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchRef = t.deliveryRef.toLowerCase().includes(q);
      const matchSrc = t.sourceName.toLowerCase().includes(q);
      const matchDst = t.destinationName.toLowerCase().includes(q);
      const matchDriver = (t.driverName || '').toLowerCase().includes(q);
      const matchVehicle = (t.vehicleNumber || '').toLowerCase().includes(q);
      if (!matchRef && !matchSrc && !matchDst && !matchDriver && !matchVehicle) return false;
    }
    return true;
  });

  return (
    <div className="transporter-tab-content">
      {/* Filter and search bar */}
      <div className="table-controls-bar">
        <div className="filter-chips">
          <button 
            className={`chip-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Trips ({trips.length})
          </button>
          <button 
            className={`chip-btn ${filter === 'in-transit' ? 'active' : ''}`}
            onClick={() => setFilter('in-transit')}
          >
            In Transit ({trips.filter(t => t.currentStatus === 'In Transit').length})
          </button>
          <button 
            className={`chip-btn ${filter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setFilter('scheduled')}
          >
            Scheduled ({trips.filter(t => t.currentStatus === 'Scheduled' || t.currentStatus === 'Transporter Assigned').length})
          </button>
          <button 
            className={`chip-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({trips.filter(t => t.currentStatus === 'Completed' || t.currentStatus === 'Delivered').length})
          </button>
          <button 
            className={`chip-btn ${filter === 'rescue' ? 'active' : ''}`}
            onClick={() => setFilter('rescue')}
          >
            🚨 ReLoop Rescue ({trips.filter(t => t.isRescue).length})
          </button>
        </div>

        <input 
          type="text" 
          placeholder="Filter by ref, source, buyer or vehicle..." 
          className="table-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Trips Cards Grid */}
      <div className="trips-full-grid">
        {filteredTrips.map((trip) => {
          const isCompleted = trip.currentStatus === 'Completed' || trip.currentStatus === 'Delivered';
          const isInTransit = trip.currentStatus === 'In Transit';

          return (
            <div key={trip.id} className={`trip-card-item ${trip.isRescue ? 'rescue-card' : ''}`}>
              <div className="trip-card-top">
                <div className="trip-badge-group">
                  <span className="trip-code">{trip.deliveryRef}</span>
                  {trip.isRescue && (
                    <span className="rescue-badge-pill">🚨 ReLoop Rescue Haul</span>
                  )}
                </div>
                <span className={`status-pill pill-${trip.currentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                  {trip.currentStatus}
                </span>
              </div>

              {/* Source & Destination Details */}
              <div className="trip-route-box">
                <div className="route-node">
                  <div className="node-marker pickup"></div>
                  <div className="node-content">
                    <span className="node-title">{trip.sourceName}</span>
                    <span className="node-address">{trip.sourceAddress}</span>
                  </div>
                </div>

                <div className="route-node">
                  <div className="node-marker dropoff"></div>
                  <div className="node-content">
                    <span className="node-title">{trip.destinationName}</span>
                    <span className="node-address">{trip.destinationAddress}</span>
                  </div>
                </div>
              </div>

              {/* Trip Metadata Grid */}
              <div className="trip-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Water Cargo</span>
                  <strong className="spec-value">{trip.quantityLitres.toLocaleString('en-IN')} L</strong>
                  <span className="spec-sub">{trip.waterCategory}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Assigned Bowler</span>
                  <strong className="spec-value">{trip.vehicleNumber}</strong>
                  <span className="spec-sub">{trip.driverName}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Distance & Time</span>
                  <strong className="spec-value">{trip.distanceKm} km</strong>
                  <span className="spec-sub">~{trip.estimatedTimeMinutes} mins</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Transport Payout</span>
                  <strong className="spec-value text-emerald-600">
                    ₹{trip.transportFee?.toLocaleString('en-IN')}
                  </strong>
                  <span className="spec-sub">{trip.paymentStatus}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="trip-card-actions">
                <button 
                  className="btn-action-outline"
                  onClick={() => onNavigateTab('live-map')}
                >
                  <Navigation size={14} />
                  <span>Map Telemetry</span>
                </button>

                {trip.currentStatus === 'Scheduled' && (
                  <button 
                    className="btn-action-primary"
                    onClick={() => onAdvanceStatus(trip.id, 'In Transit', 'Driver loaded water and departed supplier dock')}
                  >
                    <Truck size={14} />
                    <span>Start Transit</span>
                  </button>
                )}

                {isInTransit && (
                  <button 
                    className="btn-action-success"
                    onClick={() => onOpenPodModal(trip)}
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirm Delivery (OTP)</span>
                  </button>
                )}

                {isCompleted && (
                  <div className="completed-verified-pill">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>POD Verified & Fee Settled</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 3. LIVE ROUTE & GPS NAVIGATION MAP TAB
// ============================================================================
export function LiveRouteMapTab({ trips = [], onAdvanceTripStatus, onOpenPodModal }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  const activeTrip = trips.find(t => t.currentStatus === 'In Transit') || trips[0] || {
    id: "mat-1792821928402",
    deliveryRef: "DLV-821928",
    sourceName: "Millifont water STP",
    sourceCoordinates: [12.9800, 80.2200],
    destinationName: "Finfee Park Facility",
    destinationCoordinates: [13.0827, 80.2707],
    quantityLitres: 4500,
    vehicleNumber: "TN-09-CV-8841",
    driverName: "Senthil Kumar",
    distanceKm: 5.5,
    transportFee: 1355
  };

  // Simulation progress (0 to 1)
  const [simProgress, setSimProgress] = useState(0.55);
  const [simSpeed, setSimSpeed] = useState(38);
  const [telemetry, setTelemetry] = useState({
    flowMeterCalibrated: true,
    tankerCapacity: 10000,
    tankerLoad: 4500,
    batteryPercent: 88,
    waterTemp: "24.5°C"
  });

  const srcLat = activeTrip.sourceCoordinates?.[0] || 12.9800;
  const srcLng = activeTrip.sourceCoordinates?.[1] || 80.2200;
  const dstLat = activeTrip.destinationCoordinates?.[0] || 13.0827;
  const dstLng = activeTrip.destinationCoordinates?.[1] || 80.2707;

  // Compute simulated position along line
  const curLat = srcLat + (dstLat - srcLat) * simProgress;
  const curLng = srcLng + (dstLng - srcLng) * simProgress;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([curLat, curLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Source Marker
      const srcIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background:#059669;color:#fff;padding:6px;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>`
      });
      L.marker([srcLat, srcLng], { icon: srcIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup Source:</b> ${activeTrip.sourceName}`);

      // Destination Marker
      const dstIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background:#0284c7;color:#fff;padding:6px;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`
      });
      L.marker([dstLat, dstLng], { icon: dstIcon })
        .addTo(map)
        .bindPopup(`<b>Buyer Destination:</b> ${activeTrip.destinationName}`);

      // Route Polyline
      const line = L.polyline([[srcLat, srcLng], [curLat, curLng], [dstLat, dstLng]], {
        color: '#10b981',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);
      polylineRef.current = line;

      // Tanker Marker
      const truckIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background:#0f172a;border:2px solid #38bdf8;color:#38bdf8;padding:6px;border-radius:50%;box-shadow:0 0 14px rgba(56,189,248,0.7);transform:scale(1.2);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="14" height="12" rx="2"/><path d="M15 8h4.5a2 2 0 0 1 1.7 1l1.8 3v4h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg></div>`
      });
      const truckMarker = L.marker([curLat, curLng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`<b>Tanker ${activeTrip.vehicleNumber}</b><br/>Driver: ${activeTrip.driverName}`);
      markerRef.current = truckMarker;

      mapInstanceRef.current = map;
    } else {
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([curLat, curLng]);
      }
    }
  }, [curLat, curLng, srcLat, srcLng, dstLat, dstLng, activeTrip]);

  const handleStepSim = () => {
    setSimProgress(prev => {
      const next = Math.min(1.0, prev + 0.15);
      if (next >= 1.0) {
        setSimSpeed(0);
      }
      return next;
    });
  };

  const handleSimArrive = () => {
    setSimProgress(1.0);
    setSimSpeed(0);
    onOpenPodModal(activeTrip);
  };

  return (
    <div className="transporter-tab-content">
      {/* Map Header with Real-Time Telemetry Bar */}
      <div className="map-telemetry-hud">
        <div className="hud-metric">
          <span className="hud-label">Vehicle</span>
          <strong className="hud-val">{activeTrip.vehicleNumber}</strong>
        </div>
        <div className="hud-metric">
          <span className="hud-label">Speed</span>
          <strong className="hud-val">{simSpeed} km/h</strong>
        </div>
        <div className="hud-metric">
          <span className="hud-label">Route Progress</span>
          <strong className="hud-val text-emerald-400">{Math.round(simProgress * 100)}%</strong>
        </div>
        <div className="hud-metric">
          <span className="hud-label">Cargo Level</span>
          <strong className="hud-val text-cyan-400">{activeTrip.quantityLitres?.toLocaleString('en-IN')} L</strong>
        </div>
        <div className="hud-metric">
          <span className="hud-label">Water Temp</span>
          <strong className="hud-val">{telemetry.waterTemp}</strong>
        </div>
        <div className="hud-metric">
          <span className="hud-label">Flow Meter</span>
          <span className="hud-badge-online">Sealed & Calibrated</span>
        </div>
        <div className="hud-actions">
          <button className="btn-hud-step" onClick={handleStepSim} title="Simulate 15% travel along route">
            <Play size={14} /> Step GPS Forward
          </button>
          <button className="btn-hud-arrive" onClick={handleSimArrive} title="Arrive at buyer dock & open POD">
            <CheckCircle2 size={14} /> Arrive at Destination
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="leaflet-map-wrapper">
        <div ref={mapContainerRef} style={{ width: '100%', height: '520px', borderRadius: '12px' }}></div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. FLEET & TANKERS MANAGEMENT TAB
// ============================================================================
export function FleetManagementTab({ fleet = [], onOpenAddTanker }) {
  return (
    <div className="transporter-tab-content">
      <div className="section-header-row">
        <div>
          <h3>Water Tanker Fleet & Bowlers</h3>
          <p>Inspect tanker hygiene certifications, flow meter calibrations, and driver rosters.</p>
        </div>
        <button className="btn-primary" onClick={onOpenAddTanker}>
          <PlusCircle size={15} />
          <span>Add Tanker Bowler</span>
        </button>
      </div>

      <div className="fleet-cards-grid">
        {fleet.map((vehicle) => (
          <div key={vehicle.id} className="fleet-vehicle-card">
            <div className="fleet-card-header">
              <div className="vehicle-icon-box">
                <Truck size={20} className="text-emerald-500" />
              </div>
              <div>
                <h4 className="vehicle-plate">{vehicle.vehicleNumber}</h4>
                <span className="vehicle-model">{vehicle.model}</span>
              </div>
              <span className={`status-pill pill-${vehicle.status.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                {vehicle.status}
              </span>
            </div>

            <div className="fleet-specs-list">
              <div className="fleet-spec-row">
                <span>Tanker Capacity:</span>
                <strong>{vehicle.capacityLitres.toLocaleString('en-IN')} Litres</strong>
              </div>
              <div className="fleet-spec-row">
                <span>Current Water Load:</span>
                <strong className={vehicle.currentLoad > 0 ? 'text-emerald-500' : 'text-slate-400'}>
                  {vehicle.currentLoad ? `${vehicle.currentLoad.toLocaleString('en-IN')} L (${vehicle.waterCategory})` : 'Empty (Standby)'}
                </strong>
              </div>
              <div className="fleet-spec-row">
                <span>Assigned Driver:</span>
                <strong>{vehicle.driverName} ({vehicle.driverPhone})</strong>
              </div>
              <div className="fleet-spec-row">
                <span>Sanitization Date:</span>
                <span className="text-emerald-600">✓ Cleared {vehicle.lastSanitized}</span>
              </div>
              <div className="fleet-spec-row">
                <span>Digital Flow Meter:</span>
                <span className="text-cyan-600">✓ NABL Calibrated</span>
              </div>
            </div>

            <div className="fleet-card-footer">
              <span className="gps-id">GPS: {vehicle.gpsDeviceId}</span>
              <button className="btn-secondary-sm">
                <span>Service Log</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 5. PROOF OF DELIVERY (POD) TAB
// ============================================================================
export function ProofOfDeliveryTab({ trips = [], onOpenPodModal }) {
  const pendingTrips = trips.filter(t => t.currentStatus === 'In Transit' || t.currentStatus === 'Scheduled');
  const verifiedTrips = trips.filter(t => t.currentStatus === 'Completed' || t.currentStatus === 'Delivered');

  return (
    <div className="transporter-tab-content">
      <div className="pod-hero-info">
        <ShieldCheck size={28} className="text-emerald-500" />
        <div>
          <h4>Cryptographic Water Re-use Proof of Delivery</h4>
          <p>
            Per RELOOP 2.0 architecture, water savings are only registered in the 
            <strong> Water Impact Ledger</strong> when actual physical delivery is confirmed via Buyer OTP and digital flow meter telemetry.
          </p>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3>Pending Verification at Buyer Site</h3>
          <span className="counter-badge">{pendingTrips.length} Ready</span>
        </div>

        <div className="pod-table-wrapper">
          <table className="reloop-data-table">
            <thead>
              <tr>
                <th>Delivery Code</th>
                <th>Destination Buyer</th>
                <th>Cargo Volume</th>
                <th>Vehicle & Driver</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingTrips.map(trip => (
                <tr key={trip.id}>
                  <td><strong>{trip.deliveryRef}</strong></td>
                  <td>{trip.destinationName}</td>
                  <td>{trip.quantityLitres.toLocaleString('en-IN')} L</td>
                  <td>{trip.vehicleNumber} ({trip.driverName})</td>
                  <td>
                    <span className={`status-pill pill-${trip.currentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                      {trip.currentStatus}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-action-primary"
                      onClick={() => onOpenPodModal(trip)}
                    >
                      <CheckCircle2 size={14} />
                      <span>Verify OTP & POD</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-card mt-6">
        <div className="content-card-header">
          <h3>Authoritative Verified Delivery Slips (Impact Confirmed)</h3>
          <span className="counter-badge">{verifiedTrips.length} Confirmed</span>
        </div>

        <div className="pod-table-wrapper">
          <table className="reloop-data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date / Time</th>
                <th>Destination</th>
                <th>Litres Delivered</th>
                <th>Fee Settled</th>
                <th>Verification Receipt</th>
              </tr>
            </thead>
            <tbody>
              {verifiedTrips.map(trip => (
                <tr key={trip.id}>
                  <td><strong>{trip.deliveryRef}</strong></td>
                  <td>{trip.updatedAt ? trip.updatedAt.slice(0, 10) : '2026-10-24'}</td>
                  <td>{trip.destinationName}</td>
                  <td className="text-emerald-600 font-semibold">{trip.quantityLitres.toLocaleString('en-IN')} L</td>
                  <td className="text-teal-600 font-semibold">₹{trip.transportFee?.toLocaleString('en-IN')}</td>
                  <td>
                    <button className="receipt-download-btn" onClick={() => alert(`Official Delivery Certificate ${trip.deliveryRef} generated.\nLitres: ${trip.quantityLitres}L\nFee: ₹${trip.transportFee}\nStatus: Settled.`)}>
                      <Download size={14} />
                      <span>Download POD Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. PAYMENTS RECEIVED & WALLET TAB
// ============================================================================
export function TransporterPaymentsTab({ 
  wallet, 
  payoutAccounts, 
  payouts = [], 
  onOpenPayoutModal 
}) {
  const availableBal = wallet?.availableBalance ?? 16800;
  const escrowBal = wallet?.escrowBalance ?? 3950;
  const totalEarned = wallet?.totalEarned ?? 52400;

  return (
    <div className="transporter-tab-content">
      {/* Wallet Balance Hero Banner */}
      <div className="payments-hero-card">
        <div className="hero-balance-left">
          <span className="balance-subtitle">AVAILABLE FOR WITHDRAWAL</span>
          <h1 className="balance-main-val">₹{availableBal.toLocaleString('en-IN')}</h1>
          <div className="balance-escrow-row">
            <span className="escrow-pill">
              🔒 In Escrow: ₹{escrowBal.toLocaleString('en-IN')}
            </span>
            <span className="escrow-hint">Auto-released as drivers complete Buyer OTP verification</span>
          </div>
        </div>

        <div className="hero-balance-right">
          <div className="metric-box">
            <span className="metric-lbl">Lifetime Haul Fees Earned</span>
            <strong className="metric-num">₹{totalEarned.toLocaleString('en-IN')}</strong>
          </div>
          <button className="btn-withdraw-hero" onClick={onOpenPayoutModal}>
            <Wallet size={18} />
            <span>Request Payout / Withdraw Funds</span>
          </button>
        </div>
      </div>

      {/* Payment Received Methods Card */}
      <div className="payment-methods-card">
        <div className="methods-card-header">
          <Building size={20} className="text-emerald-500" />
          <div>
            <h4>Configured Payment Received Methods</h4>
            <p>Your transport earnings are automatically cleared and deposited through these verified channels.</p>
          </div>
        </div>

        <div className="methods-grid">
          {/* Bank Transfer Method */}
          <div className="method-box active">
            <div className="method-box-header">
              <span className="method-type">Direct Bank Transfer (NEFT / RTGS)</span>
              <span className="primary-pill">Primary</span>
            </div>
            <div className="method-box-body">
              <strong>{payoutAccounts?.bank?.accountHolder || "EcoFlow Water Tanker Services Pvt. Ltd."}</strong>
              <p>Bank: {payoutAccounts?.bank?.bankName || "HDFC Bank Ltd."}</p>
              <p>Account No: {payoutAccounts?.bank?.accountNumber || "50200049182391"}</p>
              <p>IFSC: {payoutAccounts?.bank?.ifscCode || "HDFC0001224"}</p>
            </div>
            <div className="method-box-footer">
              <span className="status-ok">✓ Instant Corporate NEFT Clearing</span>
            </div>
          </div>

          {/* UPI Method */}
          <div className="method-box active">
            <div className="method-box-header">
              <span className="method-type">Instant UPI VPA</span>
              <span className="instant-pill">Instant</span>
            </div>
            <div className="method-box-body">
              <strong>VPA Address:</strong>
              <p className="upi-text">{payoutAccounts?.upi?.upiId || "ecoflow.fleet@okhdfcbank"}</p>
              <p>Service: {payoutAccounts?.upi?.provider || "HDFC Bank / Google Pay"}</p>
            </div>
            <div className="method-box-footer">
              <span className="status-ok">✓ Zero Fee 24/7 Real-Time Settlement</span>
            </div>
          </div>

          {/* Automated Escrow Method */}
          <div className="method-box active">
            <div className="method-box-header">
              <span className="method-type">ReLoop Trust Escrow</span>
              <span className="escrow-badge">Automated</span>
            </div>
            <div className="method-box-body">
              <strong>Smart Contract Milestone:</strong>
              <p>Funds locked when buyer confirms match</p>
              <p>Disbursed immediately upon delivery OTP match</p>
            </div>
            <div className="method-box-footer">
              <span className="status-ok">✓ 100% Guaranteed Payment Gate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Payouts & Transaction Ledger */}
      <div className="content-card mt-6">
        <div className="content-card-header">
          <div>
            <h3>Transport Fees Received & Payout Ledger</h3>
            <p className="text-slate-500 text-sm">Full transaction audit trail with fee breakdowns and UTR reference codes.</p>
          </div>
        </div>

        <div className="pod-table-wrapper">
          <table className="reloop-data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date / Time</th>
                <th>Trip Reference</th>
                <th>Delivery Route</th>
                <th>Volume Hauled</th>
                <th>Total Fee</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((pay) => (
                <tr key={pay.id}>
                  <td><strong>{pay.id}</strong></td>
                  <td>{pay.date}</td>
                  <td>{pay.tripRef}</td>
                  <td>
                    <span className="truncate-text">{pay.sourceName}</span>
                    <ArrowRight size={11} style={{ display: 'inline', margin: '0 4px' }} />
                    <span className="truncate-text">{pay.destinationName}</span>
                  </td>
                  <td>{pay.quantityLitres ? `${pay.quantityLitres.toLocaleString('en-IN')} L` : '—'}</td>
                  <td className="text-emerald-600 font-bold">₹{pay.totalFee?.toLocaleString('en-IN')}</td>
                  <td>
                    <span className="channel-tag">{pay.method}</span>
                    <span className="text-xs text-slate-500 block">{pay.referenceNumber}</span>
                  </td>
                  <td>
                    <span className="status-pill pill-settled">
                      {pay.status || 'Settled'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="receipt-download-btn"
                      onClick={() => alert(`Official Logistics Remittance Receipt\nID: ${pay.id}\nAmount: ₹${pay.totalFee}\nMethod: ${pay.method}\nReference: ${pay.referenceNumber}\nStatus: Settled.`)}
                    >
                      <Download size={13} />
                      <span>Voucher</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. RELOOP RESCUE LOGISTICS TAB
// ============================================================================
export function RescueLogisticsTab({ trips = [], onAdvanceStatus, onOpenPodModal }) {
  const rescueTrips = trips.filter(t => t.isRescue);

  return (
    <div className="transporter-tab-content">
      <div className="rescue-banner-header">
        <div className="rescue-badge-big">🚨 ReLoop Rescue Dispatch Center</div>
        <h2>Emergency Water Re-routing & Rapid Fulfillment</h2>
        <p>
          When primary suppliers experience mechanical breakdowns or fail laboratory quality checks, 
          the <strong>ReLoop Rescue</strong> engine swaps the water source and dispatches your standby tankers 
          with a <strong>+15% expedited incentive surcharge</strong>.
        </p>
      </div>

      <div className="trips-full-grid">
        {rescueTrips.length === 0 ? (
          <div className="empty-state-card">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <h4>All Regional Water Supply Corridors Operating Normally</h4>
            <p>No emergency supply disruptions detected. Standby bowlers remain ready for instant deployment.</p>
          </div>
        ) : (
          rescueTrips.map(trip => (
            <div key={trip.id} className="trip-card-item rescue-card">
              <div className="trip-card-top">
                <span className="rescue-badge-pill">🚨 EMERGENCY RESCUE DISPATCH</span>
                <span className={`status-pill pill-${trip.currentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                  {trip.currentStatus}
                </span>
              </div>

              <div className="rescue-reason-box">
                <strong>Disruption Root Cause:</strong> {trip.rescueReason || "Primary supplier offline; automated ReLoop Rescue initiated"}
              </div>

              <div className="trip-route-box">
                <div className="route-node">
                  <div className="node-marker pickup"></div>
                  <div className="node-content">
                    <span className="node-title">{trip.sourceName} (Rescue Alternative)</span>
                    <span className="node-address">{trip.sourceAddress}</span>
                  </div>
                </div>
                <div className="route-node">
                  <div className="node-marker dropoff"></div>
                  <div className="node-content">
                    <span className="node-title">{trip.destinationName}</span>
                    <span className="node-address">{trip.destinationAddress}</span>
                  </div>
                </div>
              </div>

              <div className="trip-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Rescue Cargo</span>
                  <strong className="spec-value">{trip.quantityLitres.toLocaleString('en-IN')} L</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Vehicle</span>
                  <strong className="spec-value">{trip.vehicleNumber}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Expedited Payout</span>
                  <strong className="spec-value text-emerald-600 font-bold">
                    ₹{trip.transportFee?.toLocaleString('en-IN')} (+15% surge)
                  </strong>
                </div>
              </div>

              <div className="trip-card-actions">
                {trip.currentStatus === 'Scheduled' && (
                  <button 
                    className="btn-action-primary"
                    onClick={() => onAdvanceStatus(trip.id, 'In Transit', 'Emergency rescue tanker dispatched')}
                  >
                    <Truck size={14} />
                    <span>Dispatch Rescue Bowler</span>
                  </button>
                )}
                {trip.currentStatus === 'In Transit' && (
                  <button 
                    className="btn-action-success"
                    onClick={() => onOpenPodModal(trip)}
                  >
                    <CheckCircle2 size={14} />
                    <span>Verify Rescue POD</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 8. TRANSPORTER SETTINGS TAB
// ============================================================================
export function TransporterSettingsTab({ profile, onSaveSettings }) {
  const [phone, setPhone] = useState(profile?.phone || "+91 98777 66554");
  const [serviceZone, setServiceZone] = useState(profile?.serviceZone || "Greater Chennai & OMR Corridor");
  const [bankAccount, setBankAccount] = useState(profile?.payoutAccounts?.bank?.accountNumber || "50200049182391");
  const [bankIfsc, setBankIfsc] = useState(profile?.payoutAccounts?.bank?.ifscCode || "HDFC0001224");
  const [upiId, setUpiId] = useState(profile?.payoutAccounts?.upi?.upiId || "ecoflow.fleet@okhdfcbank");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      phone,
      serviceZone,
      payoutAccounts: {
        bank: {
          accountHolder: profile?.organization || "EcoFlow Water Tanker Services Pvt. Ltd.",
          accountNumber: bankAccount,
          bankName: "HDFC Bank Ltd.",
          ifscCode: bankIfsc,
          branch: "OMR Sholinganallur, Chennai",
          accountType: "Current"
        },
        upi: {
          upiId,
          provider: "HDFC / Google Pay"
        }
      }
    });
  };

  return (
    <div className="transporter-tab-content">
      <div className="content-card max-w-3xl">
        <div className="content-card-header">
          <h3>Logistics Fleet Profile & Payout Settings</h3>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label>Logistics Organization Name</label>
            <input type="text" value={profile?.organization || "EcoFlow Water Tanker Services Pvt. Ltd."} disabled />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Fleet Dispatch Hotline Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Authorized Operating Zone</label>
              <input type="text" value={serviceZone} onChange={(e) => setServiceZone(e.target.value)} />
            </div>
          </div>

          <h4 className="settings-section-divider">Configured Payout Accounts (Where You Receive Money)</h4>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Bank Account Number</label>
              <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Bank IFSC Code</label>
              <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Instant Payout UPI ID (VPA)</label>
            <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary mt-4">
            <CheckCircle2 size={16} />
            <span>Save Transporter Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
}

