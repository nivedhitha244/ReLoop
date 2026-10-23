import React, { useState } from 'react';
import { 
  X, 
  Droplet, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Upload, 
  MapPin, 
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';

// ============================================================================
// 1. ADD WATER SOURCE MODAL (5-STEP WORKFLOW)
// ============================================================================
export function AddSourceModal({ isOpen, onClose, onSubmit, profile }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Basic Information
  const [name, setName] = useState('');
  const [type, setType] = useState('Treated Wastewater');
  const [description, setDescription] = useState('');
  const [ownerOrg, setOwnerOrg] = useState(profile?.organization || 'Apex Commercial Facilities Ltd.');
  const [contactPhone, setContactPhone] = useState(profile?.phone || '+91 98111 22334');

  // Step 2: Quantity & Availability
  const [totalQuantity, setTotalQuantity] = useState(10000);
  const [availableQuantity, setAvailableQuantity] = useState(8000);
  const [minSupply, setMinSupply] = useState(1000);
  const [maxSupply, setMaxSupply] = useState(10000);
  const [replenishmentSchedule, setReplenishmentSchedule] = useState('Daily continuous output (5,000 L/day)');
  const [availabilityStatus, setAvailabilityStatus] = useState('Available');

  // Step 3: Location
  const [address, setAddress] = useState(profile?.facilityAddress || 'Plot 14-B, OMR IT Expressway, Sholinganallur');
  const [city, setCity] = useState('Chennai');
  const [region, setRegion] = useState('Tamil Nadu');
  const [lat, setLat] = useState(12.9800);
  const [lng, setLng] = useState(80.2200);

  // Step 4: Water Quality & Intended Reuse
  const [ph, setPh] = useState(7.2);
  const [turbidity, setTurbidity] = useState('1.2 NTU');
  const [tds, setTds] = useState('420 ppm');
  const [bod, setBod] = useState('4.5 mg/L');
  const [cod, setCod] = useState('18 mg/L');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testingLab, setTestingLab] = useState('AquaCert Labs Quality Assurance');
  const [expiryDate, setExpiryDate] = useState('2027-04-30');
  const [uploadedFileName, setUploadedFileName] = useState('water_quality_test_report.pdf');
  const [selectedUses, setSelectedUses] = useState(['Landscaping', 'Construction', 'Toilet Flushing']);

  const allPossibleUses = [
    'Landscaping',
    'HVAC Cooling',
    'Construction',
    'Dust Suppression',
    'Toilet Flushing',
    'Industrial Cooling',
    'Concrete Curing',
    'Vehicle Washing'
  ];

  const handleToggleUse = (useTag) => {
    if (selectedUses.includes(useTag)) {
      setSelectedUses(selectedUses.filter(u => u !== useTag));
    } else {
      setSelectedUses([...selectedUses, useTag]);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter a descriptive Water Source Name.');
        return;
      }
    } else if (step === 2) {
      if (Number(totalQuantity) <= 0) {
        setError('Total registered quantity must be greater than 0.');
        return;
      }
      if (Number(availableQuantity) < 0) {
        setError('Available quantity cannot be negative.');
        return;
      }
      if (Number(availableQuantity) > Number(totalQuantity)) {
        setError('Available quantity cannot exceed the total registered quantity.');
        return;
      }
    } else if (step === 3) {
      if (!address.trim()) {
        setError('Please enter the facility or collection address.');
        return;
      }
    } else if (step === 4) {
      if (selectedUses.length === 0) {
        setError('Please select at least one intended non-drinking reuse category.');
        return;
      }
    }
    setStep(prev => Math.min(5, prev + 1));
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (isDraft = false) => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        category: type,
        description: description.trim() || `Treated water source registered by ${ownerOrg}.`,
        totalRegisteredQuantity: Number(totalQuantity),
        quantity: Number(availableQuantity),
        minSupply: Number(minSupply),
        maxSupply: Number(maxSupply),
        replenishmentSchedule,
        location: `${address}, ${city}, ${region}`,
        city,
        region,
        coordinates: [Number(lat), Number(lng)],
        intendedUses: selectedUses,
        availabilityStatus: availabilityStatus || 'Available',
        available: availabilityStatus === 'Available',
        labReport: {
          certId: `LAB-${Date.now().toString().slice(-6)}`,
          labName: testingLab,
          testDate,
          expiryDate,
          ph: Number(ph),
          turbidity,
          tds,
          bod,
          cod,
          status: isDraft ? 'Draft' : 'Verified',
          notes: `Uploaded documentation: ${uploadedFileName}`
        }
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit water source registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-container seller-add-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-wrap">
            <div className="modal-icon-bubble bg-teal-100 text-teal-700">
              <Droplet size={20} />
            </div>
            <div>
              <h2 className="modal-title">Add Water Source</h2>
              <p className="modal-subtitle">Step {step} of 5 — Complete registration & safety verification</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="modal-stepper-bar">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Quantity' },
            { num: 3, label: 'Location' },
            { num: 4, label: 'Quality' },
            { num: 5, label: 'Review' }
          ].map((s) => (
            <div 
              key={s.num} 
              className={`stepper-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {step > s.num ? <Check size={12} strokeWidth={3} /> : s.num}
              </div>
              <span className="step-name">{s.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="modal-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Body Content by Step */}
        <div className="modal-body-scrollable">
          {/* STEP 1: BASIC INFORMATION */}
          {step === 1 && (
            <div className="step-content-pane">
              <h3 className="step-section-heading">Facility & Water Category</h3>
              
              <div className="form-group-item">
                <label className="field-label">Water Source Name *</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="e.g. Apex Tech Park Tertiary STP Unit 2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <span className="field-hint">Give a clear facility or plant name recognizable to buyers.</span>
              </div>

              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="field-label">Water Type / Category *</label>
                  <select 
                    className="field-select" 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Treated Wastewater">Treated Wastewater (STP Effluent)</option>
                    <option value="Industrial">Industrial (Cooling Blowdown / Process)</option>
                    <option value="Greywater">Greywater (Commercial / Residential)</option>
                    <option value="RO Reject Water">RO Reject Water (High TDS Non-Hazardous)</option>
                    <option value="Rainwater">Rainwater (Harvested Retention Reservoir)</option>
                    <option value="Reclaimed Water">Reclaimed Ultra-Filtered Water</option>
                  </select>
                </div>

                <div className="form-group-item">
                  <label className="field-label">Owner / Operating Organization</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={ownerOrg}
                    onChange={(e) => setOwnerOrg(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="field-label">Facility Contact Phone</label>
                <input 
                  type="text" 
                  className="field-input" 
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div className="form-group-item">
                <label className="field-label">Source Description & Treatment Process</label>
                <textarea 
                  className="field-textarea" 
                  rows={3}
                  placeholder="Describe treatment technologies (e.g. Membrane Bioreactor, Sand Media, UV filtration) and recommended uses..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: QUANTITY & AVAILABILITY */}
          {step === 2 && (
            <div className="step-content-pane">
              <h3 className="step-section-heading">Quantity Capacity & Replenishment</h3>

              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="field-label">Total Registered Capacity (Litres) *</label>
                  <div className="input-with-unit">
                    <input 
                      type="number" 
                      className="field-input" 
                      min="100"
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(Number(e.target.value))}
                    />
                    <span className="unit-tag">L</span>
                  </div>
                  <span className="field-hint">Maximum water volume registered under this license.</span>
                </div>

                <div className="form-group-item">
                  <label className="field-label">Currently Available for Matching (Litres) *</label>
                  <div className="input-with-unit">
                    <input 
                      type="number" 
                      className="field-input" 
                      min="0"
                      max={totalQuantity}
                      value={availableQuantity}
                      onChange={(e) => setAvailableQuantity(Number(e.target.value))}
                    />
                    <span className="unit-tag">L</span>
                  </div>
                  <span className="field-hint">Unreserved inventory ready for buyer requests.</span>
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="field-label">Minimum Supply per Request (Litres)</label>
                  <div className="input-with-unit">
                    <input 
                      type="number" 
                      className="field-input" 
                      value={minSupply}
                      onChange={(e) => setMinSupply(Number(e.target.value))}
                    />
                    <span className="unit-tag">L</span>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="field-label">Maximum Supply per Request (Litres)</label>
                  <div className="input-with-unit">
                    <input 
                      type="number" 
                      className="field-input" 
                      value={maxSupply}
                      onChange={(e) => setMaxSupply(Number(e.target.value))}
                    />
                    <span className="unit-tag">L</span>
                  </div>
                </div>
              </div>

              <div className="form-group-item">
                <label className="field-label">Replenishment Schedule / Generation Rate</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="e.g. Daily continuous output (5,000 L/day) or Weekly batch"
                  value={replenishmentSchedule}
                  onChange={(e) => setReplenishmentSchedule(e.target.value)}
                />
              </div>

              <div className="form-group-item">
                <label className="field-label">Initial Availability Status</label>
                <select 
                  className="field-select"
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                >
                  <option value="Available">Available (Once Verified)</option>
                  <option value="Unavailable">Unavailable / Standby</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION */}
          {step === 3 && (
            <div className="step-content-pane">
              <h3 className="step-section-heading">Facility Location & Geocoding</h3>

              <div className="form-group-item">
                <label className="field-label">Facility Street Address *</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="e.g. Plot 14-B, OMR IT Expressway, Sholinganallur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="field-label">City</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group-item">
                  <label className="field-label">State / Region</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="field-label">Latitude</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    className="field-input" 
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                  />
                </div>

                <div className="form-group-item">
                  <label className="field-label">Longitude</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    className="field-input" 
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="location-presets-wrap">
                <span className="preset-label">Quick Location Presets:</span>
                <div className="preset-pill-list">
                  <button 
                    type="button" 
                    className="preset-btn"
                    onClick={() => { setAddress('Sholinganallur OMR IT Corridor'); setLat(12.9800); setLng(80.2200); }}
                  >
                    Sholinganallur (OMR)
                  </button>
                  <button 
                    type="button" 
                    className="preset-btn"
                    onClick={() => { setAddress('Ambattur Industrial Estate 3rd Cross'); setLat(13.0878); setLng(80.2785); }}
                  >
                    Ambattur Industrial Estate
                  </button>
                  <button 
                    type="button" 
                    className="preset-btn"
                    onClick={() => { setAddress('Guindy Industrial Corridor'); setLat(13.0067); setLng(80.2050); }}
                  >
                    Guindy Industrial Zone
                  </button>
                  <button 
                    type="button" 
                    className="preset-btn"
                    onClick={() => { setAddress('Perungudi Tech Zone'); setLat(12.9650); setLng(80.2420); }}
                  >
                    Perungudi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: WATER QUALITY & INTENDED REUSE */}
          {step === 4 && (
            <div className="step-content-pane">
              <h3 className="step-section-heading">Water Quality Parameters & Permitted Uses</h3>

              <div className="lab-params-grid">
                <div className="form-group-item">
                  <label className="field-label">pH Value</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="field-input" 
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                  />
                </div>

                <div className="form-group-item">
                  <label className="field-label">Turbidity</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={turbidity}
                    onChange={(e) => setTurbidity(e.target.value)}
                  />
                </div>

                <div className="form-group-item">
                  <label className="field-label">TDS (Total Dissolved Solids)</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={tds}
                    onChange={(e) => setTds(e.target.value)}
                  />
                </div>

                <div className="form-group-item">
                  <label className="field-label">BOD</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={bod}
                    onChange={(e) => setBod(e.target.value)}
                  />
                </div>

                <div className="form-group-item">
                  <label className="field-label">COD</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={cod}
                    onChange={(e) => setCod(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-group-item">
                  <label className="field-label">Testing Laboratory / Authority</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={testingLab}
                    onChange={(e) => setTestingLab(e.target.value)}
                  />
                </div>

                <div className="form-group-item">
                  <label className="field-label">Test Date</label>
                  <input 
                    type="date" 
                    className="field-input" 
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-item">
                <label className="field-label">Certificate Expiry Date</label>
                <input 
                  type="date" 
                  className="field-input" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              {/* Upload Certificate Widget */}
              <div className="form-group-item">
                <label className="field-label">Quality Certificate / Lab Report (PDF / Image)</label>
                <div className="file-upload-dropzone">
                  <Upload size={24} className="text-emerald-600 mb-2" />
                  <span className="upload-title">{uploadedFileName}</span>
                  <span className="upload-sub">NABL Accredited Lab Certificate (1.2 MB)</span>
                  <span className="upload-note text-emerald-700 font-semibold text-xs mt-1">Ready for submission to Verifier Portal</span>
                </div>
              </div>

              {/* Intended Reuse Categories */}
              <div className="form-group-item">
                <label className="field-label">Intended Non-Drinking Reuse Categories *</label>
                <div className="reuse-tags-selector">
                  {allPossibleUses.map((use) => {
                    const isSelected = selectedUses.includes(use);
                    return (
                      <button
                        key={use}
                        type="button"
                        className={`reuse-tag-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleUse(use)}
                      >
                        {isSelected && <Check size={13} className="mr-1" />}
                        <span>{use}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="step-content-pane">
              <h3 className="step-section-heading">Registration Summary & Submission</h3>

              <div className="review-summary-box">
                <div className="summary-item-row">
                  <span className="summary-label">Source Name:</span>
                  <span className="summary-value font-bold">{name}</span>
                </div>

                <div className="summary-item-row">
                  <span className="summary-label">Category:</span>
                  <span className="summary-value">{type}</span>
                </div>

                <div className="summary-item-row">
                  <span className="summary-label">Registered Total Capacity:</span>
                  <span className="summary-value font-bold text-emerald-700">{totalQuantity.toLocaleString()} L</span>
                </div>

                <div className="summary-item-row">
                  <span className="summary-label">Initially Available:</span>
                  <span className="summary-value font-bold text-blue-700">{availableQuantity.toLocaleString()} L</span>
                </div>

                <div className="summary-item-row">
                  <span className="summary-label">Facility Location:</span>
                  <span className="summary-value">{address}, {city}</span>
                </div>

                <div className="summary-item-row">
                  <span className="summary-label">Lab Tester:</span>
                  <span className="summary-value">{testingLab} ({testDate})</span>
                </div>

                <div className="summary-item-row">
                  <span className="summary-label">Water Quality Parameters:</span>
                  <span className="summary-value">pH {ph} · Turbidity {turbidity} · TDS {tds}</span>
                </div>

                <div className="summary-item-row">
                  <span className="summary-label">Intended Reuses:</span>
                  <span className="summary-value">{selectedUses.join(', ')}</span>
                </div>
              </div>

              <div className="verification-notice-alert">
                <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                <div className="notice-text">
                  <strong>Verification & Safety Governance:</strong> Once submitted, this water source will be assigned to the Verifier portal for quality compliance review. It will become active for matching as soon as certification is confirmed.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer-row">
          {step > 1 ? (
            <button 
              type="button" 
              className="btn-modal-back" 
              onClick={handlePrev}
              disabled={submitting}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <button 
              type="button" 
              className="btn-modal-cancel" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          )}

          <div className="footer-right-buttons">
            {step === 5 && (
              <button 
                type="button" 
                className="btn-modal-draft"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
              >
                Save as Draft
              </button>
            )}

            {step < 5 ? (
              <button 
                type="button" 
                className="btn-modal-next" 
                onClick={handleNext}
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-modal-submit" 
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                <ShieldCheck size={16} />
                <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ACCEPT BUYER REQUEST CONFIRMATION MODAL
// ============================================================================
export function AcceptRequestModal({ isOpen, onClose, request, source, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !request) return null;

  const handleConfirmAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(request.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to accept request.');
    } finally {
      setLoading(false);
    }
  };

  const isLowInventory = source && source.quantity < request.requestedQuantity;

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-container confirmation-dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-wrap">
            <div className="modal-icon-bubble bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="modal-title">Accept Buyer Request</h2>
              <p className="modal-subtitle">Allocate water inventory and schedule delivery</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body-scrollable">
          <div className="confirm-details-card">
            <div className="confirm-row">
              <span className="c-label">Buyer Organization:</span>
              <span className="c-val font-bold">{request.buyerOrg || request.buyerName}</span>
            </div>
            <div className="confirm-row">
              <span className="c-label">Requested Source:</span>
              <span className="c-val">{request.sourceName}</span>
            </div>
            <div className="confirm-row">
              <span className="c-label">Requested Volume:</span>
              <span className="c-val font-bold text-emerald-700">{request.requestedQuantity.toLocaleString()} L</span>
            </div>
            <div className="confirm-row">
              <span className="c-label">Intended Non-Potable Use:</span>
              <span className="c-val">{request.intendedReuse}</span>
            </div>
            <div className="confirm-row">
              <span className="c-label">Delivery Address:</span>
              <span className="c-val">{request.deliveryLocation}</span>
            </div>
            <div className="confirm-row">
              <span className="c-label">Requested Date & Window:</span>
              <span className="c-val">{request.requestedDate} ({request.timeWindow || 'Morning'})</span>
            </div>
            <div className="confirm-row">
              <span className="c-label">Water Suitability:</span>
              <span className="c-val text-emerald-700 font-semibold">{request.suitabilityStatus || 'Verified & Safe'}</span>
            </div>
          </div>

          {source && (
            <div className="inventory-impact-box">
              <div className="inv-row">
                <span>Current Source Available Volume:</span>
                <strong>{source.quantity.toLocaleString()} L</strong>
              </div>
              <div className="inv-row">
                <span>After Request Allocation:</span>
                <strong className={isLowInventory ? 'text-red-600' : 'text-emerald-700'}>
                  {Math.max(0, source.quantity - request.requestedQuantity).toLocaleString()} L
                </strong>
              </div>
            </div>
          )}

          {isLowInventory && (
            <div className="modal-error-banner">
              <AlertTriangle size={16} />
              <span>Insufficient inventory: Available volume is lower than requested.</span>
            </div>
          )}
        </div>

        <div className="modal-footer-row">
          <button className="btn-modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn-modal-submit" 
            onClick={handleConfirmAccept} 
            disabled={loading || isLowInventory}
          >
            {loading ? 'Allocating...' : 'Confirm & Schedule Fulfillment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. REJECT BUYER REQUEST MODAL (REASON REQUIRED)
// ============================================================================
export function RejectRequestModal({ isOpen, onClose, request, onConfirm }) {
  const [reason, setReason] = useState('Insufficient available quantity');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !request) return null;

  const handleConfirmReject = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(request.id, reason, notes);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reject request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-container confirmation-dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-wrap">
            <div className="modal-icon-bubble bg-amber-100 text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="modal-title">Decline Buyer Request</h2>
              <p className="modal-subtitle">Specify reason to notify buyer and facilitate re-matching</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body-scrollable">
          <p className="reject-intro-text">
            You are declining request <strong>#{request.id}</strong> from <strong>{request.buyerName}</strong> for <strong>{request.requestedQuantity.toLocaleString()} L</strong>.
          </p>

          <div className="form-group-item">
            <label className="field-label">Reason for Declining *</label>
            <select 
              className="field-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Insufficient available quantity">Insufficient available quantity</option>
              <option value="Water source currently unavailable or under maintenance">Water source currently unavailable or under maintenance</option>
              <option value="Scheduling or delivery window conflict">Scheduling or delivery window conflict</option>
              <option value="Water quality unsuitable for requested reuse category">Water quality unsuitable for requested reuse category</option>
              <option value="Outside delivery radius or logistics limitation">Outside delivery radius or logistics limitation</option>
              <option value="Other administrative reason">Other administrative reason</option>
            </select>
          </div>

          <div className="form-group-item">
            <label className="field-label">Additional Explanation (Shared with Buyer)</label>
            <textarea 
              className="field-textarea"
              rows={3}
              placeholder="Provide context or suggest when supply might next be available..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer-row">
          <button className="btn-modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn-modal-reject" 
            onClick={handleConfirmReject}
            disabled={loading}
          >
            {loading ? 'Declining...' : 'Decline Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. SOURCE DETAILS MODAL
// ============================================================================
export function SourceDetailsModal({ isOpen, onClose, source, onEdit, onToggleAvailability }) {
  if (!isOpen || !source) return null;

  const lab = source.labReport || {};

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-container source-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-wrap">
            <div className="modal-icon-bubble bg-teal-100 text-teal-700">
              <Droplet size={20} />
            </div>
            <div>
              <h2 className="modal-title">{source.name}</h2>
              <span className={`quality-badge badge-${(source.verificationStatus || 'Verified').toLowerCase().replace(/\s+/g, '-')}`}>
                {source.verificationStatus || 'Verified'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div className="detail-meta-grid">
            <div className="meta-card-box">
              <span className="box-label">Available Inventory</span>
              <span className="box-val text-emerald-700">{source.quantity.toLocaleString()} L</span>
              <span className="box-sub">of {source.totalRegisteredQuantity?.toLocaleString() || source.quantity.toLocaleString()} L registered</span>
            </div>

            <div className="meta-card-box">
              <span className="box-label">Water Category</span>
              <span className="box-val">{source.type}</span>
              <span className="box-sub">{source.replenishmentSchedule || 'Daily Output'}</span>
            </div>

            <div className="meta-card-box">
              <span className="box-label">Availability</span>
              <span className={`box-val ${source.available ? 'text-emerald-700' : 'text-amber-700'}`}>
                {source.availabilityStatus || (source.available ? 'Available' : 'Unavailable')}
              </span>
              <span className="box-sub">Updated {source.lastUpdated || 'Recently'}</span>
            </div>

            <div className="meta-card-box">
              <span className="box-label">Lab Audit Status</span>
              <span className="box-val">{source.reportExpiry || 'Valid'}</span>
              <span className="box-sub">{lab.labName || 'NABL Certified'}</span>
            </div>
          </div>

          <div className="detail-section-block">
            <h4 className="detail-section-title">Facility Location & Coordinates</h4>
            <p className="detail-address-text">
              <MapPin size={16} className="text-emerald-600 inline mr-1" />
              {source.location}
            </p>
            <div className="coordinates-badge">
              GPS: {source.coordinates ? `${source.coordinates[0].toFixed(4)}, ${source.coordinates[1].toFixed(4)}` : '12.9800, 80.2200'}
            </div>
          </div>

          <div className="detail-section-block">
            <h4 className="detail-section-title">Lab Measured Water Quality Parameters</h4>
            <div className="param-pills-row">
              <div className="param-pill">
                <span className="param-k">pH</span>
                <span className="param-v">{lab.ph || 7.2}</span>
              </div>
              <div className="param-pill">
                <span className="param-k">Turbidity</span>
                <span className="param-v">{lab.turbidity || '1.1 NTU'}</span>
              </div>
              <div className="param-pill">
                <span className="param-k">TDS</span>
                <span className="param-v">{lab.tds || '410 ppm'}</span>
              </div>
              <div className="param-pill">
                <span className="param-k">BOD</span>
                <span className="param-v">{lab.bod || '4.2 mg/L'}</span>
              </div>
              <div className="param-pill">
                <span className="param-k">COD</span>
                <span className="param-v">{lab.cod || '18 mg/L'}</span>
              </div>
            </div>
            {lab.notes && (
              <p className="lab-notes-italic mt-2 text-xs text-slate-600 dark:text-slate-400">
                Audit Notes: {lab.notes}
              </p>
            )}
          </div>

          <div className="detail-section-block">
            <h4 className="detail-section-title">Permitted Intended Reuses</h4>
            <div className="reuse-tags-list">
              {(source.intendedUses || ['Landscaping', 'Construction']).map((use) => (
                <span key={use} className="reuse-tag-badge">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>{use}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer-row">
          <button 
            type="button" 
            className="btn-modal-cancel"
            onClick={() => onToggleAvailability(source.id, !source.available)}
          >
            {source.available ? 'Set as Unavailable' : 'Set as Available'}
          </button>
          <button 
            type="button" 
            className="btn-modal-submit"
            onClick={() => {
              onClose();
              if (onEdit) onEdit(source);
            }}
          >
            Edit Source Information
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. QUICK QUANTITY UPDATE MODAL
// ============================================================================
export function QuickQuantityModal({ isOpen, onClose, source, onUpdate }) {
  const [qty, setQty] = useState(source?.quantity || 5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !source) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUpdate(source.id, Number(qty));
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update quantity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-container confirmation-dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-wrap">
            <div className="modal-icon-bubble bg-teal-100 text-teal-700">
              <Droplet size={20} />
            </div>
            <div>
              <h2 className="modal-title">Update Available Quantity</h2>
              <p className="modal-subtitle">{source.name}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body-scrollable">
          <div className="form-group-item">
            <label className="field-label">Available Inventory (Litres) *</label>
            <div className="input-with-unit">
              <input 
                type="number"
                className="field-input"
                min="0"
                max={source.totalRegisteredQuantity || 100000}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                autoFocus
              />
              <span className="unit-tag">L</span>
            </div>
            <span className="field-hint">
              Max registered capacity: {source.totalRegisteredQuantity?.toLocaleString() || source.quantity?.toLocaleString()} L
            </span>
          </div>
        </div>

        <div className="modal-footer-row">
          <button className="btn-modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-modal-submit" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Update Quantity'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. RELOOP RESCUE MODAL FOR SELLER (INTELLIGENT ALTERNATIVE RECOVERY)
// ============================================================================
export function SellerRescueModal({ isOpen, onClose, sources, onTriggerRescue }) {
  const [selectedSourceId, setSelectedSourceId] = useState(sources?.[0]?.id || '');
  const [reason, setReason] = useState('Treatment pump maintenance & temporary offline');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onTriggerRescue(selectedSourceId, reason);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Rescue failover failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-container confirmation-dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div className="modal-title-wrap">
            <div className="modal-icon-bubble bg-teal-100 text-teal-800">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="modal-title">ReLoop Rescue™ Failover</h2>
              <p className="modal-subtitle">Intelligent alternative water recovery protocol</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body-scrollable">
          {!result ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                When a water source encounters an unexpected capacity drop, quality alert, or mechanical maintenance, <strong>ReLoop Rescue™</strong> immediately safeguards downstream buyers by suspending the affected supply and identifying verified platform alternatives.
              </p>

              <div className="form-group-item">
                <label className="field-label">Affected Water Source *</label>
                <select 
                  className="field-select"
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                >
                  {(sources || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.quantity.toLocaleString()} L available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-item">
                <label className="field-label">Reason for Emergency Protocol *</label>
                <select 
                  className="field-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="Treatment pump maintenance & temporary offline">Treatment pump maintenance & temporary offline</option>
                  <option value="Temporary parameter variance (turbidity / TDS)">Temporary parameter variance (turbidity / TDS)</option>
                  <option value="Quality certificate audit renewal in progress">Quality certificate audit renewal in progress</option>
                  <option value="Power outage affecting chlorination / UV unit">Power outage affecting chlorination / UV unit</option>
                  <option value="Depleted holding tank capacity">Depleted holding tank capacity</option>
                </select>
              </div>
            </>
          ) : (
            <div className="rescue-result-box">
              <div className="result-header text-emerald-700 font-bold flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} />
                <span>Protocol Executed Successfully</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                <strong>{result.affectedSource?.name}</strong> has been safely suspended from active matching.
              </p>
              {result.recommendedAlternative && (
                <div className="recommended-alt-card p-3 rounded-xl bg-teal-50 border border-teal-200">
                  <span className="text-xs uppercase font-bold text-teal-800 tracking-wider">Identified Backup Alternative:</span>
                  <div className="text-sm font-bold text-slate-800 mt-1">{result.recommendedAlternative.name}</div>
                  <div className="text-xs text-slate-600">Available: {result.recommendedAlternative.quantity?.toLocaleString()} L · Verified Safe</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer-row">
          <button className="btn-modal-cancel" onClick={onClose} disabled={loading}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button className="btn-modal-submit" onClick={handleExecute} disabled={loading}>
              {loading ? 'Activating Protocol...' : 'Activate ReLoop Rescue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
