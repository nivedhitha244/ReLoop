import React, { useState } from 'react';
import { buyerApi } from '../../services/buyerApi';
import { 
  X,
  AlertTriangle,
  XCircle,
  Truck, 
  Droplet, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2, 
  MapPin, 
  Zap, 
  AlertCircle,
  FileText
} from 'lucide-react';

export function CreateDemandModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState(3000);
  const [purpose, setPurpose] = useState('Irrigation');
  const [location, setLocation] = useState('Chennai, Tamil Nadu');
  const [needQualityCheck, setNeedQualityCheck] = useState(true);

  // Support ESC key to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      quantity: Number(quantity),
      purpose,
      location,
      needQualityCheck
    });
    setTitle('');
    onClose();
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'hidden'
      }}
    >
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '480px', 
          width: '100%',
          maxHeight: 'min(520px, 86vh)', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          margin: 'auto',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-blue-100 text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="modal-title">Create Water Demand</h3>
              <p className="modal-subtitle">Post a new reusable water demand request to the network</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div className="form-group">
              <label className="form-label">Facility / Destination Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Green Park Sector 4, Sports Arena" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Quantity Needed (Litres)</label>
                <input 
                  type="number" 
                  step="500" 
                  min="500" 
                  className="form-input" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reuse Purpose</label>
                <select 
                  className="form-select"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="Irrigation">Irrigation / Landscaping</option>
                  <option value="Construction">Construction & Dust Control</option>
                  <option value="Industrial">Industrial Cooling Tower</option>
                  <option value="Flushing">Toilet Flushing & Utilities</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Location</label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input 
                  type="text" 
                  className="form-input with-icon" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Quality Check Option */}
            <div className="qc-question-section" style={{ marginTop: '12px' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} className="text-emerald-600" />
                Do you need a Quality Check for this demand?
              </label>
              <div className="quality-check-toggle-row">
                <button
                  type="button"
                  className={`btn-toggle-qc ${needQualityCheck ? 'active' : ''}`}
                  onClick={() => setNeedQualityCheck(true)}
                >
                  ✓ Yes, Require Quality Check
                </button>
                <button
                  type="button"
                  className={`btn-toggle-qc ${!needQualityCheck ? 'active' : ''}`}
                  onClick={() => setNeedQualityCheck(false)}
                >
                  ✕ No, Direct Supply
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ flexShrink: 0 }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Demand Request</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RequestModal({ isOpen, onClose, source, demands = [], requests = [], onConfirm }) {
  const getRemaining = (d) => {
    if (!d) return 0;
    if (d.remainingQuantity !== undefined) return Math.max(0, Number(d.remainingQuantity));
    const req = Number(d.requiredQuantity || d.quantity || 0);
    const alloc = Number(d.allocatedQuantity || 0);
    const ful = Number(d.fulfilledQuantity || 0);
    return Math.max(0, req - alloc - ful);
  };

  const activeDemands = (demands || []).filter(d => getRemaining(d) > 0 && d.status !== 'Fulfilled' && d.status !== 'Matched');
  const fulfilledDemands = (demands || []).filter(d => getRemaining(d) <= 0 || d.status === 'Fulfilled' || d.status === 'Matched');

  // Default to first active unfulfilled demand, or NEW if all are completed
  const defaultDemandId = activeDemands.length > 0 ? activeDemands[0].id : 'NEW';

  const [selectedDemandId, setSelectedDemandId] = useState(defaultDemandId);
  const [requestedLiters, setRequestedLiters] = useState(source?.quantity || 4000);
  const [needQualityCheck, setNeedQualityCheck] = useState(true);
  
  // Custom demand details if creating new or no existing demands
  const [demandTitle, setDemandTitle] = useState('Green Park Facility');
  const [purpose, setPurpose] = useState('Irrigation');
  const [deliveryLocation, setDeliveryLocation] = useState('Chennai, Tamil Nadu');

  // Reset or initialize when source changes or modal opens
  React.useEffect(() => {
    if (source && isOpen) {
      if (activeDemands.length > 0) {
        const topDemand = activeDemands[0];
        setSelectedDemandId(topDemand.id);
        const rem = getRemaining(topDemand);
        setRequestedLiters(Math.min(rem || 4000, Number(source.quantity || 4000)));
      } else {
        setSelectedDemandId('NEW');
        setRequestedLiters(Math.min(4000, Number(source.quantity || 4000)));
      }
    }
  }, [source, isOpen]);

  // Support ESC key to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !source) return null;

  const isCreatingNew = selectedDemandId === 'NEW';
  const currentDemand = (demands || []).find(d => d.id === selectedDemandId);
  const currentRemaining = currentDemand ? getRemaining(currentDemand) : 0;
  const isSelectedDemandFulfilled = currentDemand && currentRemaining <= 0;

  const existingActiveRequests = (requests || []).filter(r => 
    r.sourceId === source?.id && 
    (r.demandId === selectedDemandId) && 
    (r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Scheduled')
  );
  const hasPriorRequest = !isCreatingNew && existingActiveRequests.length > 0;

  const handleDemandChange = (e) => {
    const newId = e.target.value;
    setSelectedDemandId(newId);
    if (newId === 'NEW') {
      setRequestedLiters(Math.min(4000, Number(source.quantity || 4000)));
    } else {
      const d = (demands || []).find(item => item.id === newId);
      if (d) {
        const rem = getRemaining(d);
        if (rem > 0) {
          setRequestedLiters(Math.min(rem, Number(source.quantity || 4000)));
        } else {
          setRequestedLiters(Math.min(4000, Number(source.quantity || 4000)));
        }
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(
      source.id, 
      isCreatingNew ? '' : selectedDemandId, 
      Number(requestedLiters), 
      needQualityCheck,
      isCreatingNew ? { demandTitle: demandTitle.trim() || `Demand for ${source.name}`, purpose, deliveryLocation } : null
    );
    onClose();
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ 
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '16px',
        overflow: 'hidden'
      }}
    >
      <div 
        className="modal-container request-allocation-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '500px', 
          width: '100%',
          maxHeight: 'min(540px, 88vh)', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          margin: 'auto',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}
      >
        {/* Pinned Header */}
        <div 
          className="modal-header" 
          style={{ 
            flexShrink: 0, 
            padding: '12px 18px', 
            borderBottom: '1px solid #eef3f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div className="modal-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon-badge" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplet size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Request Water Supply
              </h3>
              <p className="modal-subtitle" style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                Direct allocation request to {source.name}
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="modal-close-btn" 
            onClick={onClose} 
            title="Close modal (Esc)"
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '6px', 
              borderRadius: '6px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Compact Body */}
        <div 
          className="modal-body" 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            minHeight: 0, 
            padding: '14px 18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px' 
          }}
        >
          {/* Streamlined Supplier Info Chip Bar */}
          <div 
            style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap',
              gap: '6px',
              fontSize: '12px' 
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Supplier: </span>
              <strong style={{ color: '#0f172a' }}>{source.name}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Capacity: </span>
              <strong style={{ color: '#059669' }}>{(source.quantity || 0).toLocaleString()} L</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#64748b' }}>Dist: </span>
              <strong style={{ color: '#0f172a' }}>{source.distance || 3.5} km</strong>
              <span className={`quality-badge badge-${(source.quality || 'Verified').toLowerCase()}`} style={{ padding: '1px 6px', fontSize: '10.5px' }}>
                {source.quality || 'Verified'}
              </span>
            </div>
          </div>

          {/* Demand Target Selection */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px', display: 'block' }}>
              Target Demand / Destination
            </label>
            <select 
              className="form-select"
              value={selectedDemandId}
              onChange={handleDemandChange}
              style={{ fontSize: '12.5px', padding: '7px 10px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="NEW">+ Create New Demand for this Water Request</option>
              {activeDemands.length > 0 && (
                <optgroup label="Active Projects (Unmet Need)">
                  {activeDemands.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} — {getRemaining(d).toLocaleString()} L needed ({d.purpose})
                    </option>
                  ))}
                </optgroup>
              )}
              {fulfilledDemands.length > 0 && (
                <optgroup label="Completed Projects">
                  {fulfilledDemands.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} — Completed (Auto-creates Batch 2)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Context Banner */}
          {isCreatingNew ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💡</span>
              <span><strong>New Demand:</strong> Fill in destination details below. This will register a new demand and request water directly.</span>
            </div>
          ) : hasPriorRequest ? (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ℹ️</span>
              <span><strong>Additional Allocation:</strong> An active request exists for this demand ({existingActiveRequests.length} pending). Submitting will request an <strong>additional tanker allocation (Tanker #{existingActiveRequests.length + 1})</strong>.</span>
            </div>
          ) : isSelectedDemandFulfilled ? (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔄</span>
              <span><strong>Continuation Batch:</strong> Previous allocation was fulfilled. Submitting will auto-create <strong>{currentDemand?.title} (Batch 2)</strong>.</span>
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✓</span>
              <span><strong>Active Project:</strong> Allocating toward <strong>{currentDemand?.title}</strong> ({currentRemaining.toLocaleString()} L unmet requirement).</span>
            </div>
          )}

          {/* Quick Destination Details (Row-based to save space) */}
          {isCreatingNew && (
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px', display: 'block' }}>Facility / Destination</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Green Park Sector 4" 
                    value={demandTitle}
                    onChange={(e) => setDemandTitle(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 8px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px', display: 'block' }}>Reuse Purpose</label>
                  <select 
                    className="form-select"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 8px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Irrigation">Irrigation / Landscaping</option>
                    <option value="Construction">Construction & Dust</option>
                    <option value="Industrial">Industrial Cooling</option>
                    <option value="Flushing">Toilet Flushing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px', display: 'block' }}>Delivery Address / Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  style={{ fontSize: '12px', padding: '6px 8px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          )}

          {/* Requested Volume */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, margin: 0 }}>
                Requested Volume (Litres)
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Max Available: <strong>{(source.quantity || 0).toLocaleString()} L</strong>
              </span>
            </div>
            <input 
              type="number"
              max={source.quantity}
              min="500"
              step="500"
              className="form-input"
              value={requestedLiters}
              onChange={(e) => setRequestedLiters(e.target.value)}
              style={{ fontSize: '12.5px', padding: '7px 10px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Compact Quality Check Toggle Row */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={14} className="text-emerald-600" />
              Quality Inspection Preference:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setNeedQualityCheck(true)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: needQualityCheck ? '2px solid #10b981' : '1px solid #cbd5e1',
                  background: needQualityCheck ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 800, color: needQualityCheck ? '#059669' : '#94a3b8' }}>
                  {needQualityCheck ? '✓' : '○'}
                </span>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>Yes, Quality Check</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Accredited lab verification</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNeedQualityCheck(false)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: !needQualityCheck ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: !needQualityCheck ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 800, color: !needQualityCheck ? '#0284c7' : '#94a3b8' }}>
                  {!needQualityCheck ? '✓' : '○'}
                </span>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>Direct Supply</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Fast turnaround without lab</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* PERMANENTLY VISIBLE PINNED BOTTOM ACTIONS */}
        <div 
          className="modal-actions" 
          style={{ 
            flexShrink: 0, 
            padding: '10px 18px', 
            borderTop: '1px solid #e2e8f0', 
            background: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '10px' 
          }}
        >
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={onClose}
            style={{ 
              padding: '8px 14px', 
              borderRadius: '8px', 
              fontSize: '12.5px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleConfirm}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              background: hasPriorRequest 
                ? 'linear-gradient(135deg, #0284c7, #38bdf8)' 
                : 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: hasPriorRequest 
                ? '0 2px 8px rgba(2, 132, 199, 0.35)' 
                : '0 2px 8px rgba(16, 185, 129, 0.35)'
            }}
          >
            <span>{hasPriorRequest ? `Confirm & Request Tanker #${existingActiveRequests.length + 1} →` : 'Confirm & Send Water Request →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function RescueModal({ isOpen, onClose, onExecuteRescue, demandId, failedSourceId, initialReason }) {
  const [status, setStatus] = useState('idle'); // idle | running | evaluated | dispatched
  const [scenarioId, setScenarioId] = useState('CONTAMINATION_TURBIDITY');
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [currentStage, setCurrentStage] = useState(1);
  const [rescueResult, setRescueResult] = useState(null);
  const [loadingDispatch, setLoadingDispatch] = useState(false);

  // Support ESC key to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setCurrentStage(1);
      setRescueResult(null);
      if (initialReason) {
        if (initialReason.toLowerCase().includes('quantity')) setScenarioId('CAPACITY_DROP_75');
        else if (initialReason.toLowerCase().includes('delivery')) setScenarioId('DELIVERY_FAILURE');
        else if (initialReason.toLowerCase().includes('expire')) setScenarioId('QUALITY_CERT_EXPIRED');
      }
    }
  }, [isOpen, initialReason]);

  if (!isOpen) return null;

  const runRescueSimulation = async () => {
    setStatus('running');
    setCurrentStage(1);

    setTimeout(() => setCurrentStage(2), 500);
    setTimeout(() => setCurrentStage(3), 1000);
    setTimeout(() => setCurrentStage(4), 1500);
    setTimeout(() => setCurrentStage(5), 2000);

    try {
      const res = await buyerApi.simulateRescue({
        scenarioId,
        demandId,
        failedSourceId,
        searchRadiusKm: Number(searchRadiusKm),
        isSimulated: true
      });

      setTimeout(() => {
        setCurrentStage(6);
        setRescueResult(res);
        setStatus('evaluated');
      }, 2500);
    } catch (err) {
      console.error('Simulation error:', err);
      // Fallback to legacy onExecuteRescue if network fails
      if (onExecuteRescue) {
        const fallbackRes = await onExecuteRescue(demandId, failedSourceId, initialReason);
        setRescueResult(fallbackRes);
      }
      setStatus('evaluated');
    }
  };

  const handleConfirmDispatch = async () => {
    if (!rescueResult?.incident?.incidentId) {
      setStatus('dispatched');
      return;
    }
    try {
      setLoadingDispatch(true);
      await buyerApi.resolveRescue(rescueResult.incident.incidentId);
      setStatus('dispatched');
    } catch (err) {
      console.warn('Dispatch resolution error:', err);
      setStatus('dispatched');
    } finally {
      setLoadingDispatch(false);
    }
  };

  const scenariosList = [
    { id: 'CONTAMINATION_TURBIDITY', label: 'Contamination Alert (Turbidity > 5.0 NTU Spike)', cat: 'Water Quality' },
    { id: 'CONTAMINATION_PH', label: 'Chemical Anomaly (Extreme pH 4.8 Acidification)', cat: 'Water Quality' },
    { id: 'CAPACITY_DROP_75', label: 'Sudden Volume Shortage (-75% Yield Deficit)', cat: 'Quantity' },
    { id: 'SUPPLIER_UNAVAILABLE', label: 'Plant Power Grid Outage (0 kW / Offline)', cat: 'Unavailability' },
    { id: 'DELIVERY_FAILURE', label: 'Transit Tanker Breakdown at KM 4.2', cat: 'Logistics' },
    { id: 'QUALITY_CERT_EXPIRED', label: 'Safe Reuse Gate Failure (Lab Report Expired)', cat: 'Compliance' }
  ];

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'hidden'
      }}
    >
      <div 
        className="modal-container rescue-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: 'min(700px, 92vh)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
          margin: 'auto',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}
      >
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0d9488 100%)', color: '#fff', padding: '18px 24px' }}>
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '10px', padding: '6px' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: 0 }}>
                ReLoop Rescue™ Continuous Supply Shield
              </h3>
              <p className="modal-subtitle" style={{ color: '#ccfbf1', fontSize: '12.5px', margin: '2px 0 0' }}>
                Safe Reuse Gate Verified Failover & Autonomous Tanker Rerouting
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '540px' }}>
          {status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '14px 16px', borderRadius: '12px', fontSize: '13px', color: '#0f766e', lineHeight: 1.5 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldCheck size={16} /> Safe Reuse Gate Protocol Active
                </strong>
                When an active water supplier experiences a contamination spike, mechanical pump failure, or transit breakdown, ReLoop Rescue automatically scans verified regional producers, enforces CPCB water reuse safety thresholds, and selects the optimal backup.
              </div>

              {/* Simulation Scenario Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Select Failure Disruption Scenario:
                </label>
                <select
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    fontWeight: 500
                  }}
                >
                  {scenariosList.map(sc => (
                    <option key={sc.id} value={sc.id}>
                      [{sc.cat}] {sc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Radius slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    Configurable Search Radius:
                  </label>
                  <span style={{ background: '#f0fdfa', color: '#0f766e', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '12.5px', border: '1px solid #99f6e4' }}>
                    {searchRadiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={searchRadiusKm}
                  onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0d9488', cursor: 'pointer' }}
                />
              </div>

              {/* Telemetry pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }}></span>
                <span>Includes simulated sensor telemetry &amp; live Safe Reuse Gate parameter verification.</span>
              </div>
            </div>
          )}

          {status === 'running' && (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div className="pulse-spinner" style={{ margin: '0 auto 16px', width: 44, height: 44, borderWidth: 3 }}></div>
              <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                ReLoop Rescue™ Autonomous Failover Engaged...
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
                Executing Stage {currentStage} of 6 in Safe Supply Recovery Engine
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '460px', margin: '0 auto', textAlign: 'left', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStage >= 1 ? '#059669' : '#94a3b8' }}>
                  {currentStage >= 1 ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0' }} />}
                  <span>1. Anomaly &amp; Disruption Audit Detected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStage >= 2 ? '#059669' : '#94a3b8' }}>
                  {currentStage >= 2 ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0' }} />}
                  <span>2. Scanning verified backup nodes within {searchRadiusKm} km</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStage >= 3 ? '#059669' : '#94a3b8' }}>
                  {currentStage >= 3 ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0' }} />}
                  <span>3. Safe Reuse Gate CPCB compatibility verification</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStage >= 4 ? '#059669' : '#94a3b8' }}>
                  {currentStage >= 4 ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0' }} />}
                  <span>4. Computing 5-factor weighted multi-criteria ranking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStage >= 5 ? '#059669' : '#94a3b8' }}>
                  {currentStage >= 5 ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e2e8f0' }} />}
                  <span>5. Selecting optimal alternative &amp; route corridor</span>
                </div>
              </div>
            </div>
          )}

          {status === 'evaluated' && rescueResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Outcome Badge Card */}
              <div style={{
                background: rescueResult.outcome === 'AUTOMATIC_RECOVERY' ? '#ecfdf5' : rescueResult.outcome === 'PARTIAL_RECOVERY' ? '#fffbeb' : '#fff1f2',
                border: `1.5px solid ${rescueResult.outcome === 'AUTOMATIC_RECOVERY' ? '#6ee7b7' : rescueResult.outcome === 'PARTIAL_RECOVERY' ? '#fde68a' : '#fecdd3'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: rescueResult.outcome === 'AUTOMATIC_RECOVERY' ? '#10b981' : rescueResult.outcome === 'PARTIAL_RECOVERY' ? '#d97706' : '#e11d48',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {rescueResult.outcome === 'AUTOMATIC_RECOVERY' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 2px', color: rescueResult.outcome === 'AUTOMATIC_RECOVERY' ? '#064e3b' : '#78350f' }}>
                    {rescueResult.outcome === 'AUTOMATIC_RECOVERY' && 'Autonomous Supply Failover Locked!'}
                    {rescueResult.outcome === 'PARTIAL_RECOVERY' && 'Partial Continuity Recovery Formulated'}
                    {rescueResult.outcome === 'EMERGENCY_ALERT' && 'Emergency Alert: Zero Safe Alternatives Found'}
                  </h4>
                  <p style={{ fontSize: '12.5px', margin: 0, color: '#334155' }}>
                    {rescueResult.winningAlternative 
                      ? `Safe Reuse Gate approved ${rescueResult.winningAlternative.sourceName} (${rescueResult.winningAlternative.score}/100 score, ${rescueResult.winningAlternative.distanceKm} km).`
                      : 'All available candidates failed Safe Reuse Gate criteria or exceeded radius.'}
                  </p>
                </div>
              </div>

              {/* Winning alternative summary */}
              {rescueResult.winningAlternative && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Rerouted Supplier: {rescueResult.winningAlternative.sourceName}</span>
                    <span style={{ fontWeight: 800, color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                      {rescueResult.winningAlternative.score}/100 Match Score
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px', color: '#475569' }}>
                    <div><strong>Distance:</strong> {rescueResult.winningAlternative.distanceKm} km</div>
                    <div><strong>Volume:</strong> {rescueResult.winningAlternative.availableQuantity.toLocaleString()} L available</div>
                    <div><strong>Est. Delivery Time:</strong> {rescueResult.winningAlternative.estimatedDeliveryMins} mins</div>
                    <div><strong>Logistics Cost:</strong> ₹{rescueResult.winningAlternative.transportCost.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Safe Reuse Gate Verification Checks */}
              {rescueResult.winningAlternative?.safeGate?.checks && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Safe Reuse Gate Audit Results
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    {rescueResult.winningAlternative.safeGate.checks.map((chk, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#475569' }}>{chk.name}:</span>
                        <span style={{ color: chk.passed ? '#059669' : '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {chk.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {chk.passed ? 'PASSED' : 'FAILED'} ({chk.observed})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waybill / Transit Dispatch Notice */}
              {rescueResult.routeReassignment && (
                <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#0f766e' }}>
                  <strong>Waybill Issued:</strong> #{rescueResult.routeReassignment.waybillNumber} · 
                  <span> Transporter: {rescueResult.routeReassignment.transporterFleet}</span> · 
                  <span> ETA: {rescueResult.routeReassignment.estimatedArrival}</span>
                </div>
              )}
            </div>
          )}

          {status === 'dispatched' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Emergency Tanker Dispatched!
              </h4>
              <p style={{ fontSize: '13.5px', color: '#475569', maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                EcoFlow logistics fleet has been mobilized. Dynamic GPS waypoints sent to driver terminal.
                Water supply will arrive with zero disruption to scheduled irrigation/facility demand.
              </p>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', display: 'inline-block', fontSize: '12.5px', color: '#334155' }}>
                Status: <strong>In Transit</strong> · GPS Corridor: <strong>Active Dynamic Routing</strong>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {status === 'idle' && (
            <>
              <button className="btn-cancel" onClick={onClose}>Close</button>
              <button 
                className="btn-primary" 
                style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={runRescueSimulation}
              >
                <Zap size={16} />
                Run Rescue Simulation
              </button>
            </>
          )}

          {status === 'evaluated' && (
            <>
              <button className="btn-cancel" onClick={() => setStatus('idle')}>Reset</button>
              {rescueResult?.winningAlternative ? (
                <button 
                  className="btn-primary" 
                  style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleConfirmDispatch}
                  disabled={loadingDispatch}
                >
                  <Truck size={16} />
                  {loadingDispatch ? 'Dispatching...' : 'Confirm Tanker Dispatch'}
                </button>
              ) : (
                <button className="btn-primary" onClick={onClose}>Acknowledge Alert</button>
              )}
            </>
          )}

          {status === 'dispatched' && (
            <button className="btn-primary" onClick={onClose} style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DemandMatchesModal({ isOpen, onClose, demand, onSelectSourceForRequest, onRequestWater }) {
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState(25);
  const [requestingSourceId, setRequestingSourceId] = useState(null);

  React.useEffect(() => {
    if (!isOpen || !demand) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/demands/${demand.id}/matches`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to evaluate matching sources.");
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setMatchData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [isOpen, demand]);

  // Support ESC key to close modal - Hook must be before any conditional early returns
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !demand) return null;

  const eligible = (matchData?.eligibleMatches || []).filter(m => {
    const category = (m.waterCategory || m.type || '').toLowerCase();
    const matchesCat = selectedCategory === 'All' || category.includes(selectedCategory.toLowerCase());
    const matchesDist = (m.distanceKm || 0) <= maxDistance;
    return matchesCat && matchesDist;
  });

  const categories = ['All', 'Treated Wastewater', 'Industrial', 'Greywater', 'RO Reject Water', 'Rainwater'];

  const handleSendRequest = async (candidate) => {
    try {
      setRequestingSourceId(candidate.sourceId);
      await onRequestWater(candidate, demand);
      onClose();
    } catch (err) {
      alert(`Error requesting water: ${err.message}`);
    } finally {
      setRequestingSourceId(null);
    }
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'hidden'
      }}
    >
      <div 
        className="modal-container demand-matches-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '850px', 
          width: '100%',
          maxHeight: 'min(640px, 88vh)', 
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          margin: 'auto',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-emerald-100 text-emerald-800">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="modal-title">Intelligent Water Matches for "{demand.title}"</h3>
              <p className="modal-subtitle">
                Target Demand: <strong>{(demand.quantity || demand.requiredQuantity || 0).toLocaleString()} L</strong> · Intended Reuse: <strong>{demand.purpose}</strong> · Location: <strong>{demand.deliveryLocation || "Chennai"}</strong>
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 24px' }}>
          {/* Quick Filters */}
          <div className="tab-filter-bar" style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div className="tab-category-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <label>Max Dist: <strong>{maxDistance} km</strong></label>
              <input
                type="range"
                min="2"
                max="30"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Partial Fulfillment Multi-Source Banner if applicable */}
          {matchData?.partialFulfillmentPlan && !matchData.partialFulfillmentPlan.hasSingleSourceFullFulfillment && (matchData.partialFulfillmentPlan.allocations || []).length > 1 && (
            <div className="partial-fulfillment-banner" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                <CheckCircle2 size={16} />
                <span>Multi-Supplier Partial Fulfillment Solution</span>
              </div>
              <p style={{ fontSize: '12px', color: '#047857', margin: 0 }}>
                A single supplier cannot cover 100% of this demand volume. The matching engine identified a combination of {(matchData.partialFulfillmentPlan.allocations || []).length} eligible suppliers capable of fulfilling {(matchData.partialFulfillmentPlan.coveredQuantity || 0).toLocaleString()} L:
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                {(matchData.partialFulfillmentPlan.allocations || []).map((a, idx) => (
                  <span key={a.sourceId || idx} style={{ background: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #6ee7b7', color: '#064e3b' }}>
                    #{idx + 1} {a.sourceName}: <strong>{(a.allocatedQuantity || 0).toLocaleString()} L</strong> ({a.distanceKm} km away)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div className="pulse-spinner" style={{ margin: '0 auto 12px' }}></div>
              <p style={{ fontWeight: 600 }}>Running Intelligent Matching Engine (CPCB Safety & Proximity Rules)...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px', color: '#b91c1c' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Error loading matching candidates: {error}</p>
            </div>
          )}

          {/* Eligible candidates list */}
          {!loading && !error && eligible.length > 0 && (
            <div className="matched-sources-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {eligible.map((candidate, idx) => (
                <div 
                  key={candidate.sourceId} 
                  className="matched-candidate-card"
                  style={{
                    background: '#fff',
                    border: idx === 0 ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  {idx === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ★ Ranked #1 Best Match
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                          {candidate.sourceName}
                        </h4>
                        <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                          {candidate.waterCategory}
                        </span>
                        <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} />
                          {candidate.qualityVerificationStatus}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Supplier: <strong>{candidate.supplierName}</strong> · Location: {candidate.location}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: candidate.matchScore >= 80 ? 'linear-gradient(135deg, #059669, #10b981)' : '#0284c7',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '15px',
                        padding: '4px 12px',
                        borderRadius: '20px'
                      }}>
                        {candidate.matchScore}% Match
                      </div>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', margin: '10px 0' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Available Capacity</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{candidate.availableQuantity.toLocaleString()} L</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Distance from Buyer</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{candidate.distanceKm} km</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Est. Logistics Fee</span>
                      <strong style={{ fontSize: '13px', color: '#059669' }}>₹{candidate.estimatedTransportCost || 950}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Demand Coverage</span>
                      <strong style={{ fontSize: '13px', color: candidate.isFullFulfillment ? '#059669' : '#d97706' }}>
                        {candidate.fulfillmentPercentage}% {candidate.isFullFulfillment ? '(Full)' : '(Partial)'}
                      </strong>
                    </div>
                  </div>

                  {/* Transparent Explanation Reasons */}
                  <div style={{ margin: '10px 0 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
                      Why This Source Matches:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(candidate.scoreFactors?.reasons || []).slice(0, 4).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      className="btn-primary"
                      disabled={requestingSourceId === candidate.sourceId}
                      onClick={() => handleSendRequest(candidate)}
                      style={{
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Droplet size={14} />
                      {requestingSourceId === candidate.sourceId ? "Sending Water Request..." : "Request Water Allocation"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state when no eligible candidates exist */}
          {!loading && !error && eligible.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#334155' }}>
                No Eligible Water Sources Found in Range
              </h4>
              <p style={{ margin: '0 auto 14px', maxWidth: '480px', fontSize: '13px', color: '#64748b' }}>
                ReLoop enforces strict CPCB safety and quality filters. No available water sources currently satisfy all mandatory eligibility criteria for <strong>{demand.purpose}</strong> within {maxDistance} km.
              </p>
              {matchData?.exclusionSummary && (
                <div style={{ display: 'inline-block', textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', color: '#475569' }}>
                  <strong>Safety Filter Exclusions:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                    {matchData.exclusionSummary.expiredQuality > 0 && (
                      <li>{matchData.exclusionSummary.expiredQuality} source(s) excluded due to expired water quality lab certificates.</li>
                    )}
                    {matchData.exclusionSummary.unverifiedQuality > 0 && (
                      <li>{matchData.exclusionSummary.unverifiedQuality} source(s) excluded awaiting official lab verification.</li>
                    )}
                    {matchData.exclusionSummary.incompatibleReuse > 0 && (
                      <li>{matchData.exclusionSummary.incompatibleReuse} source(s) excluded due to application incompatibility with {demand.purpose}.</li>
                    )}
                    {matchData.exclusionSummary.insufficientQuantity > 0 && (
                      <li>{matchData.exclusionSummary.insufficientQuantity} source(s) currently exhausted (0 L inventory).</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

