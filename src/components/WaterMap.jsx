import { api } from '../services/api';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Droplet, 
  Factory, 
  Building2, 
  Home, 
  Trees, 
  ShieldAlert, 
  RefreshCw, 
  ArrowRight, 
  X,
  Gauge,
  Sparkles,
  Layers,
  Truck,
  Info
} from 'lucide-react';
import { calculateStraightLineDistance, fetchRoadRoute, evaluateWaterCompatibility } from '../utils/geoUtils';

export default function WaterMap({ sources = [], demands = [], onRequestSource }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Filter & Search State
  // User required: All Locations, Suppliers, Buyers, Treatment Plants, Verified Reports, Potential Matches
  const [filterType, setFilterType] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection & Telemetry State
  const [selectedEntity, setSelectedEntity] = useState(null); // { type: 'source'|'demand', data: ... }
  const [activeMatchPair, setActiveMatchPair] = useState({
    sourceId: 'src-1', // Factory A
    demandId: 'dem-1'  // Green Park
  });

  // Routing Telemetry
  const [routeData, setRouteData] = useState({
    straightLineKm: 2.8,
    roadDistanceKm: 3.4,
    durationMin: 9,
    routingSource: 'OSRM OpenStreetMap Driving Router'
  });
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // ReLoop Rescue Simulation State
  const [isRescueSimulated, setIsRescueSimulated] = useState(false);
  const [disruptedSourceId, setDisruptedSourceId] = useState(null);
  const [rescueExplanation, setRescueExplanation] = useState(null);

  // Calculate Aggregates from application data
  const totalAvailableSupply = useMemo(() => {
    return sources.reduce((sum, s) => sum + (s.available ? Number(s.quantity || 0) : 0), 0);
  }, [sources]);

  const totalDemandVolume = useMemo(() => {
    return demands.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  }, [demands]);

  // Combine and filter entities for map rendering
  const displayedSources = useMemo(() => {
    return sources.filter(src => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = src.name.toLowerCase().includes(q);
        const matchesType = src.type.toLowerCase().includes(q);
        const matchesDesc = (src.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesType && !matchesDesc) return false;
      }
      if (filterType === 'buyers') return false;
      if (filterType === 'treatment') return src.type.toLowerCase().includes('stp') || src.type.toLowerCase().includes('wastewater');
      if (filterType === 'verified') return src.quality === 'Verified';
      if (filterType === 'matches') return src.id === activeMatchPair.sourceId;
      return true;
    });
  }, [sources, filterType, searchQuery, activeMatchPair]);

  const displayedDemands = useMemo(() => {
    return demands.filter(dem => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = dem.title.toLowerCase().includes(q);
        const matchesPurpose = dem.purpose.toLowerCase().includes(q);
        if (!matchesTitle && !matchesPurpose) return false;
      }
      if (filterType === 'suppliers' || filterType === 'treatment' || filterType === 'verified') return false;
      if (filterType === 'matches') return dem.id === activeMatchPair.demandId;
      return true;
    });
  }, [demands, filterType, searchQuery, activeMatchPair]);

  // Initialize Leaflet Map once with real OpenStreetMap tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Reset stale _leaflet_id if component was unmounted/remounted in dev
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Centered on Chennai water reuse corridor
    const map = L.map(mapContainerRef.current, {
      center: [13.0450, 80.2450],
      zoom: 12,
      zoomControl: false,
      attributionControl: true
    });

    // Real OpenStreetMap Standard Tiles (No API Key Required, No Watermark)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Zoom controls at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size lifecycle handling to ensure tiles render immediately
    map.whenReady(() => {
      map.invalidateSize();
    });

    const resizeTimer1 = setTimeout(() => map.invalidateSize(), 100);
    const resizeTimer2 = setTimeout(() => map.invalidateSize(), 400);
    const resizeTimer3 = setTimeout(() => map.invalidateSize(), 1000);

    // ResizeObserver for dynamic layout / window adjustments
    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(resizeTimer1);
      clearTimeout(resizeTimer2);
      clearTimeout(resizeTimer3);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Marker Icon Generator
  const createEntityIcon = (entity, isSource, isDisrupted, isRescued, isSelected) => {
    let pinColor = '#0284c7';
    let pulseClass = '';

    if (isDisrupted) {
      pinColor = '#ef4444';
      pulseClass = 'pulse-danger';
    } else if (isRescued) {
      pinColor = '#f59e0b';
      pulseClass = 'pulse-rescue';
    } else if (!isSource) {
      pinColor = '#10b981';
      pulseClass = 'pulse-buyer';
    } else {
      if (entity.name.includes('STP') || entity.type.toLowerCase().includes('wastewater')) pinColor = '#0d9488';
      else if (entity.name.includes('IT Park')) pinColor = '#6366f1';
      else if (entity.name.includes('Apartment')) pinColor = '#0284c7';
    }

    const size = isSelected ? 38 : 32;

    const iconSvg = isDisrupted
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/></svg>`
      : isRescued
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
      : !isSource
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;

    return L.divIcon({
      className: 'reloop-map-marker',
      html: `
        <div class="marker-container ${isSelected ? 'marker-selected' : ''}">
          <div class="marker-head" style="background: ${pinColor}; width: ${size}px; height: ${size}px;">
            ${iconSvg}
          </div>
          <div class="marker-pulse ${pulseClass}" style="background: ${pinColor};"></div>
          ${isSelected ? '<div class="marker-halo"></div>' : ''}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size - 2],
      popupAnchor: [0, -size + 4]
    });
  };

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // 1. Render Suppliers
    displayedSources.forEach(src => {
      if (!src.coordinates || !Array.isArray(src.coordinates) || src.coordinates.length < 2) return;
      const [lat, lon] = src.coordinates;
      if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return;

      const isDisrupted = isRescueSimulated && src.id === disruptedSourceId;
      const isRescued = isRescueSimulated && activeMatchPair.sourceId === src.id;
      const isSelected = selectedEntity?.data?.id === src.id;

      const marker = L.marker(src.coordinates, {
        icon: createEntityIcon(src, true, isDisrupted, isRescued, isSelected)
      }).addTo(markersLayerRef.current);

      marker.on('click', () => {
        setSelectedEntity({ type: 'source', data: src });
        setActiveMatchPair(prev => ({ ...prev, sourceId: src.id }));
      });

      marker.bindPopup(`
        <div class="leaflet-smart-popup">
          <div class="popup-tag ${src.quality === 'Verified' ? 'tag-verified' : 'tag-pending'}">
            ${isDisrupted ? '⚠️ Disrupted / Offline' : src.quality === 'Verified' ? '✓ Quality Verified' : '⏳ Quality Pending'}
          </div>
          <div class="popup-title">${src.name}</div>
          <div class="popup-meta">${src.type}</div>
          <div class="popup-stat-grid">
            <div>Available: <strong>${(src.quantity || 0).toLocaleString()} L/day</strong></div>
            <div>Price: <strong>${src.indicativePrice || '₹0.15/L'}</strong></div>
          </div>
          <div class="popup-source-note">Simulated Demo Data · Chennai</div>
        </div>
      `);
    });

    // 2. Render Buyers
    displayedDemands.forEach(dem => {
      if (!dem.coordinates || !Array.isArray(dem.coordinates) || dem.coordinates.length < 2) return;
      const [lat, lon] = dem.coordinates;
      if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return;

      const isSelected = selectedEntity?.data?.id === dem.id;

      const marker = L.marker(dem.coordinates, {
        icon: createEntityIcon(dem, false, false, false, isSelected)
      }).addTo(markersLayerRef.current);

      marker.on('click', () => {
        setSelectedEntity({ type: 'demand', data: dem });
        setActiveMatchPair(prev => ({ ...prev, demandId: dem.id }));
      });

      marker.bindPopup(`
        <div class="leaflet-smart-popup">
          <div class="popup-tag tag-demand">Buyer Destination</div>
          <div class="popup-title">${dem.title}</div>
          <div class="popup-meta">Reuse Purpose: ${dem.purpose}</div>
          <div class="popup-stat-grid">
            <div>Requirement: <strong>${dem.quantity.toLocaleString()} L/day</strong></div>
            <div>Budget: <strong>${dem.indicativeBudget || '₹0.18/L'}</strong></div>
          </div>
          <div class="popup-source-note">Simulated Demo Data · Chennai</div>
        </div>
      `);
    });
  }, [displayedSources, displayedDemands, isRescueSimulated, disruptedSourceId, activeMatchPair, selectedEntity]);

  // Update Dynamic Route Polyline when Active Pair changes
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    const currentSource = sources.find(s => s.id === activeMatchPair.sourceId);
    const currentDemand = demands.find(d => d.id === activeMatchPair.demandId);

    if (!currentSource || !currentDemand) return;

    let isCancelled = false;
    setIsRoutingLoading(true);

    fetchRoadRoute(currentSource.coordinates, currentDemand.coordinates).then(res => {
      if (isCancelled || !routeLayerRef.current) return;
      setIsRoutingLoading(false);
      setRouteData(res);

      const routeColor = isRescueSimulated ? '#f59e0b' : currentSource.quality === 'Verified' ? '#0284c7' : '#94a3b8';

      if (res.polylineCoords && res.polylineCoords.length >= 2) {
        // Polyline for route
        const polyline = L.polyline(res.polylineCoords, {
          color: routeColor,
          weight: 4.5,
          opacity: 0.9,
          dashArray: isRescueSimulated ? '8, 6' : currentSource.quality === 'Verified' ? '5, 8' : '3, 6',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeLayerRef.current);

        polyline.bindTooltip(`
          <strong>${currentSource.name} → ${currentDemand.title}</strong><br/>
          Road: ${res.roadDistanceKm} km | Straight-Line: ${res.straightLineKm} km<br/>
          Est. Transit: ~${res.durationMin} mins (${res.routingSource})
        `, { sticky: true });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeMatchPair, sources, demands, isRescueSimulated]);

  // Handle Recenter
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([13.0450, 80.2450], 12, { animate: true });
    }
  };

  // Trigger ReLoop Rescue Demo Simulation
  const handleSimulateDisruption = async () => {
    if (isRescueSimulated) {
      // Reset
      setIsRescueSimulated(false);
      setDisruptedSourceId(null);
      setRescueExplanation(null);
      if (sources.length > 0 && demands.length > 0) {
        setActiveMatchPair({ sourceId: sources[0].id, demandId: demands[0].id });
      }
      return;
    }

    if (!sources || sources.length === 0 || !demands || demands.length === 0) return;

    const failedSource = sources[0];
    const targetDemand = demands[0];

    setIsRescueSimulated(true);
    setDisruptedSourceId(failedSource.id);

    try {
      const res = await api.simulateRescue({
        scenarioId: 'CONTAMINATION_TURBIDITY',
        failedSourceId: failedSource.id,
        demandId: targetDemand.id,
        searchRadiusKm: 15,
        isSimulated: true
      });

      if (res && res.winningAlternative) {
        setActiveMatchPair({
          sourceId: res.winningAlternative.sourceId,
          demandId: targetDemand.id
        });
        setRescueExplanation({
          disruptedName: failedSource.name,
          backupName: res.winningAlternative.sourceName,
          reason: `${failedSource.name} supply suspended by Safe Reuse Gate (${res.incident?.failureType || 'Optical turbidity spike'}). ReLoop Rescue evaluated ${res.evaluatedCandidates?.length || 0} regional alternatives: ${res.winningAlternative.sourceName} locked in with score ${res.winningAlternative.score}/100 at ${res.winningAlternative.distanceKm} km.`,
          dispatchedLiters: res.routeReassignment ? res.routeReassignment.dispatchedVolumeLiters : Math.min(res.winningAlternative.availableQuantity, targetDemand.quantity || 4000)
        });
      } else {
        const backup = sources.find(s => s.id !== failedSource.id && (s.quality === 'Verified' || s.verificationStatus === 'Verified')) || sources[1] || failedSource;
        setActiveMatchPair({
          sourceId: backup.id,
          demandId: targetDemand.id
        });
        setRescueExplanation({
          disruptedName: failedSource.name,
          backupName: backup.name,
          reason: `${failedSource.name} supply suspended by Safe Reuse Gate. ReLoop Rescue evaluated nearby nodes and rerouted supply to verified backup ${backup.name}.`,
          dispatchedLiters: Math.min(backup.quantity || 3000, targetDemand.quantity || 4000)
        });
      }
    } catch (e) {
      const backup = sources.find(s => s.id !== failedSource.id && (s.quality === 'Verified' || s.verificationStatus === 'Verified')) || sources[1] || failedSource;
      setActiveMatchPair({
        sourceId: backup.id,
        demandId: targetDemand.id
      });
      setRescueExplanation({
        disruptedName: failedSource.name,
        backupName: backup.name,
        reason: `${failedSource.name} supply suspended by Safe Reuse Gate. ReLoop Rescue evaluated nearby nodes and rerouted supply to verified backup ${backup.name}.`,
        dispatchedLiters: Math.min(backup.quantity || 3000, targetDemand.quantity || 4000)
      });
    }
  };

  // Compatibility score between active pair
  const currentPairEval = useMemo(() => {
    const s = sources.find(src => src.id === activeMatchPair.sourceId);
    const d = demands.find(dem => dem.id === activeMatchPair.demandId);
    return evaluateWaterCompatibility(s, d);
  }, [sources, demands, activeMatchPair]);

  const activeSource = sources.find(s => s.id === activeMatchPair.sourceId);
  const activeDemand = demands.find(d => d.id === activeMatchPair.demandId);

  return (
    <div className="water-map-card">
      {/* 1. Header with clear hierarchy */}
      <div className="map-card-header">
        <div className="map-header-left">
          <div className="map-title-icon-wrap">
            <MapPin size={18} className="map-title-icon" />
          </div>
          <div className="map-title-col">
            <h2 className="map-title">Water Reuse & Recovery Map</h2>
            <p className="map-subtitle">Simulated Demo Data · Chennai Eco-Corridor</p>
          </div>
        </div>

        {/* Aggregate Telemetry Badges & Recenter */}
        <div className="map-header-actions">
          <div className="map-metric-chip chip-supply" title="Total Available Water Supply">
            <Droplet size={13} className="text-blue-500" />
            <span>Supply: <strong>{totalAvailableSupply.toLocaleString()} L/d</strong></span>
          </div>
          <div className="map-metric-chip chip-demand" title="Total Active Buyer Demand">
            <Gauge size={13} className="text-emerald-500" />
            <span>Demand: <strong>{totalDemandVolume.toLocaleString()} L/d</strong></span>
          </div>
          <button 
            className="map-control-btn" 
            title="Recenter Map to Chennai"
            onClick={handleRecenter}
          >
            <Navigation size={15} />
          </button>
        </div>
      </div>

      {/* 2. Full-Width Search Bar */}
      <div className="map-search-container">
        <div className="map-search-box full-width">
          <Search size={15} className="map-search-icon" />
          <input 
            type="text"
            className="map-search-input"
            placeholder="Search by facility name, water type, or reuse purpose (e.g. Factory A, Greywater, Irrigation)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="map-clear-search" onClick={() => setSearchQuery('')} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Row with exact requested categories */}
      <div className="map-filter-row">
        <div className="map-filter-pills-scroll">
          {[
            { id: 'all', label: 'All Locations' },
            { id: 'suppliers', label: 'Suppliers' },
            { id: 'buyers', label: 'Buyers' },
            { id: 'treatment', label: 'Treatment Plants' },
            { id: 'verified', label: 'Verified Reports' },
            { id: 'matches', label: 'Potential Matches' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-pill-btn ${filterType === f.id ? 'active' : ''}`}
              onClick={() => setFilterType(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Legend Bar with distinct markers & Rescue simulation button */}
      <div className="map-legend-bar">
        <div className="legend-items-wrap">
          <div className="legend-item" title="Verified industrial or greywater suppliers">
            <span className="legend-dot dot-source"></span>
            <span className="legend-text">Supplier Sources</span>
          </div>
          <div className="legend-item" title="Verified buyer demand destinations">
            <span className="legend-dot dot-dest"></span>
            <span className="legend-text">Buyer Destinations</span>
          </div>
          <div className="legend-item" title="Municipal or decentralized wastewater treatment facilities">
            <span className="legend-dot dot-treatment"></span>
            <span className="legend-text">Treatment Plants</span>
          </div>
          <div className="legend-item" title="Road-calibrated transit corridor">
            <span className={`legend-line ${isRescueSimulated ? 'line-rescue' : 'line-route'}`}></span>
            <span className="legend-text">{isRescueSimulated ? 'Rescue Corridor' : 'Matching Route'}</span>
          </div>
        </div>

        {/* Hackathon ReLoop Rescue Simulation Button */}
        <div className="map-rescue-control">
          <button 
            className={`btn-simulate-disruption ${isRescueSimulated ? 'btn-active-rescue' : ''}`}
            onClick={handleSimulateDisruption}
            title="Click to test automated emergency supply failover"
          >
            {isRescueSimulated ? (
              <>
                <RefreshCw size={13} className="spin-once" />
                <span>Reset Simulation</span>
              </>
            ) : (
              <>
                <ShieldAlert size={13} />
                <span>Simulate Disruption (Rescue Demo)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Active Match Panel: Uncramped, clean, responsive */}
      <div className="map-active-match-panel">
        <div className="match-panel-grid">
          {/* Supplier Info */}
          <div className="match-panel-item">
            <span className="match-panel-lbl">Selected Supplier</span>
            <div className="match-panel-entity">
              <span className="entity-name">{activeSource?.name || 'Factory A'}</span>
              <span className="entity-tag">{activeSource?.type || 'Industrial'}</span>
            </div>
            <div className="match-panel-sub">
              Available: <strong>{(activeSource?.quantity || 5000).toLocaleString()} L/d</strong>
            </div>
          </div>

          {/* Arrow Divider */}
          <div className="match-panel-divider">
            <ArrowRight size={18} className="text-teal-600" />
          </div>

          {/* Buyer Info */}
          <div className="match-panel-item">
            <span className="match-panel-lbl">Target Buyer</span>
            <div className="match-panel-entity">
              <span className="entity-name">{activeDemand?.title || 'Green Park'}</span>
              <span className="entity-tag tag-demand">{activeDemand?.purpose || 'Irrigation'}</span>
            </div>
            <div className="match-panel-sub">
              Required: <strong>{(activeDemand?.quantity || 4000).toLocaleString()} L/d</strong>
            </div>
          </div>

          {/* Distance Telemetry */}
          <div className="match-panel-item">
            <span className="match-panel-lbl">Distance & Transit</span>
            <div className="match-distance-row">
              <span className="dist-primary">
                <strong>{routeData.roadDistanceKm} km</strong> <small>(Road via OSRM)</small>
              </span>
              <span className="dist-secondary">
                {routeData.straightLineKm} km straight-line
              </span>
            </div>
            <div className="match-panel-sub">
              Est. Transit: <strong>~{routeData.durationMin} mins</strong>
            </div>
          </div>

          {/* Compatibility Status */}
          <div className="match-panel-item match-panel-status">
            <span className="match-panel-lbl">Match Evaluation</span>
            <div className="status-badge-wrap">
              <span className={`match-compat-badge badge-${currentPairEval.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {currentPairEval.status} ({currentPairEval.score}%)
              </span>
            </div>
            <div className="match-panel-reason" title={currentPairEval.reason}>
              {currentPairEval.reason}
            </div>
          </div>
        </div>
      </div>

      {/* Rescue Alert Notice if Disrupted */}
      {isRescueSimulated && rescueExplanation && (
        <div className="map-rescue-explanation-box">
          <div className="rescue-box-head">
            <ShieldAlert size={18} className="text-amber-600" />
            <strong>ReLoop Rescue Activated: Emergency Failover Engaged</strong>
          </div>
          <p className="rescue-box-desc">{rescueExplanation.reason}</p>
          <div className="rescue-box-footer">
            <span>Dispatched: <strong>{rescueExplanation.dispatchedLiters.toLocaleString()} L/day</strong></span>
            <span>Rerouted To: <strong>{rescueExplanation.backupName}</strong></span>
            <span>Safety Gate: <strong>100% Lab Cleared</strong></span>
          </div>
        </div>
      )}

      {/* 6. Dominant Map Canvas: Full Width & 520px Height with OSM tiles */}
      <div className="leaflet-map-wrapper">
        <div ref={mapContainerRef} className="map-canvas-element" />

        {/* Selected Entity Details Drawer Panel */}
        {selectedEntity && (
          <div className="map-entity-drawer">
            <div className="drawer-header">
              <div className="drawer-title-wrap">
                <span className={`drawer-role-badge ${selectedEntity.type === 'source' ? 'badge-source' : 'badge-buyer'}`}>
                  {selectedEntity.type === 'source' ? 'Water Supplier' : 'Water Buyer'}
                </span>
                <h4 className="drawer-title">{selectedEntity.data.name || selectedEntity.data.title}</h4>
              </div>
              <button className="drawer-close-btn" onClick={() => setSelectedEntity(null)} title="Close details">
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-info-row">
                <span className="drawer-lbl">Category:</span>
                <span className="drawer-val">{selectedEntity.data.type || selectedEntity.data.purpose}</span>
              </div>
              <div className="drawer-info-row">
                <span className="drawer-lbl">Daily Volume:</span>
                <strong className="drawer-val">{selectedEntity.data.quantity.toLocaleString()} L/day</strong>
              </div>
              <div className="drawer-info-row">
                <span className="drawer-lbl">Coordinates:</span>
                <span className="drawer-val coord-text">
                  {Array.isArray(selectedEntity.data.coordinates) && selectedEntity.data.coordinates.length >= 2
                    ? `${Number(selectedEntity.data.coordinates[0]).toFixed(4)}, ${Number(selectedEntity.data.coordinates[1]).toFixed(4)}`
                    : '13.0450, 80.2450'}
                </span>
              </div>

              {selectedEntity.type === 'source' && (
                <>
                  <div className="drawer-info-row">
                    <span className="drawer-lbl">Indicative Price:</span>
                    <span className="drawer-val price-highlight">{selectedEntity.data.indicativePrice || '₹0.15/L'}</span>
                  </div>
                  <div className="drawer-info-row">
                    <span className="drawer-lbl">Quality Certificate:</span>
                    <span className={`quality-badge badge-${(selectedEntity.data.quality || 'Pending').toLowerCase()}`}>
                      {selectedEntity.data.quality}
                    </span>
                  </div>
                  {selectedEntity.data.labReport && (
                    <div className="drawer-lab-card">
                      <div className="lab-head">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>{selectedEntity.data.labReport.tester} ({selectedEntity.data.labReport.id})</span>
                      </div>
                      <div className="lab-grid">
                        <div>pH: <strong>{selectedEntity.data.labReport.ph}</strong></div>
                        <div>Turbidity: <strong>{selectedEntity.data.labReport.turbidity}</strong></div>
                        <div>TDS: <strong>{selectedEntity.data.labReport.tds}</strong></div>
                        <div>Expiry: <strong>{selectedEntity.data.labReport.expiryDate}</strong></div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Suitability & Action */}
              <div className="drawer-action-box">
                {selectedEntity.type === 'source' ? (
                  <button 
                    className="drawer-request-btn"
                    onClick={() => onRequestSource && onRequestSource(selectedEntity.data)}
                  >
                    Request Water Allocation from {selectedEntity.data.name}
                  </button>
                ) : (
                  <div className="buyer-demand-note">
                    Verified Buyer requirement matching regional suppliers.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
