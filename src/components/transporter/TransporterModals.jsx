import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  CheckCircle2, 
  Building, 
  Phone, 
  ShieldCheck, 
  Truck, 
  Droplet, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// 1. PAYOUT / WITHDRAW FUNDS MODAL
// ============================================================================
export function TransporterPayoutModal({ 
  isOpen, 
  onClose, 
  availableBalance = 16800, 
  payoutAccounts,
  onSubmitPayout 
}) {
  const [amount, setAmount] = useState('5000');
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
        totalFee: num,
        method: method === 'upi' ? 'Instant UPI Transfer' : 'Bank Transfer (NEFT/RTGS)',
        referenceNumber: `UTR-${Date.now().toString().slice(-8)}`
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
              <div className="modal-icon-badge wallet-badge">
                <Wallet size={24} className="text-emerald-500" />
              </div>
              <h3>Withdraw Transport Earnings</h3>
              <p>Transfer available water logistics earnings directly to your verified bank account or UPI ID.</p>
            </div>

            <div className="modal-balance-banner">
              <div>
                <span className="mb-label">AVAILABLE FOR PAYOUT</span>
                <h2 className="mb-val">₹{availableBalance.toLocaleString('en-IN')}</h2>
              </div>
              <span className="mb-status">✓ Cleared for Settlement</span>
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
                <label>Withdrawal Amount (₹)</label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErrorMsg(''); }}
                    placeholder="Enter amount"
                    min="100"
                    max={availableBalance}
                    required
                  />
                </div>
                <div className="quick-amount-chips">
                  <button type="button" onClick={() => handleQuickAmount(2000)}>₹2,000</button>
                  <button type="button" onClick={() => handleQuickAmount(5000)}>₹5,000</button>
                  <button type="button" onClick={() => handleQuickAmount(10000)}>₹10,000</button>
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
                        <Building size={16} className="text-emerald-500" />
                        <strong>Direct Bank Transfer (NEFT/RTGS)</strong>
                      </div>
                      <p>{payoutAccounts?.bank?.bankName || "HDFC Bank"} • A/C ...{payoutAccounts?.bank?.accountNumber?.slice(-4) || "2391"}</p>
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
                        <Phone size={16} className="text-cyan-500" />
                        <strong>Instant UPI Transfer</strong>
                      </div>
                      <p>{payoutAccounts?.upi?.upiId || "ecoflow.fleet@okhdfcbank"}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Fees Summary */}
              <div className="modal-summary-box">
                <div className="sum-row">
                  <span>Gross Withdrawal:</span>
                  <strong>₹{Number(amount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="sum-row">
                  <span>ReLoop Logistics Processing Fee:</span>
                  <span className="text-emerald-500 font-semibold">₹0.00 (Zero Fee)</span>
                </div>
                <div className="sum-divider"></div>
                <div className="sum-row total">
                  <span>Net Amount Deposited:</span>
                  <strong className="text-emerald-600">₹{Number(amount || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="modal-buttons-row">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing Payout...' : `Transfer ₹${Number(amount || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="payout-success-view">
            <div className="success-icon-badge">
              <CheckCircle2 size={44} className="text-emerald-500" />
            </div>
            <h3>Payout Transferred Successfully!</h3>
            <p className="success-message">
              <strong>₹{Number(successData.totalFee || amount).toLocaleString('en-IN')}</strong> has been disbursed to your 
              selected payout account via <strong>{successData.method}</strong>.
            </p>

            <div className="success-receipt-details">
              <div className="receipt-row">
                <span>Transaction Reference (UTR):</span>
                <strong>{successData.referenceNumber}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Channel:</span>
                <span>{successData.payoutChannel || (method === 'upi' ? 'Instant UPI' : 'HDFC Bank Account')}</span>
              </div>
              <div className="receipt-row">
                <span>Status:</span>
                <span className="text-emerald-500 font-semibold">✓ Settled & Confirmed</span>
              </div>
            </div>

            <button className="btn-primary w-full mt-4" onClick={onClose}>
              Done & Return to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. PROOF OF DELIVERY (POD) & OTP CONFIRMATION MODAL
// ============================================================================
export function TransporterPodModal({ 
  isOpen, 
  onClose, 
  trip, 
  onSubmitPod 
}) {
  const [otp, setOtp] = useState(trip?.deliveryOtp || '8492');
  const [flowMeterReading, setFlowMeterReading] = useState(String(trip?.quantityLitres || 4000));
  const [buyerName, setBuyerName] = useState('Green Park Facility Site Manager');
  const [notes, setNotes] = useState('Water transferred directly into buyer reservoir sump. Flow meter calibrated.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !trip) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp || otp.length !== 4) {
      setErrorMsg('Please enter the 4-digit buyer confirmation OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitPod(trip.id, {
        otp,
        flowMeterReading: Number(flowMeterReading),
        buyerSignatureName: buyerName,
        notes
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-box pod-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header-block">
          <div className="modal-icon-badge pod-badge">
            <ShieldCheck size={24} className="text-emerald-500" />
          </div>
          <h3>Confirm Delivery & Verify OTP</h3>
          <p>Confirm volume delivered with the buyer to record litres in the Water Impact Ledger and auto-release your transport fee.</p>
        </div>

        <div className="trip-summary-box">
          <div className="ts-row">
            <span>Trip Code:</span>
            <strong>{trip.deliveryRef}</strong>
          </div>
          <div className="ts-row">
            <span>Destination Buyer:</span>
            <strong>{trip.destinationName}</strong>
          </div>
          <div className="ts-row">
            <span>Water Type:</span>
            <span>{trip.waterCategory}</span>
          </div>
          <div className="ts-row">
            <span>Transport Fee to Release:</span>
            <strong className="text-emerald-600">₹{trip.transportFee?.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {errorMsg && (
          <div className="modal-error-banner">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label>Buyer 4-Digit Confirmation OTP</label>
              <span className="text-xs text-emerald-600 font-medium">Demo Code: {trip.deliveryOtp || '8492'}</span>
            </div>
            <input
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 8492"
              className="otp-input-field"
              required
            />
          </div>

          <div className="form-group mt-3">
            <label>Discharged Volume Reading (Litres)</label>
            <input
              type="number"
              value={flowMeterReading}
              onChange={(e) => setFlowMeterReading(e.target.value)}
              required
            />
          </div>

          <div className="form-group mt-3">
            <label>Buyer Receiving Officer / Site Manager</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
            />
          </div>

          <div className="form-group mt-3">
            <label>Delivery Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-buttons-row mt-4">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying POD...' : 'Confirm Delivery & Unlock Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ADD TANKER BOWLER MODAL
// ============================================================================
export function AddTankerModal({ isOpen, onClose, onAddTanker }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [model, setModel] = useState('Tata Prima 2830 Water Bowler');
  const [capacityLitres, setCapacityLitres] = useState('10000');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber || !driverName) return;

    setIsSubmitting(true);
    try {
      await onAddTanker({
        vehicleNumber,
        model,
        capacityLitres: Number(capacityLitres),
        driverName,
        driverPhone
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to add tanker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reloop-modal-backdrop" onClick={onClose}>
      <div className="reloop-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header-block">
          <div className="modal-icon-badge fleet-badge">
            <Truck size={24} className="text-emerald-500" />
          </div>
          <h3>Add Tanker to Fleet</h3>
          <p>Register a new water bowler vehicle with calibrated flow meters and driver details.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Vehicle Plate Number</label>
              <input
                type="text"
                placeholder="e.g. TN-09-CW-9921"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Tanker Capacity (Litres)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={capacityLitres}
                onChange={(e) => setCapacityLitres(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group mt-3">
            <label>Tanker Model & Chassis</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2 mt-3">
            <div className="form-group">
              <label>Assigned Driver Name</label>
              <input
                type="text"
                placeholder="e.g. R. Selvam"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Driver Phone Number</label>
              <input
                type="text"
                placeholder="+91 98000 00000"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-buttons-row mt-5">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Add Tanker to Fleet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

