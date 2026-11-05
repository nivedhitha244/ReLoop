// src/components/rescue/RescueDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  Droplets,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  Info,
  Check,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { buyerApi } from '../../services/buyerApi';
import './RescueDashboard.css';

export default function RescueDashboard({ onOpenRescueModal }) {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(6);

  // Data states
  const [overview, setOverview] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [demands, setDemands] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('CONTAMINATION_TURBIDITY');
  const [selectedDemandId, setSelectedDemandId] = useState('');
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [activeIncidentData, setActiveIncidentData] = useState(null);
  const [inspectedCandidate, setInspectedCandidate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapLayersRef = useRef([]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load initial rescue overview & scenarios
  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [ovData, scData, dmData] = await Promise.all([
        buyerApi.getRescueOverview(),
        buyerApi.getRescueScenarios(),
        buyerApi.getDemands()
      ]);
      setOverview(ovData);
      setScenarios(scData);
      setDemands(dmData || []);

      if (dmData && dmData.length > 0) {
        setSelectedDemandId(dmData[0].id);
      }
      if (ovData.activeIncident) {
        setActiveIncidentData(ovData.activeIncident);
      }
    } catch (err) {
      console.error('Error loading rescue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Run Simulation
  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      setActiveStageIndex(1);

      // Staged visual delay for realistic AI analysis
      setTimeout(() => setActiveStageIndex(2), 600);
      setTimeout(() => setActiveStageIndex(3), 1200);
      setTimeout(() => setActiveStageIndex(4), 1800);
      setTimeout(() => setActiveStageIndex(5), 2400);

      const result = await buyerApi.simulateRescue({
        scenarioId: selectedScenarioId,
        demandId: selectedDemandId || undefined,
        searchRadiusKm: Number(searchRadiusKm),
        isSimulated: true
      });

      setTimeout(() => {
        setActiveStageIndex(6);
        setActiveIncidentData(result);
        setSimulating(false);
        showToast(`Simulation completed: ${result.outcome.replace('_', ' ')} detected!`);
        fetchOverviewData();
      }, 3000);
    } catch (err) {
      console.error('Simulation failed:', err);
      showToast(err.message || 'Simulation execution failed', 'error');
      setSimulating(false);
    }
  };

  // Resolve / Dispatch Rescue
  const handleResolveRescue = async () => {
    if (!activeIncidentData || !activeIncidentData.incident) return;
    try {
      setResolving(true);
      const res = await buyerApi.resolveRescue(activeIncidentData.incident.incidentId);
      showToast(res.message || 'Tanker dispatched successfully!');
      await fetchOverviewData();
      setActiveIncidentData(null);
    } catch (err) {
      showToast(err.message || 'Failed to dispatch rescue', 'error');
    } finally {
      setResolving(false);
    }
  };

  // Reset Simulation to Baseline
  const handleResetRescue = async () => {
    try {
      await buyerApi.resetRescue();
      setActiveIncidentData(null);
      setActiveStageIndex(0);
      showToast('Rescue system returned to normal standby monitor.');
      await fetchOverviewData();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // ==========================================================================
  // Leaflet Map Initialization and Layer Synchronization
  // ==========================================================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.0450, 80.2350],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous dynamic layers
    mapLayersRef.current.forEach(layer => map.removeLayer(layer));
    mapLayersRef.current = [];

    const bounds = [];

    // Buyer location
    const buyerCoords = activeIncidentData?.incident?.affectedBuyer?.coordinates || [13.0827, 80.2707];
    bounds.push(buyerCoords);

    // Draw search radius circle around buyer
    const radiusMeters = Number(searchRadiusKm) * 1000;
    const radiusCircle = L.circle(buyerCoords, {
      radius: radiusMeters,
      color: '#0d9488',
      fillColor: '#0d9488',
      fillOpacity: 0.07,
      weight: 1.5,
      dashArray: '6, 6'
    }).addTo(map);
    mapLayersRef.current.push(radiusCircle);

    // Buyer Marker
    const buyerIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `<div style="background:#0284c7; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(2,132,199,0.5); border:2px solid #fff;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });
    const buyerMarker = L.marker(buyerCoords, { icon: buyerIcon })
      .bindPopup(`<strong>${activeIncidentData?.incident?.affectedBuyer?.title || 'Green Park Demand'}</strong><br/>Application: ${activeIncidentData?.incident?.affectedBuyer?.purpose || 'Irrigation'}`)
      .addTo(map);
    mapLayersRef.current.push(buyerMarker);

    // If an incident is active
    if (activeIncidentData) {
      // 1. Failed Supplier Marker
      const failed = activeIncidentData.incident.affectedSupplier;
      if (failed && failed.coordinates) {
        bounds.push(failed.coordinates);
        const failedIcon = L.divIcon({
          className: 'custom-leaflet-pin',
          html: `<div style="background:#e11d48; color:#fff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 6px rgba(225,29,72,0.3); border:2px solid #fff;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        });
        const failedMarker = L.marker(failed.coordinates, { icon: failedIcon })
          .bindPopup(`<strong>DISRUPTED: ${failed.name}</strong><br/>${activeIncidentData.incident.failureType}`)
          .addTo(map);
        mapLayersRef.current.push(failedMarker);

        // Broken route line
        const brokenRoute = L.polyline([failed.coordinates, buyerCoords], {
          color: '#e11d48',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.7
        }).addTo(map);
        mapLayersRef.current.push(brokenRoute);
      }

      // 2. Evaluated Candidate Suppliers
      (activeIncidentData.evaluatedCandidates || []).forEach(cand => {
        if (!cand.coordinates) return;
        const isWinner = activeIncidentData.winningAlternative?.sourceId === cand.sourceId;
        bounds.push(cand.coordinates);

        if (isWinner) {
          // Winning Backup Marker
          const winIcon = L.divIcon({
            className: 'custom-leaflet-pin',
            html: `<div style="background:#10b981; color:#fff; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 8px rgba(16,185,129,0.35); border:2px solid #fff;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 38]
          });
          const winMarker = L.marker(cand.coordinates, { icon: winIcon })
            .bindPopup(`<strong>SELECTED BACKUP: ${cand.sourceName}</strong><br/>Score: ${cand.score}/100<br/>Distance: ${cand.distanceKm} km<br/>Available: ${cand.availableQuantity.toLocaleString()} L`)
            .addTo(map);
          mapLayersRef.current.push(winMarker);

          // Rescue Corridor Polyline
          const rescueCorridor = L.polyline([cand.coordinates, buyerCoords], {
            color: '#10b981',
            weight: 5,
            opacity: 0.9
          }).addTo(map);
          mapLayersRef.current.push(rescueCorridor);
        } else {
          // Inactive / Disqualified Candidate Marker
          const grayIcon = L.divIcon({
            className: 'custom-leaflet-pin',
            html: `<div style="background:#94a3b8; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28]
          });
          const candidateMarker = L.marker(cand.coordinates, { icon: grayIcon })
            .bindPopup(`<strong>${cand.sourceName}</strong><br/>Safe Reuse Gate: ${cand.eligible ? 'Passed' : 'REJECTED'}<br/>${cand.exclusionReason || 'Standby reserve'}`)
            .addTo(map);
          mapLayersRef.current.push(candidateMarker);
        }
      });
    }

    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        // Fallback
      }
    }
  }, [activeIncidentData, searchRadiusKm]);

  const stats = overview?.stats || {
    totalIncidents: 4,
    rescuedLitres: 16000,
    recoveriesCount: 4,
    activeStandbyNodesCount: 3,
    avgResponseSeconds: 3.4
  };

  return (
    <div className="rescue-dashboard-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toastMessage.type === 'error' ? '#ef4444' : '#059669',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 600
        }}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <div className="rescue-hero-banner">
        <div className="rescue-hero-top">
          <div className="rescue-badge-tag">
            <span className="rescue-live-pulse"></span>
            ReLoop Rescue™ Continuous Supply Shield
          </div>
          <span style={{ fontSize: '13px', color: '#ccfbf1', fontWeight: 600 }}>
            Autonomous Water Resiliency Protocol · Safe Reuse Gate Enforced
          </span>
        </div>
        <h1 className="rescue-hero-title">Continuous Industrial Water Supply Shield</h1>
        <p className="rescue-hero-desc">
          Disruptions happen. When an active water supplier experiences contamination alerts, sudden yield reductions,
          or transport breakdowns, ReLoop Rescue automatically detects the anomaly, audits verified backups within
          a {searchRadiusKm} km radius, enforces Safe Reuse Gate compliance, and reroutes supply without operational stoppage.
        </p>
      </div>

      {/* 2. KPI OVERVIEW CARDS */}
      <div className="rescue-kpi-grid">
        <div className="rescue-kpi-card">
          <div className="rescue-kpi-icon icon-emerald">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="rescue-kpi-val">{stats.recoveriesCount}</div>
            <div className="rescue-kpi-lbl">Successful Recoveries</div>
          </div>
        </div>

        <div className="rescue-kpi-card">
          <div className="rescue-kpi-icon icon-teal">
            <Droplets size={26} />
          </div>
          <div>
            <div className="rescue-kpi-val">{(stats.rescuedLitres || 0).toLocaleString()} L</div>
            <div className="rescue-kpi-lbl">Water Volume Rescued</div>
          </div>
        </div>

        <div className="rescue-kpi-card">
          <div className="rescue-kpi-icon icon-blue">
            <Layers size={26} />
          </div>
          <div>
            <div className="rescue-kpi-val">{stats.activeStandbyNodesCount || 3} Nodes</div>
            <div className="rescue-kpi-lbl">Active Standby Nodes</div>
          </div>
        </div>

        <div className="rescue-kpi-card">
          <div className="rescue-kpi-icon icon-amber">
            <Zap size={26} />
          </div>
          <div>
            <div className="rescue-kpi-val">{stats.avgResponseSeconds || 3.4}s</div>
            <div className="rescue-kpi-lbl">Avg. Failover Speed</div>
          </div>
        </div>
      </div>

      {/* 3. SIMULATION CONTROL CONSOLE */}
      <div className="rescue-control-card">
        <div className="rescue-card-header">
          <div className="rescue-card-title-wrap">
            <Activity size={22} className="text-teal-600" />
            <div>
              <h3 className="rescue-card-title">Live Disruption Simulation Console</h3>
              <p className="rescue-card-subtitle">
                Select a failure scenario and configure geographic search radius to trigger intelligent failover.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
            Strictly connects to platform inventory & Safe Reuse Gate
          </span>
        </div>

        <div className="control-inputs-grid">
          {/* Scenario Selector */}
          <div className="control-field">
            <label htmlFor="select-scenario">Disruption Scenario / Anomaly:</label>
            <select
              id="select-scenario"
              className="control-select"
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              disabled={simulating}
            >
              {scenarios.map(sc => (
                <option key={sc.id} value={sc.id}>
                  [{sc.category}] {sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Demand Selector */}
          <div className="control-field">
            <label htmlFor="select-demand">Target Buyer Demand:</label>
            <select
              id="select-demand"
              className="control-select"
              value={selectedDemandId}
              onChange={(e) => setSelectedDemandId(e.target.value)}
              disabled={simulating}
            >
              {demands.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} ({(d.requiredQuantity || d.quantity || 4000).toLocaleString()} L · {d.purpose || 'Irrigation'})
                </option>
              ))}
            </select>
          </div>

          {/* Search Radius Slider */}
          <div className="control-field">
            <label htmlFor="range-radius">
              <span>Configurable Search Radius:</span>
              <span className="radius-badge">{searchRadiusKm} km</span>
            </label>
            <div className="range-slider-wrap">
              <input
                id="range-radius"
                type="range"
                min="5"
                max="25"
                step="1"
                className="range-slider"
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                disabled={simulating}
              />
            </div>
          </div>
        </div>

        <div className="control-actions-row">
          {activeIncidentData && (
            <button
              type="button"
              className="btn-reset-standby"
              onClick={handleResetRescue}
              disabled={simulating || resolving}
            >
              <RotateCcw size={16} />
              Reset System to Standby
            </button>
          )}

          <button
            type="button"
            className="btn-simulate-launch"
            onClick={handleRunSimulation}
            disabled={simulating || resolving}
          >
            {simulating ? (
              <>
                <span className="pulse-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                Executing AI Spatial Failover...
              </>
            ) : (
              <>
                <Zap size={18} />
                Run Live Rescue Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. PROGRESSIVE WORKFLOW TRACKER (6 STAGES) */}
      <div className="rescue-workflow-card">
        <div className="rescue-card-title-wrap">
          <Layers size={20} className="text-emerald-600" />
          <h3 className="rescue-card-title">Autonomous Rescue Workflow Stages</h3>
        </div>

        <div className="workflow-steps-horizontal">
          <div className={`workflow-step-node ${activeStageIndex >= 1 ? 'completed' : ''} ${activeStageIndex === 1 ? 'active' : ''}`}>
            <div className="step-node-header">
              <div className="step-circle">{activeStageIndex > 1 ? <Check size={14} /> : '1'}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>STAGE 1</span>
            </div>
            <h4 className="step-name">Disruption Detected</h4>
            <p className="step-desc">IoT sensor audit flags purity drop or mechanical outage.</p>
          </div>

          <div className={`workflow-step-node ${activeStageIndex >= 2 ? 'completed' : ''} ${activeStageIndex === 2 ? 'active' : ''}`}>
            <div className="step-node-header">
              <div className="step-circle">{activeStageIndex > 2 ? <Check size={14} /> : '2'}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>STAGE 2</span>
            </div>
            <h4 className="step-name">Spatial Scan</h4>
            <p className="step-desc">Searches regional nodes within {searchRadiusKm} km radius.</p>
          </div>

          <div className={`workflow-step-node ${activeStageIndex >= 3 ? 'completed' : ''} ${activeStageIndex === 3 ? 'active' : ''}`}>
            <div className="step-node-header">
              <div className="step-circle">{activeStageIndex > 3 ? <Check size={14} /> : '3'}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>STAGE 3</span>
            </div>
            <h4 className="step-name">Safe Reuse Gate</h4>
            <p className="step-desc">CPCB criteria & NABL lab report validation.</p>
          </div>

          <div className={`workflow-step-node ${activeStageIndex >= 4 ? 'completed' : ''} ${activeStageIndex === 4 ? 'active' : ''}`}>
            <div className="step-node-header">
              <div className="step-circle">{activeStageIndex > 4 ? <Check size={14} /> : '4'}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>STAGE 4</span>
            </div>
            <h4 className="step-name">Multi-Criteria Rank</h4>
            <p className="step-desc">Weighted scoring: Quality, Volume, Proximity, Cost, EDT.</p>
          </div>

          <div className={`workflow-step-node ${activeStageIndex >= 5 ? 'completed' : ''} ${activeStageIndex === 5 ? 'active' : ''}`}>
            <div className="step-node-header">
              <div className="step-circle">{activeStageIndex > 5 ? <Check size={14} /> : '5'}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>STAGE 5</span>
            </div>
            <h4 className="step-name">Backup Selection</h4>
            <p className="step-desc">Locks verified winner with optimal continuity score.</p>
          </div>

          <div className={`workflow-step-node ${activeStageIndex >= 6 ? 'completed' : ''} ${activeStageIndex === 6 ? 'active' : ''}`}>
            <div className="step-node-header">
              <div className="step-circle">{activeStageIndex >= 6 ? <Check size={14} /> : '6'}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>STAGE 6</span>
            </div>
            <h4 className="step-name">Route Reassigned</h4>
            <p className="step-desc">Dispatches tanker waybill and dynamically updates corridor.</p>
          </div>
        </div>
      </div>

      {/* 5. ACTIVE INCIDENT MONITORING & SENSOR TELEMETRY */}
      {activeIncidentData && (
        <div className="active-incident-card">
          <div className="incident-header-banner">
            <div className="incident-title-left">
              <span className={activeIncidentData.incident.severity === 'Critical' ? 'severity-pill-critical' : 'severity-pill-high'}>
                {activeIncidentData.incident.severity} SEVERITY
              </span>
              <strong style={{ fontSize: '16px', color: '#881337' }}>
                Incident #{activeIncidentData.incident.incidentId}: {activeIncidentData.incident.failureType}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="incident-sim-badge">
                <Sparkles size={13} />
                {activeIncidentData.incident.isSimulated ? 'SIMULATED IOT TELEMETRY' : 'LIVE TELEMETRY'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Detected: {new Date(activeIncidentData.incident.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="incident-body-grid">
            {/* Left: Entity Impact Details */}
            <div className="incident-info-box">
              <div className="incident-box-title">
                <AlertTriangle size={15} className="text-rose-600" />
                Affected Water Nodes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Failed Supplier: </span>
                  <strong>{activeIncidentData.incident.affectedSupplier.name}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}> ({activeIncidentData.incident.affectedSupplier.type})</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Affected Buyer: </span>
                  <strong>{activeIncidentData.incident.affectedBuyer.title}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Required Volume: </span>
                  <strong style={{ color: '#0f766e' }}>
                    {activeIncidentData.incident.affectedBuyer.requiredQuantity.toLocaleString()} Litres
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Intended Application: </span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '12px' }}>
                    {activeIncidentData.incident.affectedBuyer.purpose}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Sensor Diagnostic Telemetry */}
            <div className="incident-telemetry-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                <span className="telemetry-tag">PROBE DIAGNOSTIC TELEMETRY</span>
                <span style={{ color: '#94a3b8' }}>{activeIncidentData.incident.sensorSource}</span>
              </div>
              <div>&gt; Monitored Parameter: <strong>{activeIncidentData.incident.sensorMetric}</strong></div>
              <div>&gt; Observed Sensor Value: <span className="telemetry-alert">{activeIncidentData.incident.sensorValue}</span></div>
              <div>&gt; Safe Regulatory Envelope: <span>{activeIncidentData.incident.safeThreshold}</span></div>
              <div style={{ marginTop: '8px', color: '#93c5fd' }}>
                &gt; Action: {activeIncidentData.incident.actionRequired}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. OUTCOME BANNER */}
      {activeIncidentData && (
        <div className={`rescue-outcome-banner ${
          activeIncidentData.outcome === 'AUTOMATIC_RECOVERY' ? 'outcome-automatic' :
          activeIncidentData.outcome === 'PARTIAL_RECOVERY' ? 'outcome-partial' : 'outcome-emergency'
        }`}>
          <div className="outcome-left">
            <div className="outcome-icon-wrap">
              {activeIncidentData.outcome === 'AUTOMATIC_RECOVERY' && <ShieldCheck size={28} />}
              {activeIncidentData.outcome === 'PARTIAL_RECOVERY' && <AlertTriangle size={28} />}
              {activeIncidentData.outcome === 'EMERGENCY_ALERT' && <XCircle size={28} />}
            </div>
            <div>
              <h4 className="outcome-title">
                {activeIncidentData.outcome === 'AUTOMATIC_RECOVERY' && 'Autonomous Supply Recovery Engaged!'}
                {activeIncidentData.outcome === 'PARTIAL_RECOVERY' && 'Partial Continuity Recovery Plan Generated'}
                {activeIncidentData.outcome === 'EMERGENCY_ALERT' && 'Emergency Continuity Alert: Zero Safe Alternatives'}
              </h4>
              <p className="outcome-desc">
                {activeIncidentData.outcome === 'AUTOMATIC_RECOVERY' && (
                  <>
                    Safe Reuse Gate verified <strong>{activeIncidentData.winningAlternative?.sourceName}</strong> as optimal backup node
                    ({activeIncidentData.winningAlternative?.score}/100 score, {activeIncidentData.winningAlternative?.distanceKm} km, {activeIncidentData.winningAlternative?.estimatedDeliveryMins} mins EDT).
                    Full 100% volume satisfied.
                  </>
                )}
                {activeIncidentData.outcome === 'PARTIAL_RECOVERY' && (
                  <>
                    Nearest safe supplier provides {activeIncidentData.winningAlternative?.fulfillmentPercentage}% of required volume.
                    Multi-source combination plan prepared to bridge remaining deficit safely.
                  </>
                )}
                {activeIncidentData.outcome === 'EMERGENCY_ALERT' && (
                  <>
                    All {activeIncidentData.evaluatedCandidates?.length || 0} local suppliers within {searchRadiusKm} km failed Safe Reuse Gate criteria
                    or lacked required inventory. Incident escalated to State Water Authority.
                  </>
                )}
              </p>
            </div>
          </div>

          {activeIncidentData.winningAlternative && (
            <button
              type="button"
              className="btn-confirm-dispatch"
              onClick={handleResolveRescue}
              disabled={resolving}
            >
              {resolving ? (
                <>Mobilizing Fleet...</>
              ) : (
                <>
                  <Truck size={18} />
                  Confirm & Dispatch Tanker Reroute
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 7. SPATIAL INTELLIGENCE MAP */}
      <div className="rescue-map-card">
        <div className="map-card-head">
          <div className="rescue-card-title-wrap">
            <MapPin size={20} className="text-teal-600" />
            <h3 className="rescue-card-title">Spatial Intelligence & Dynamic Rerouting</h3>
          </div>

          <div className="map-legend-items">
            <div className="legend-badge-item">
              <span className="legend-dot dot-disrupted"></span>
              <span>Disrupted Supplier</span>
            </div>
            <div className="legend-badge-item">
              <span className="legend-dot dot-backup"></span>
              <span>Winning Backup Node</span>
            </div>
            <div className="legend-badge-item">
              <span className="legend-dot dot-rejected"></span>
              <span>Rejected / Disqualified</span>
            </div>
            <div className="legend-badge-item">
              <span className="legend-dot dot-buyer"></span>
              <span>Buyer Destination</span>
            </div>
          </div>
        </div>

        <div ref={mapContainerRef} className="leaflet-rescue-embed"></div>
      </div>

      {/* 8. BACKUP SUPPLIER COMPARISON TABLE */}
      {activeIncidentData && (
        <div className="rescue-comparison-card">
          <div className="rescue-card-header" style={{ padding: '20px 24px 16px' }}>
            <div className="rescue-card-title-wrap">
              <FileCheck2 size={22} className="text-teal-600" />
              <div>
                <h3 className="rescue-card-title">Evaluated Candidate Suppliers & Multi-Criteria Ranking</h3>
                <p className="rescue-card-subtitle">
                  Safe Reuse Gate checks each candidate against CPCB reuse compatibility, lab accreditation, distance, and fleet logistics.
                </p>
              </div>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Candidate Supplier</th>
                  <th>Safe Reuse Gate</th>
                  <th>Proximity</th>
                  <th>Available Volume</th>
                  <th>Est. Delivery</th>
                  <th>Transport Cost</th>
                  <th>Ranking Score</th>
                  <th>Selection / Rejection Rationale</th>
                </tr>
              </thead>
              <tbody>
                {(activeIncidentData.evaluatedCandidates || []).map((cand) => {
                  const isWinner = activeIncidentData.winningAlternative?.sourceId === cand.sourceId;
                  return (
                    <tr key={cand.sourceId} className={isWinner ? 'winning-row' : ''}>
                      <td>
                        <strong>{cand.sourceName}</strong>
                        {isWinner && (
                          <span className="winner-badge">
                            <Check size={11} strokeWidth={3} /> WINNER
                          </span>
                        )}
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{cand.waterCategory}</div>
                      </td>

                      <td>
                        {cand.safeGate?.passed ? (
                          <span className="badge-gate-pass">
                            <CheckCircle2 size={13} /> PASSED
                          </span>
                        ) : (
                          <span className="badge-gate-reject">
                            <XCircle size={13} /> REJECTED
                          </span>
                        )}
                      </td>

                      <td>
                        <strong>{cand.distanceKm} km</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {cand.distanceKm <= searchRadiusKm ? 'Within Radius' : 'Out of Radius'}
                        </div>
                      </td>

                      <td>
                        <strong>{cand.availableQuantity.toLocaleString()} L</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {cand.fulfillmentPercentage}% coverage
                        </div>
                      </td>

                      <td>
                        <strong>{cand.estimatedDeliveryMins} mins</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Depot + Transit</div>
                      </td>

                      <td>
                        <strong>₹{cand.transportCost.toLocaleString()}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Fleet transit</div>
                      </td>

                      <td>
                        <div className="score-pill-container">
                          <span className={`score-badge ${cand.score >= 80 ? 'score-high' : cand.score >= 50 ? 'score-medium' : 'score-low'}`}>
                            {cand.score}/100
                          </span>
                        </div>
                      </td>

                      <td style={{ maxWidth: 360, fontSize: '12.5px', lineHeight: 1.45 }}>
                        {cand.eligible ? (
                          <span style={{ color: '#065f46' }}>
                            {cand.reasons ? cand.reasons.join(' ') : 'Safe Reuse Gate passed. Optimum composite ranking.'}
                          </span>
                        ) : (
                          <span style={{ color: '#991b1b' }}>
                            {cand.exclusionReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. RECENT RESCUE HISTORY & IMPACT LOG */}
      <div className="rescue-control-card">
        <div className="rescue-card-header">
          <div className="rescue-card-title-wrap">
            <Clock size={20} className="text-teal-600" />
            <h3 className="rescue-card-title">Continuous Supply Shield Audit History</h3>
          </div>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Logged securely to persistent audit store
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(overview?.history || []).slice(0, 5).map((rec, idx) => (
            <div
              key={rec.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: rec.outcome === 'AUTOMATIC_RECOVERY' ? '#dcfce7' : '#fee2e2',
                  color: rec.outcome === 'AUTOMATIC_RECOVERY' ? '#166534' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {rec.outcome === 'AUTOMATIC_RECOVERY' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div>
                  <strong>{rec.failureType}</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Disrupted: {rec.affectedSupplier} → Rescued By: <strong>{rec.winningSupplier}</strong> ({rec.rescuedVolume?.toLocaleString() || 0} L)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: rec.isSimulated ? '#ede9fe' : '#e0f2fe',
                  color: rec.isSimulated ? '#6d28d9' : '#0369a1'
                }}>
                  {rec.isSimulated ? 'SIMULATED' : 'LIVE'}
                </span>
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

