import React, { useState } from 'react';
import { 
  FlaskConical, 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  FileCheck2, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ChevronRight, 
  Building, 
  Phone, 
  Wallet, 
  ArrowRight, 
  LifeBuoy, 
  Calendar, 
  Layers, 
  Info,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

// ============================================================================
// 1. LAB OPERATIONS HUB / OVERVIEW TAB
// ============================================================================
export function VerifierOverviewTab({ 
  stats, 
  queue = [], 
  certificates = [], 
  onNavigateTab, 
  onOpenPayoutModal, 
  onSelectForAudit, 
  onViewCert 
}) {
  const pendingQueue = queue.filter(q => q.status !== 'Approved' && q.status !== 'Rejected');

  return (
    <div className="verifier-tab-content">
      {/* Accreditation Hero Banner */}
      <div className="verifier-hero-banner">
        <div className="banner-badge-group">
          <Award size={16} className="text-cyan-300" />
          <span>CENTRAL POLLUTION CONTROL BOARD (CPCB) ACCREDITED AUDIT GATEWAY</span>
        </div>
        <div className="verifier-hero-grid">
          <div className="hero-text-side">
            <h2>Water Quality Assurance & Safety Gate Engine</h2>
            <p>
              In RELOOP 2.0, water safety is non-negotiable. Before water from STPs, greywater plants, or rainwater reservoirs 
              can be matched with buyers, our laboratory certifies critical chemical and microbial parameters against national reuse standards.
            </p>
          </div>
          <div className="hero-stat-badges">
            <div className="hero-stat-pill">
              <span className="h-lbl">Lab Accreditations</span>
              <strong className="h-val">NABL-TC-8894 • ISO 17025</strong>
            </div>
            <div className="hero-stat-pill">
              <span className="h-lbl">Safety Gate Pass Rate</span>
              <strong className="h-val text-cyan-400">87.2% Certified Safe</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="dashboard-columns-grid">
        {/* Left Column: Urgent Inspection Queue */}
        <div className="content-card">
          <div className="content-card-header">
            <div className="header-title-lockup">
              <FlaskConical size={18} className="text-cyan-500" />
              <h3>Pending Water Sample Inspections</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('queue')}>
              <span>View Queue ({pendingQueue.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="queue-mini-list">
            {pendingQueue.slice(0, 3).map((item) => (
              <div key={item.id} className="queue-mini-card">
                <div className="queue-mini-header">
                  <span className="queue-source-title">{item.sourceName}</span>
                  <span className={`urgency-pill ${item.testUrgency?.includes('High') ? 'urgent' : ''}`}>
                    {item.testUrgency}
                  </span>
                </div>
                <div className="queue-mini-meta">
                  <span>{item.waterCategory} • {item.quantityLitres?.toLocaleString('en-IN')} L/day</span>
                  <span className="text-slate-500">{item.facilityAddress}</span>
                </div>
                <div className="queue-mini-action">
                  <span className="fee-tag">Standard Fee: ₹{item.standardFee?.toLocaleString('en-IN')}</span>
                  <button 
                    className="btn-action-primary"
                    onClick={() => { onSelectForAudit(item); onNavigateTab('audit-testing'); }}
                  >
                    <FileCheck2 size={14} />
                    <span>Audit Sample</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Audit Earnings & Payment Received */}
        <div className="content-card">
          <div className="content-card-header">
            <div className="header-title-lockup">
              <Wallet size={18} className="text-teal-500" />
              <h3>Audit Fees & Cleared Wallet</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('payments')}>
              <span>Fee Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="wallet-mini-card">
            <div className="wallet-balances-row verifier-bal-row">
              <div className="balance-block">
                <span className="bal-label">AVAILABLE AUDIT EARNINGS</span>
                <h2 className="bal-amount text-cyan-600">₹{(stats?.availableBalance || 32500).toLocaleString('en-IN')}</h2>
                <span className="bal-sub text-cyan-700">Ready for instant settlement</span>
              </div>
              <div className="balance-block">
                <span className="bal-label">IN-CLEARING ESCROW</span>
                <h3 className="bal-amount-secondary text-teal-600">₹{(stats?.escrowBalance || 5000).toLocaleString('en-IN')}</h3>
                <span className="bal-sub">Auto-releases upon certification</span>
              </div>
            </div>

            <div className="payout-channels-snapshot">
              <span className="channels-title">Configured Payout Methods:</span>
              <div className="channel-pill">
                <Building size={14} />
                <span>SBI Corporate Current (A/C ...0283)</span>
              </div>
              <div className="channel-pill">
                <Phone size={14} />
                <span>UPI: aquacertlabs@oksbi</span>
              </div>
            </div>

            <button className="btn-withdraw-full verifier-btn-withdraw" onClick={onOpenPayoutModal}>
              <Wallet size={16} />
              <span>Withdraw Audit Fees to Corporate Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. INSPECTION SAMPLE QUEUE TAB
// ============================================================================
export function VerificationQueueTab({ queue = [], onSelectForAudit, onNavigateTab }) {
  const [filter, setFilter] = useState('all');

  const filteredQueue = queue.filter(item => {
    if (filter === 'pending' && (item.status === 'Approved' || item.status === 'Rejected')) return false;
    if (filter === 'completed' && item.status !== 'Approved' && item.status !== 'Rejected') return false;
    return true;
  });

  return (
    <div className="verifier-tab-content">
      <div className="section-header-row">
        <div>
          <h3>Water Testing Sample Queue</h3>
          <p>Laboratory intake queue for source verification, periodic re-testing, and ReLoop Rescue priority checks.</p>
        </div>
        <div className="filter-chips">
          <button 
            className={`chip-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Samples ({queue.length})
          </button>
          <button 
            className={`chip-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending Lab Testing ({queue.filter(q => q.status !== 'Approved' && q.status !== 'Rejected').length})
          </button>
          <button 
            className={`chip-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Tested & Closed ({queue.filter(q => q.status === 'Approved' || q.status === 'Rejected').length})
          </button>
        </div>
      </div>

      <div className="queue-full-grid">
        {filteredQueue.map(item => (
          <div key={item.id} className="queue-card-item">
            <div className="queue-card-top">
              <div className="queue-source-title">{item.sourceName}</div>
              <span className={`urgency-pill ${item.testUrgency?.includes('High') ? 'urgent' : ''}`}>
                {item.testUrgency}
              </span>
            </div>

            <div className="queue-supplier-box">
              <span className="sup-label">SUPPLIER FACILITY</span>
              <strong className="sup-name">{item.supplierName}</strong>
              <p className="sup-address">{item.facilityAddress}</p>
            </div>

            <div className="queue-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Water Category</span>
                <strong className="spec-value">{item.waterCategory}</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Registered Capacity</span>
                <strong className="spec-value">{item.quantityLitres?.toLocaleString('en-IN')} L/day</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Target Reuse</span>
                <strong className="spec-value">{item.recommendedUse}</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Lab Audit Fee</span>
                <strong className="spec-value text-emerald-600">₹{item.standardFee?.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="queue-card-actions">
              {item.status === 'Approved' ? (
                <div className="completed-verified-pill">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Approved & Certified ({item.certificateNumber})</span>
                </div>
              ) : item.status === 'Rejected' ? (
                <div className="rejected-blocked-pill">
                  <ShieldAlert size={14} className="text-rose-500" />
                  <span>Rejected & Source Blocked</span>
                </div>
              ) : (
                <button 
                  className="btn-action-primary w-full"
                  onClick={() => { onSelectForAudit(item); onNavigateTab('audit-testing'); }}
                >
                  <FlaskConical size={14} />
                  <span>Launch Safety Gate Testing</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. DIGITAL LAB TESTING & SAFETY GATE CERTIFICATION TAB
// ============================================================================
export function LabTestingSafetyGateTab({ 
  selectedSource, 
  queue = [], 
  onSubmitAudit, 
  onViewCert 
}) {
  const [activeItem, setActiveItem] = useState(selectedSource || queue[0] || {
    id: "src-new-101",
    sourceName: "Velachery IT Corridor Greywater Plant",
    waterCategory: "Commercial Greywater",
    facilityAddress: "Velachery Main Road, Chennai",
    quantityLitres: 8000
  });

  // Test parameters state
  const [ph, setPh] = useState(7.2);
  const [turbidity, setTurbidity] = useState(1.4);
  const [tds, setTds] = useState(410);
  const [bod, setBod] = useState(4.2);
  const [cod, setCod] = useState(16);
  const [eColi, setEColi] = useState(0);
  const [chlorine, setChlorine] = useState(1.2);
  const [odor, setOdor] = useState('Unobjectionable');

  // Intended reuse suitability checkboxes
  const [reuseLandscaping, setReuseLandscaping] = useState(true);
  const [reuseConstruction, setReuseConstruction] = useState(true);
  const [reuseCooling, setReuseCooling] = useState(false);
  const [reuseToilet, setReuseToilet] = useState(true);

  // Review remarks
  const [notes, setNotes] = useState('CPCB wastewater criteria fulfilled for industrial and urban non-potable re-use.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Parameter Verification checks
  const isPhValid = ph >= 6.5 && ph <= 8.5;
  const isTurbidityValid = turbidity <= 5.0;
  const isTdsValid = tds <= 1000;
  const isBodValid = bod <= 30;
  const isCodValid = cod <= 100;
  const isColiValid = eColi === 0;

  const allPassed = isPhValid && isTurbidityValid && isTdsValid && isBodValid && isCodValid && isColiValid;

  const handleDecision = async (decision) => {
    if (decision === 'Rejected' && !rejectionReason.trim()) {
      setShowRejectionInput(true);
      alert('Please enter a mandatory reason for blocking this water source.');
      return;
    }

    const intendedUses = [];
    if (reuseLandscaping) intendedUses.push('Landscaping');
    if (reuseConstruction) intendedUses.push('Construction');
    if (reuseCooling) intendedUses.push('Cooling Towers');
    if (reuseToilet) intendedUses.push('Toilet Flushing');

    setIsSubmitting(true);
    try {
      await onSubmitAudit(activeItem.id || activeItem.sourceId, {
        sourceName: activeItem.sourceName,
        waterCategory: activeItem.waterCategory,
        decision,
        parameters: {
          ph: Number(ph),
          turbidity: `${turbidity} NTU`,
          tds: `${tds} ppm`,
          bod: `${bod} mg/L`,
          cod: `${cod} mg/L`,
          eColi: `${eColi} CFU/100mL`,
          chlorine: `${chlorine} mg/L`,
          odor
        },
        intendedUses,
        notes,
        rejectionReason: decision === 'Rejected' ? rejectionReason : null,
        fee: activeItem.standardFee || 2500
      });
    } catch (err) {
      alert(err.message || 'Audit submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="verifier-tab-content">
      {/* Source Selector Bar */}
      <div className="testing-source-selector">
        <label>Selected Water Sample for Quality Safety Gate:</label>
        <select 
          value={activeItem?.id} 
          onChange={(e) => {
            const found = queue.find(q => q.id === e.target.value);
            if (found) setActiveItem(found);
          }}
        >
          {queue.map(q => (
            <option key={q.id} value={q.id}>
              {q.sourceName} — ({q.waterCategory})
            </option>
          ))}
        </select>
      </div>

      <div className="testing-workspace-grid">
        {/* Left Column: Parameter Testing Inputs */}
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Laboratory Parameter Analysis</h3>
              <p className="text-slate-500 text-sm">Input spectrophotometric & microbial test results against CPCB reuse limits.</p>
            </div>
            <span className={`compliance-status-pill ${allPassed ? 'pass' : 'fail'}`}>
              {allPassed ? '✓ All Parameters Within Bounds' : '⚠️ Parameter Threshold Exceeded'}
            </span>
          </div>

          <div className="parameter-inputs-grid">
            {/* pH */}
            <div className={`param-card ${isPhValid ? 'valid' : 'invalid'}`}>
              <div className="param-header">
                <strong>pH Level</strong>
                <span className="param-limit">Limit: 6.5 – 8.5</span>
              </div>
              <div className="param-input-wrap">
                <input 
                  type="number" 
                  step="0.1" 
                  value={ph} 
                  onChange={(e) => setPh(Number(e.target.value))} 
                />
                <span className="unit">pH</span>
              </div>
              <span className="param-verdict">{isPhValid ? '✓ Optimal Range' : '✗ Acidic / Alkaline Risk'}</span>
            </div>

            {/* Turbidity */}
            <div className={`param-card ${isTurbidityValid ? 'valid' : 'invalid'}`}>
              <div className="param-header">
                <strong>Turbidity</strong>
                <span className="param-limit">Limit: &lt; 5.0 NTU</span>
              </div>
              <div className="param-input-wrap">
                <input 
                  type="number" 
                  step="0.1" 
                  value={turbidity} 
                  onChange={(e) => setTurbidity(Number(e.target.value))} 
                />
                <span className="unit">NTU</span>
              </div>
              <span className="param-verdict">{isTurbidityValid ? '✓ Clear Liquid' : '✗ Excessive Suspended Solids'}</span>
            </div>

            {/* TDS */}
            <div className={`param-card ${isTdsValid ? 'valid' : 'invalid'}`}>
              <div className="param-header">
                <strong>TDS (Dissolved Solids)</strong>
                <span className="param-limit">Limit: &lt; 1,000 ppm</span>
              </div>
              <div className="param-input-wrap">
                <input 
                  type="number" 
                  value={tds} 
                  onChange={(e) => setTds(Number(e.target.value))} 
                />
                <span className="unit">ppm</span>
              </div>
              <span className="param-verdict">{isTdsValid ? '✓ Non-corrosive Salinity' : '✗ High Salinity'}</span>
            </div>

            {/* BOD */}
            <div className={`param-card ${isBodValid ? 'valid' : 'invalid'}`}>
              <div className="param-header">
                <strong>BOD (5-Day 20°C)</strong>
                <span className="param-limit">Limit: &lt; 30 mg/L</span>
              </div>
              <div className="param-input-wrap">
                <input 
                  type="number" 
                  step="0.1" 
                  value={bod} 
                  onChange={(e) => setBod(Number(e.target.value))} 
                />
                <span className="unit">mg/L</span>
              </div>
              <span className="param-verdict">{isBodValid ? '✓ Low Organic Matter' : '✗ Biological Hazard'}</span>
            </div>

            {/* COD */}
            <div className={`param-card ${isCodValid ? 'valid' : 'invalid'}`}>
              <div className="param-header">
                <strong>COD (Chemical Oxygen)</strong>
                <span className="param-limit">Limit: &lt; 100 mg/L</span>
              </div>
              <div className="param-input-wrap">
                <input 
                  type="number" 
                  value={cod} 
                  onChange={(e) => setCod(Number(e.target.value))} 
                />
                <span className="unit">mg/L</span>
              </div>
              <span className="param-verdict">{isCodValid ? '✓ Chemical Safety Cleared' : '✗ Chemical Toxicity'}</span>
            </div>

            {/* E. Coli */}
            <div className={`param-card ${isColiValid ? 'valid' : 'invalid'}`}>
              <div className="param-header">
                <strong>Total Coliform / E. Coli</strong>
                <span className="param-limit">Limit: 0 CFU</span>
              </div>
              <div className="param-input-wrap">
                <input 
                  type="number" 
                  value={eColi} 
                  onChange={(e) => setEColi(Number(e.target.value))} 
                />
                <span className="unit">CFU/100mL</span>
              </div>
              <span className="param-verdict">{isColiValid ? '✓ Pathogen Free' : '✗ Microbial Contamination'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Safety Gate Decision & Intended Reuse Matrix */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Safety Gate Decision Engine</h3>
          </div>

          <div className="reuse-suitability-section">
            <label className="section-title">Permitted Non-Drinking Reuse Purposes:</label>
            <div className="checkbox-options-grid">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={reuseLandscaping} 
                  onChange={(e) => setReuseLandscaping(e.target.checked)} 
                />
                <span>Landscaping & Parks</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={reuseConstruction} 
                  onChange={(e) => setReuseConstruction(e.target.checked)} 
                />
                <span>Construction & Dust Control</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={reuseCooling} 
                  onChange={(e) => setReuseCooling(e.target.checked)} 
                />
                <span>HVAC Cooling Towers</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={reuseToilet} 
                  onChange={(e) => setReuseToilet(e.target.checked)} 
                />
                <span>Toilet Flushing & Sanitation</span>
              </label>
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Auditor Notes & Methodology</label>
            <textarea 
              rows={2} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>

          {showRejectionInput && (
            <div className="form-group mt-3 rejection-box">
              <label className="text-rose-600 font-bold">Mandatory Unsafe Reason (Triggers ReLoop Rescue!):</label>
              <input 
                type="text" 
                placeholder="e.g. Coliform count exceeds CPCB safety limits; poses microbial hazard."
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                required
              />
            </div>
          )}

          {/* Action Decision Buttons */}
          <div className="safety-gate-buttons-stack mt-5">
            <button 
              className="btn-approve-gate"
              disabled={isSubmitting}
              onClick={() => handleDecision('Approved')}
            >
              <CheckCircle2 size={16} />
              <span>APPROVE & ISSUE WATER QUALITY CERTIFICATE</span>
            </button>

            <button 
              className="btn-reject-gate"
              disabled={isSubmitting}
              onClick={() => {
                if (!showRejectionInput) {
                  setShowRejectionInput(true);
                } else {
                  handleDecision('Rejected');
                }
              }}
            >
              <ShieldAlert size={16} />
              <span>REJECT & BLOCK SOURCE (TRIGGER RELOOP RESCUE)</span>
            </button>

            <button 
              className="btn-resample-gate"
              disabled={isSubmitting}
              onClick={() => handleDecision('Needs Re-test')}
            >
              <LifeBuoy size={16} />
              <span>REQUEST RE-SAMPLING / RE-TEST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. CERTIFIED SOURCES REGISTRY TAB
// ============================================================================
export function CertifiedSourcesRegistryTab({ certificates = [], onViewCert }) {
  const [search, setSearch] = useState('');

  const filteredCerts = certificates.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = (c.sourceName || '').toLowerCase().includes(q);
      const matchNum = (c.reportNumber || c.certificateNumber || '').toLowerCase().includes(q);
      if (!matchName && !matchNum) return false;
    }
    return true;
  });

  return (
    <div className="verifier-tab-content">
      <div className="section-header-row">
        <div>
          <h3>Water Quality Certified Sources Registry</h3>
          <p>Official repository of all CPCB-cleared water facilities, validity expiries, and lab certificates.</p>
        </div>
        <input 
          type="text" 
          placeholder="Search by facility name or certificate #..." 
          className="table-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="content-card">
        <div className="pod-table-wrapper">
          <table className="reloop-data-table">
            <thead>
              <tr>
                <th>Certificate Number</th>
                <th>Water Facility Source</th>
                <th>Testing Lab</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Overall Result</th>
                <th>Intended Uses</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map(cert => (
                <tr key={cert.id}>
                  <td><strong>{cert.reportNumber || cert.certificateNumber || 'CPCB-VERIFIED'}</strong></td>
                  <td>{cert.sourceName}</td>
                  <td>{cert.labName || 'AquaCert Labs Quality Assurance'}</td>
                  <td>{cert.issueDate || '2026-10-24'}</td>
                  <td>
                    <span className="text-emerald-600 font-semibold">{cert.expiryDate || '2027-04-30'}</span>
                    <span className="text-xs text-slate-500 block">(Valid 180 Days)</span>
                  </td>
                  <td>
                    <span className={`status-pill pill-${(cert.overallResult || cert.status || 'Verified').toLowerCase()}`}>
                      {cert.overallResult || cert.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(cert.intendedUses || ['Landscaping', 'Construction']).map((use, i) => (
                        <span key={i} className="use-chip">{use}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="receipt-download-btn"
                      onClick={() => onViewCert(cert)}
                    >
                      <Download size={13} />
                      <span>View Cert</span>
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
// 5. PAYMENTS RECEIVED & WALLET TAB
// ============================================================================
export function VerifierPaymentsTab({ 
  wallet, 
  payoutAccounts, 
  payouts = [], 
  onOpenPayoutModal 
}) {
  const availableBal = wallet?.availableBalance ?? 32500;
  const escrowBal = wallet?.escrowBalance ?? 5000;
  const totalEarned = wallet?.totalEarned ?? 97500;

  return (
    <div className="verifier-tab-content">
      {/* Wallet Balance Hero Banner */}
      <div className="payments-hero-card verifier-hero-card">
        <div className="hero-balance-left">
          <span className="balance-subtitle">AVAILABLE AUDIT REVENUE</span>
          <h1 className="balance-main-val text-cyan-400">₹{availableBal.toLocaleString('en-IN')}</h1>
          <div className="balance-escrow-row">
            <span className="escrow-pill verifier-escrow-pill">
              🔒 In Clearing Escrow: ₹{escrowBal.toLocaleString('en-IN')}
            </span>
            <span className="escrow-hint">Automatically credited as you verify source sample test reports</span>
          </div>
        </div>

        <div className="hero-balance-right">
          <div className="metric-box">
            <span className="metric-lbl">Total Testing Fees Settled</span>
            <strong className="metric-num">₹{totalEarned.toLocaleString('en-IN')}</strong>
          </div>
          <button className="btn-withdraw-hero verifier-btn-withdraw-hero" onClick={onOpenPayoutModal}>
            <Wallet size={18} />
            <span>Withdraw to Corporate Bank / UPI</span>
          </button>
        </div>
      </div>

      {/* Payment Received Methods Card */}
      <div className="payment-methods-card">
        <div className="methods-card-header">
          <Building size={20} className="text-cyan-500" />
          <div>
            <h4>Configured Verification Fee Payout Methods</h4>
            <p>Laboratory audit fees are pre-funded in escrow and disbursed directly to your accredited institutional account.</p>
          </div>
        </div>

        <div className="methods-grid">
          {/* Corporate Bank Account */}
          <div className="method-box active verifier-method-box">
            <div className="method-box-header">
              <span className="method-type">Corporate Bank Account (RTGS / NEFT)</span>
              <span className="primary-pill">Primary</span>
            </div>
            <div className="method-box-body">
              <strong>{payoutAccounts?.bank?.accountHolder || "AquaCert Environmental Testing Services Ltd."}</strong>
              <p>Bank: {payoutAccounts?.bank?.bankName || "State Bank of India (SBI)"}</p>
              <p>Account No: {payoutAccounts?.bank?.accountNumber || "109384910283"}</p>
              <p>IFSC: {payoutAccounts?.bank?.ifscCode || "SBIN0004521"}</p>
              <p>Branch: Guindy Industrial Estate, Chennai</p>
            </div>
            <div className="method-box-footer">
              <span className="status-ok text-cyan-600">✓ Real-time Corporate RTGS Clearing</span>
            </div>
          </div>

          {/* Institutional UPI */}
          <div className="method-box active verifier-method-box">
            <div className="method-box-header">
              <span className="method-type">Institutional UPI VPA</span>
              <span className="instant-pill">Instant</span>
            </div>
            <div className="method-box-body">
              <strong>VPA Address:</strong>
              <p className="upi-text">{payoutAccounts?.upi?.upiId || "aquacertlabs@oksbi"}</p>
              <p>Provider: State Bank of India Corporate UPI</p>
            </div>
            <div className="method-box-footer">
              <span className="status-ok text-cyan-600">✓ Zero Fee 24/7 Real-Time Settlement</span>
            </div>
          </div>

          {/* Milestone Platform Escrow */}
          <div className="method-box active verifier-method-box">
            <div className="method-box-header">
              <span className="method-type">ReLoop Trust Milestone Escrow</span>
              <span className="escrow-badge">Automated</span>
            </div>
            <div className="method-box-body">
              <strong>Standard Verification Fee:</strong>
              <p>Standard CPCB Lab Test: ₹2,500</p>
              <p>Expedited Rescue Priority: ₹3,500</p>
            </div>
            <div className="method-box-footer">
              <span className="status-ok text-cyan-600">✓ 100% Escrow Guaranteed Payout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Fee Ledger */}
      <div className="content-card mt-6">
        <div className="content-card-header">
          <div>
            <h3>Water Testing Fees Received & Settlement Ledger</h3>
            <p className="text-slate-500 text-sm">Full audit trail of laboratory test fees, tax invoices, and bank settlement reference numbers.</p>
          </div>
        </div>

        <div className="pod-table-wrapper">
          <table className="reloop-data-table">
            <thead>
              <tr>
                <th>Payment Ref</th>
                <th>Date / Time</th>
                <th>Report Code</th>
                <th>Source Water Facility</th>
                <th>Audit Category</th>
                <th>Fee Paid</th>
                <th>Settlement Method</th>
                <th>Status</th>
                <th>Tax Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((pay) => (
                <tr key={pay.id}>
                  <td><strong>{pay.id}</strong></td>
                  <td>{pay.date}</td>
                  <td>{pay.reportCode}</td>
                  <td>{pay.sourceName}</td>
                  <td>{pay.testCategory}</td>
                  <td className="text-cyan-700 font-bold">₹{pay.standardFee?.toLocaleString('en-IN')}</td>
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
                      onClick={() => alert(`Official Laboratory Remittance Receipt\nID: ${pay.id}\nAmount: ₹${pay.standardFee}\nMethod: ${pay.method}\nReference: ${pay.referenceNumber}\nStatus: Settled.`)}
                    >
                      <Download size={13} />
                      <span>Invoice</span>
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
// 6. QUALITY RISK & DEGRADATION ALERTS TAB
// ============================================================================
export function QualityRiskAlertsTab() {
  const alerts = [
    {
      id: "alt-1",
      severity: "warning",
      title: "Seasonal Turbidity Drift Detected",
      facility: "Velachery IT Corridor Greywater Plant",
      date: "Today, 10:15 AM",
      desc: "Monsoon runoff has increased incoming raw turbidity by 22%. Recommend secondary sand filtration flush prior to final buyer dispatch."
    },
    {
      id: "alt-2",
      severity: "info",
      title: "Recertification Due in 12 Days",
      facility: "Millifont water STP",
      date: "Yesterday",
      desc: "Bi-annual CPCB water reuse compliance certificate expires on 2027-04-30. Automatic sample collection scheduled."
    },
    {
      id: "alt-3",
      severity: "danger",
      title: "🚨 Source Block Alert: Heavy Chemical COD Spike",
      facility: "Guindy Effluent Plant (Block Triggered)",
      date: "2026-10-23",
      desc: "COD exceeded 180 mg/L (limit 100 mg/L). Safety gate triggered; source blocked and ReLoop Rescue activated."
    }
  ];

  return (
    <div className="verifier-tab-content">
      <div className="section-header-row">
        <div>
          <h3>Water Quality Risk & Degradation Warnings</h3>
          <p>Real-time laboratory monitoring for sensor drift, seasonal water table shifts, and expiring certifications.</p>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.map(alt => (
          <div key={alt.id} className={`alert-card-item alert-${alt.severity}`}>
            <div className="alert-card-header">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <strong>{alt.title}</strong>
              </div>
              <span className="alert-date">{alt.date}</span>
            </div>
            <p className="alert-facility"><strong>Affected Source:</strong> {alt.facility}</p>
            <p className="alert-desc">{alt.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 7. VERIFIER SETTINGS TAB
// ============================================================================
export function VerifierSettingsTab({ profile, onSaveSettings }) {
  const [phone, setPhone] = useState(profile?.phone || "+91 98444 33221");
  const [labAddress, setLabAddress] = useState(profile?.labAddress || "Industrial Estate, Guindy, Chennai, Tamil Nadu 600032");
  const [headAuditor, setHeadAuditor] = useState(profile?.headAuditor || "Dr. Saranya Krishnan, Ph.D.");
  const [standardFee, setStandardFee] = useState(String(profile?.standardFee || 2500));
  const [bankAccount, setBankAccount] = useState(profile?.payoutAccounts?.bank?.accountNumber || "109384910283");
  const [bankIfsc, setBankIfsc] = useState(profile?.payoutAccounts?.bank?.ifscCode || "SBIN0004521");
  const [upiId, setUpiId] = useState(profile?.payoutAccounts?.upi?.upiId || "aquacertlabs@oksbi");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      phone,
      labAddress,
      headAuditor,
      standardFee: Number(standardFee),
      payoutAccounts: {
        bank: {
          accountHolder: profile?.organization || "AquaCert Environmental Testing Services Ltd.",
          accountNumber: bankAccount,
          bankName: "State Bank of India (SBI)",
          ifscCode: bankIfsc,
          branch: "Industrial Estate Branch, Guindy, Chennai",
          accountType: "Current Corporate"
        },
        upi: {
          upiId,
          provider: "SBI Corporate UPI"
        }
      }
    });
  };

  return (
    <div className="verifier-tab-content">
      <div className="content-card max-w-3xl">
        <div className="content-card-header">
          <h3>Quality Verifier Lab Accreditation & Bank Settings</h3>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label>Laboratory Name & Corporate Entity</label>
            <input type="text" value={profile?.organization || "AquaCert Environmental Testing Services Ltd."} disabled />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>NABL Accreditation # (ISO 17025)</label>
              <input type="text" value={profile?.nablAccreditation || "NABL-TC-8894"} disabled />
            </div>
            <div className="form-group">
              <label>Standard Audit Fee (₹)</label>
              <input type="number" value={standardFee} onChange={(e) => setStandardFee(e.target.value)} />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Lead Quality Auditor</label>
              <input type="text" value={headAuditor} onChange={(e) => setHeadAuditor(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Lab Operations Hotline Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <h4 className="settings-section-divider">Configured Payout Accounts (Where You Receive Money)</h4>

          <div className="form-grid-2">
            <div className="form-group">
              <label>SBI Corporate Account Number</label>
              <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Bank IFSC Code</label>
              <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Instant Audit Payout UPI ID (VPA)</label>
            <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary verifier-btn-primary mt-4">
            <CheckCircle2 size={16} />
            <span>Save Verifier Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
}

