import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Truck,
  Droplets,
  Layers,
  Filter,
  Navigation,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import SkeletonLoader from '../common/SkeletonLoader';

// Custom SVG Icons for Leaflet markers
function createCustomIcon(type, category) {
  let color = '#0c6e5d'; // Default supplier teal
  let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;

  if (type === 'buyer') {
    color = '#f59e0b'; // Buyer amber
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M9 2h6v3H9z"/><path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M4 11h16"/><path d="M4 16h16"/></svg>`;
  } else if (type === 'delivery') {
    color = '#0284c7'; // Delivery sky blue
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="1" y="4" width="14" height="12" rx="2"/><path d="M15 8h4.5a2 2 0 0 1 1.7 1l1.8 3v4h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg>`;
  }

  const html = `
    <div style="
      background-color: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function AdminLogisticsMap({ onNavigate, globalSearch = '', refreshTrigger }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const routesGroupRef = useRef(null);

  const [mapData, setMapData] = useState({ suppliers: [], buyers: [], activeDeliveries: [] });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'suppliers' | 'buyers' | 'deliveries'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = globalSearch || localSearch;

  // Fetch Logistics Locations
  const fetchLocations = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch('/api/admin/map/locations');
      if (!res.ok) throw new Error('Failed to load logistics locations');
      const json = await res.json();
      setMapData(json);
    } catch (err) {
      console.error('Error fetching map locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(mapData.suppliers.length > 0);
  }, [refreshTrigger]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Chennai: 13.0450, 80.2400
    const map = L.map(mapContainerRef.current, {
      center: [13.0450, 80.2400],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    routesGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Filter Locations
  const filteredSuppliers = useMemo(() => {
    if (roleFilter === 'buyers' || roleFilter === 'deliveries') return [];
    return (mapData.suppliers || []).filter((s) => {
      if (categoryFilter !== 'all' && s.waterCategory !== categoryFilter) return false;
      if (effectiveSearch) {
        const q = effectiveSearch.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.title || '').toLowerCase().includes(q) ||
          (s.address || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mapData.suppliers, roleFilter, categoryFilter, effectiveSearch]);

  const filteredBuyers = useMemo(() => {
    if (roleFilter === 'suppliers' || roleFilter === 'deliveries') return [];
    return (mapData.buyers || []).filter((b) => {
      if (categoryFilter !== 'all' && b.waterCategory !== categoryFilter) return false;
      if (effectiveSearch) {
        const q = effectiveSearch.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          (b.title || '').toLowerCase().includes(q) ||
          (b.purpose || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mapData.buyers, roleFilter, categoryFilter, effectiveSearch]);

  const filteredDeliveries = useMemo(() => {
    if (roleFilter === 'suppliers' || roleFilter === 'buyers') return [];
    return mapData.activeDeliveries || [];
  }, [mapData.activeDeliveries, roleFilter]);

  // Update Markers and Routes on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersGroupRef.current || !routesGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    routesGroupRef.current.clearLayers();

    // 1. Add Supplier Markers
    filteredSuppliers.forEach((s) => {
      if (!Array.isArray(s.coordinates) || s.coordinates.length < 2) return;
      const marker = L.marker(s.coordinates, {
        icon: createCustomIcon('supplier', s.waterCategory),
      });

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px;">
          <div style="font-size: 11px; color: #0c6e5d; font-weight: 700; text-transform: uppercase;">Water Supplier</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 2px 0;">${s.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${s.title || s.waterCategory}</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span>Available:</span>
            <strong>${(s.quantity || 0).toLocaleString()} L</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
            <span>Quality:</span>
            <span style="color: ${s.quality === 'Verified' ? '#059669' : '#d97706'}; font-weight: 600;">${s.quality}</span>
          </div>
        </div>
      `);

      marker.on('click', () => setSelectedEntity({ ...s, entityType: 'supplier' }));
      markersGroupRef.current.addLayer(marker);
    });

    // 2. Add Buyer Markers
    filteredBuyers.forEach((b) => {
      if (!Array.isArray(b.coordinates) || b.coordinates.length < 2) return;
      const marker = L.marker(b.coordinates, {
        icon: createCustomIcon('buyer', b.waterCategory),
      });

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px;">
          <div style="font-size: 11px; color: #d97706; font-weight: 700; text-transform: uppercase;">Buyer Demand</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 2px 0;">${b.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Purpose: ${b.purpose}</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span>Required:</span>
            <strong>${(b.requiredQuantity || 0).toLocaleString()} L</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
            <span>Priority:</span>
            <span style="color: ${b.priority === 'Urgent' ? '#dc2626' : '#2563eb'}; font-weight: 600;">${b.priority}</span>
          </div>
        </div>
      `);

      marker.on('click', () => setSelectedEntity({ ...b, entityType: 'buyer' }));
      markersGroupRef.current.addLayer(marker);
    });

    // 3. Add Deliveries Markers & Route Polylines
    filteredDeliveries.forEach((d) => {
      if (!Array.isArray(d.coordinates) || d.coordinates.length < 2) return;
      const marker = L.marker(d.coordinates, {
        icon: createCustomIcon('delivery', 'Industrial'),
      });

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px;">
          <div style="font-size: 11px; color: #0284c7; font-weight: 700; text-transform: uppercase;">Active Tanker (${d.deliveryCode})</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0;">${d.sourceName} &rarr; ${d.destinationName}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Fleet: ${d.transporterName} (${d.vehicleNumber})</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span>Payload:</span>
            <strong>${(d.quantity || 0).toLocaleString()} L</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
            <span>Status:</span>
            <span style="color: #0284c7; font-weight: 600;">${d.status}</span>
          </div>
        </div>
      `);

      marker.on('click', () => setSelectedEntity({ ...d, entityType: 'delivery' }));
      markersGroupRef.current.addLayer(marker);

      // Draw corridor line connecting pickup and dropoff
      if (d.pickupCoordinates && d.dropoffCoordinates) {
        const polyline = L.polyline([d.pickupCoordinates, d.coordinates, d.dropoffCoordinates], {
          color: '#0284c7',
          weight: 4,
          opacity: 0.75,
          dashArray: '6, 8',
        });
        routesGroupRef.current.addLayer(polyline);
      }
    });
  }, [filteredSuppliers, filteredBuyers, filteredDeliveries]);

  const handleFocusEntity = (item) => {
    setSelectedEntity(item);
    const coords = item.coordinates || item.pickupCoordinates;
    if (mapInstanceRef.current && coords) {
      mapInstanceRef.current.flyTo(coords, 14, { duration: 1 });
    }
  };

  return (
    <div className="admin-page-content" style={{ gap: '1.25rem' }}>
      {/* Map Control Bar */}
      <div
        className="admin-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Left: Role Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Filter View:</span>
          {[
            { id: 'all', label: 'All Locations' },
            { id: 'suppliers', label: `Suppliers (${filteredSuppliers.length})` },
            { id: 'buyers', label: `Buyers (${filteredBuyers.length})` },
            { id: 'deliveries', label: `Active Tankers (${filteredDeliveries.length})` },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRoleFilter(btn.id)}
              className={`admin-btn admin-btn-sm ${roleFilter === btn.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Right: Water Category Filter & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              color: '#334155',
              background: '#ffffff',
              outline: 'none',
            }}
          >
            <option value="all">All Water Categories</option>
            <option value="Industrial">Industrial</option>
            <option value="Treated Wastewater">Treated Wastewater</option>
            <option value="Greywater">Greywater</option>
            <option value="RO Reject Water">RO Reject Water</option>
          </select>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.35rem 0.65rem',
            }}
          >
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Find point on map..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '130px' }}
            />
          </div>
        </div>
      </div>

      {/* Main Map + Details Panel Container */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedEntity ? '1fr 340px' : '1fr', gap: '1.25rem', height: '620px' }}>
        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
            zIndex: 10,
          }}
        />

        {/* Selected Entity Inspector Panel */}
        {selectedEntity && (
          <div
            className="admin-card"
            style={{
              height: '100%',
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: selectedEntity.entityType === 'supplier' ? '#0c6e5d' : (selectedEntity.entityType === 'buyer' ? '#d97706' : '#0284c7'),
                }}
              >
                {selectedEntity.entityType} Details
              </span>
              <button
                onClick={() => setSelectedEntity(null)}
                style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'none' }}
              >
                Close
              </button>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {selectedEntity.name || selectedEntity.deliveryCode}
            </h3>

            {selectedEntity.title && (
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {selectedEntity.title}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b' }}>Water Category:</span>
                <strong>{selectedEntity.waterCategory || 'Treated'}</strong>
              </div>

              {selectedEntity.quantity && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Available Volume:</span>
                  <strong style={{ color: '#0c6e5d' }}>{Number(selectedEntity.quantity).toLocaleString()} L</strong>
                </div>
              )}

              {selectedEntity.requiredQuantity && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Required Volume:</span>
                  <strong style={{ color: '#d97706' }}>{Number(selectedEntity.requiredQuantity).toLocaleString()} L</strong>
                </div>
              )}

              {selectedEntity.quality && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Quality Status:</span>
                  <StatusBadge status={selectedEntity.quality} />
                </div>
              )}

              {selectedEntity.status && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Lifecycle State:</span>
                  <StatusBadge status={selectedEntity.status} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Address / Corridor:</span>
                <span style={{ fontSize: '0.8rem', color: '#334155' }}>
                  {selectedEntity.address || 'Chennai Metropolitan Area'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedEntity.entityType === 'supplier' && (
                <button
                  onClick={() => onNavigate('matching')}
                  className="admin-btn admin-btn-primary"
                  style={{ width: '100%' }}
                >
                  Find Matching Buyers &rarr;
                </button>
              )}
              {selectedEntity.entityType === 'buyer' && (
                <button
                  onClick={() => onNavigate('matching')}
                  className="admin-btn admin-btn-primary"
                  style={{ width: '100%' }}
                >
                  Generate Supplier Match &rarr;
                </button>
              )}
              {selectedEntity.entityType === 'delivery' && (
                <button
                  onClick={() => onNavigate('deliveries')}
                  className="admin-btn admin-btn-secondary"
                  style={{ width: '100%' }}
                >
                  Manage Tanker Lifecycle &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Linked Locations List Drawer */}
      <div className="admin-card">
        <h4 className="admin-card-title">Geographic Locations Directory</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {filteredSuppliers.slice(0, 4).map((s) => (
            <div
              key={s.id}
              onClick={() => handleFocusEntity(s)}
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0c6e5d' }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.waterCategory} • {s.quantity?.toLocaleString()} L</div>
                </div>
              </div>
              <Navigation size={14} color="#0c6e5d" />
            </div>
          ))}

          {filteredBuyers.slice(0, 4).map((b) => (
            <div
              key={b.id}
              onClick={() => handleFocusEntity(b)}
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{b.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Need: {b.requiredQuantity?.toLocaleString()} L ({b.purpose})</div>
                </div>
              </div>
              <Navigation size={14} color="#f59e0b" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
