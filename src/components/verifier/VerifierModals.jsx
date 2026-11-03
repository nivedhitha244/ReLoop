import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  CheckCircle2, 
  Building, 
  Phone, 
  Award, 
  ShieldCheck, 
  Printer, 
  Download, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';

// ============================================================================
// 1. VERIFIER PAYOUT / WITHDRAW FUNDS MODAL
// ============================================================================
export function VerifierPayoutModal({ 
  isOpen, 
  onClose, 
  availableBalance = 32500, 
  payoutAccounts,
  onSubmitPayout 
}) {
  const [amount, setAmount] = useState('10000');
  const [method, setMethod] = useState('bank'); // 'bank' | 'upi'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickAmount = (val) => {
    setAmount(String(val));
    setErrorMsg('');
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const num = Number(amount);

    if (!num || num <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }
    if (num > availableBalance) {
      setErrorMsg(`Amount exceeds available balance of ₹${availableBalance.toLocaleString('en-IN')}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmitPayout({
        amount: num,
        method,
        destinationAccount: method === 'upi' ? payoutAccounts?.upi?.upiId : payoutAccounts?.bank?.accountNumber
      });
      setSuccessData(res.payout || {
        standardFee: num,
        method: method === 'upi' ? 'Corporate UPI Transfer' : 'Corporate Bank RTGS/NEFT',
        referenceNumber: `UTR-SBI-${Date.now().toString().slice(-8)}`
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process payout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-box payout-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {!successData ? (
          <>
            <div className="modal-header-block">
              <div className="modal-icon-badge verifier-wallet-badge">
                <Wallet size={24} className="text-cyan-500" />
              </div>
              <h3>Withdraw Lab Verification Revenue</h3>
              <p>Transfer pre-funded CPCB sample testing earnings to your laboratory's corporate account.</p>
            </div>

            <div className="modal-balance-banner verifier-balance-banner">
              <div>
                <span className="mb-label">AVAILABLE AUDIT EARNINGS</span>
                <h2 className="mb-val text-cyan-600">₹{availableBalance.toLocaleString('en-IN')}</h2>
              </div>
              <span className="mb-status text-cyan-700">✓ Pre-Funded & Escrow Cleared</span>
            </div>

            {errorMsg && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw}>
              {/* Amount Selection */}
              <div className="form-group">
                <label>Disbursement Amount (₹)</label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErrorMsg(''); }}
                    placeholder="Enter amount"
                    min="500"
                    max={availableBalance}
                    required
                  />
                </div>
                <div className="quick-amount-chips">
                  <button type="button" onClick={() => handleQuickAmount(5000)}>₹5,000</button>
                  <button type="button" onClick={() => handleQuickAmount(10000)}>₹10,000</button>
                  <button type="button" onClick={() => handleQuickAmount(20000)}>₹20,000</button>
                  <button type="button" onClick={() => handleQuickAmount(availableBalance)}>All (₹{availableBalance.toLocaleString('en-IN')})</button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="form-group mt-4">
                <label>Select Payment Received Method</label>
                <div className="payout-method-options">
                  <label className={`method-select-card ${method === 'bank' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="payout_method" 
                      value="bank" 
                      checked={method === 'bank'} 
                      onChange={() => setMethod('bank')} 
                    />
                    <div className="method-info">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-cyan-500" />
                        <strong>Corporate Bank Account (RTGS/NEFT)</strong>
                      </div>
                      <p>{payoutAccounts?.bank?.bankName || "SBI Corporate"} • A/C ...{payoutAccounts?.bank?.accountNumber?.slice(-4) || "0283"}</p>
                    </div>
                  </label>

                  <label className={`method-select-card ${method === 'upi' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="payout_method" 
                      value="upi" 
                      checked={method === 'upi'} 
                      onChange={() => setMethod('upi')} 
                    />
                    <div className="method-info">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-emerald-500" />
                        <strong>Institutional UPI Transfer</strong>
                      </div>
                      <p>{payoutAccounts?.upi?.upiId || "aquacertlabs@oksbi"}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="modal-summary-box">
                <div className="sum-row">
                  <span>Gross Audit Fee Withdrawal:</span>
                  <strong>₹{Number(amount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="sum-row">
                  <span>TDS / Platform Surcharge:</span>
                  <span className="text-cyan-600 font-semibold">₹0.00 (Exempt)</span>
                </div>
                <div className="sum-divider"></div>
                <div className="sum-row total">
                  <span>Net Corporate Credit:</span>
                  <strong className="text-cyan-600">₹{Number(amount || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="modal-buttons-row">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary verifier-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Transferring...' : `Disburse ₹${Number(amount || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="payout-success-view">
            <div className="success-icon-badge bg-cyan-100 text-cyan-600">
              <CheckCircle2 size={44} />
            </div>
            <h3>Disbursement Transferred!</h3>
            <p className="success-message">
              <strong>₹{Number(successData.standardFee || amount).toLocaleString('en-IN')}</strong> has been credited to your 
              institutional account via <strong>{successData.method}</strong>.
            </p>

            <div className="success-receipt-details">
              <div className="receipt-row">
                <span>Bank Settlement Reference (UTR):</span>
                <strong>{successData.referenceNumber}</strong>
              </div>
              <div className="receipt-row">
                <span>Account:</span>
                <span>{successData.payoutChannel || (method === 'upi' ? 'aquacertlabs@oksbi' : 'SBI Current Account')}</span>
              </div>
              <div className="receipt-row">
                <span>Status:</span>
                <span className="text-cyan-600 font-semibold">✓ Settled & Confirmed</span>
              </div>
            </div>

            <button className="btn-primary verifier-btn-primary w-full mt-4" onClick={onClose}>
              Done & Return to Audit Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. OFFICIAL WATER QUALITY CERTIFICATE MODAL
// ============================================================================
export function CertificateViewerModal({ isOpen, onClose, certificate }) {
  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const params = certificate.parameters || {
    ph: 7.2,
    turbidity: "1.2 NTU",
    tds: "420 ppm",
    bod: "4.5 mg/L",
    cod: "18 mg/L",
    eColi: "0 CFU/100mL"
  };

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-box cert-modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Certificate Frame */}
        <div className="official-cert-frame">
          <div className="cert-top-branding">
            <div className="cert-logos">
              <div className="cert-logo-reloop">RELOOP 2.0</div>
              <div className="cert-logo-cpcb">NABL & CPCB ACCREDITED</div>
            </div>
            <div className="cert-number-badge">
              <span>CERTIFICATE NO:</span>
              <strong>{certificate.reportNumber || certificate.certificateNumber || "CPCB-AQ-795217"}</strong>
            </div>
          </div>

          <h2 className="cert-title">CERTIFICATE OF WATER QUALITY & SAFETY ASSURANCE</h2>
          <p className="cert-sub">
            Issued by <strong>{certificate.labName || "AquaCert Labs Quality Assurance"}</strong> in accordance with 
            CPCB Environmental Standards for Safe Urban & Industrial Water Reuse.
          </p>

          <div className="cert-details-grid">
            <div className="cd-item">
              <span>Facility / Water Source:</span>
              <strong>{certificate.sourceName}</strong>
            </div>
            <div className="cd-item">
              <span>Water Classification:</span>
              <strong>{certificate.waterCategory || "Treated Wastewater"}</strong>
            </div>
            <div className="cd-item">
              <span>Certification Date:</span>
              <strong>{certificate.issueDate || "2026-10-24"}</strong>
            </div>
            <div className="cd-item">
              <span>Valid Through:</span>
              <strong>{certificate.expiryDate || "2027-04-30"}</strong>
            </div>
          </div>

          {/* Parameters Table */}
          <table className="cert-params-table">
            <thead>
              <tr>
                <th>Parameter Tested</th>
                <th>Prescribed Limit (CPCB)</th>
                <th>Observed Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>pH Level</td>
                <td>6.5 – 8.5</td>
                <td>{params.ph || 7.2}</td>
                <td><span className="cert-pass">PASSED</span></td>
              </tr>
              <tr>
                <td>Turbidity</td>
                <td>&lt; 5.0 NTU</td>
                <td>{params.turbidity || "1.2 NTU"}</td>
                <td><span className="cert-pass">PASSED</span></td>
              </tr>
              <tr>
                <td>Total Dissolved Solids (TDS)</td>
                <td>&lt; 1,000 ppm</td>
                <td>{params.tds || "420 ppm"}</td>
                <td><span className="cert-pass">PASSED</span></td>
              </tr>
              <tr>
                <td>Biochemical Oxygen Demand (BOD)</td>
                <td>&lt; 30 mg/L</td>
                <td>{params.bod || "4.5 mg/L"}</td>
                <td><span className="cert-pass">PASSED</span></td>
              </tr>
              <tr>
                <td>Chemical Oxygen Demand (COD)</td>
                <td>&lt; 100 mg/L</td>
                <td>{params.cod || "18 mg/L"}</td>
                <td><span className="cert-pass">PASSED</span></td>
              </tr>
              <tr>
                <td>Total Coliform / E. Coli</td>
                <td>0 CFU / 100 mL</td>
                <td>{params.eColi || "0 CFU/100mL"}</td>
                <td><span className="cert-pass">PASSED</span></td>
              </tr>
            </tbody>
          </table>

          {/* Permitted Uses */}
          <div className="cert-permitted-uses">
            <strong>Approved for Non-Potable Applications:</strong>
            <div className="flex gap-2 mt-1">
              {(certificate.intendedUses || ['Landscaping', 'Construction', 'Toilet Flushing']).map((u, i) => (
                <span key={i} className="use-badge">✓ {u}</span>
              ))}
            </div>
          </div>

          {/* Signature and Seals */}
          <div className="cert-signature-block">
            <div className="cert-seal">
              <Award size={36} className="text-cyan-600" />
              <span>NABL TC-8894<br/>SEALED & VERIFIED</span>
            </div>
            <div className="cert-signatory">
              <div className="digital-sig-line">Dr. Saranya Krishnan</div>
              <span className="sig-name">Dr. Saranya Krishnan, Ph.D.</span>
              <span className="sig-title">Lead Environmental Quality Auditor</span>
            </div>
          </div>
        </div>

        <div className="modal-buttons-row mt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn-primary verifier-btn-primary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
}

