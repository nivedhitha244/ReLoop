// server/routes/transporter.js
import express from 'express';
import { loadDB, saveDB, updateMatchStatus } from '../services/inventoryService.js';
import { isDbConnected } from '../db.js';
import { Delivery } from '../models/Delivery.js';
import { Match } from '../models/Match.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// Helper to ensure transporter structure exists in DB store
function ensureTransporterData(db) {
  if (!db.transporterProfile) {
    db.transporterProfile = {
      id: "seed-transporter-1",
      name: "EcoFlow Logistics Fleet",
      organization: "EcoFlow Water Tanker Services Pvt. Ltd.",
      role: "transporter",
      initials: "EF",
      email: "transporter@reloop.org",
      phone: "+91 98777 66554",
      serviceZone: "Greater Chennai & OMR Corridor",
      operatingLicense: "TN-TRANS-WTR-2026-9021",
      fleetSize: 6,
      activeDrivers: 5,
      wallet: {
        availableBalance: 16800,
        escrowBalance: 3950,
        totalEarned: 52400,
        totalTripsCompleted: 26,
        totalLitresDelivered: 104000,
        totalKmTraversed: 485,
        currency: "INR (₹)"
      },
      payoutAccounts: {
        bank: {
          accountHolder: "EcoFlow Water Tanker Services Pvt. Ltd.",
          accountNumber: "50200049182391",
          bankName: "HDFC Bank Ltd.",
          ifscCode: "HDFC0001224",
          branch: "OMR Sholinganallur, Chennai",
          accountType: "Current"
        },
        upi: {
          upiId: "ecoflow.fleet@okhdfcbank",
          provider: "HDFC / Google Pay"
        }
      }
    };
  }

  if (!db.transporterFleet || db.transporterFleet.length === 0) {
    db.transporterFleet = [
      {
        id: "flt-1",
        vehicleNumber: "TN-09-CV-8841",
        model: "Tata Prima 2830 Water Bowler",
        capacityLitres: 10000,
        driverName: "Senthil Kumar",
        driverPhone: "+91 97890 44556",
        status: "In Transit",
        currentTripId: "mat-1792821928402",
        currentLoad: 4000,
        waterCategory: "Rainwater",
        odometerKm: 34210,
        lastSanitized: "2026-10-24",
        flowMeterCalibrated: true,
        gpsDeviceId: "GPS-ECO-8841",
        coordinates: [13.0418, 80.2341]
      },
      {
        id: "flt-2",
        vehicleNumber: "TN-09-CW-8492",
        model: "BharatBenz 1617R Tanker",
        capacityLitres: 12000,
        driverName: "K. Rajesh",
        driverPhone: "+91 98777 66554",
        status: "Available / Standby",
        currentTripId: null,
        currentLoad: 0,
        waterCategory: null,
        odometerKm: 28940,
        lastSanitized: "2026-10-23",
        flowMeterCalibrated: true,
        gpsDeviceId: "GPS-ECO-8492",
        coordinates: [12.9800, 80.2200]
      },
      {
        id: "flt-3",
        vehicleNumber: "TN-11-BT-3910",
        model: "Ashok Leyland Ecomet Tanker",
        capacityLitres: 6000,
        driverName: "Murugan V.",
        driverPhone: "+91 98402 11993",
        status: "Scheduled",
        currentTripId: "mat-1792772759857",
        currentLoad: 0,
        waterCategory: "Treated Wastewater",
        odometerKm: 41200,
        lastSanitized: "2026-10-25",
        flowMeterCalibrated: true,
        gpsDeviceId: "GPS-ECO-3910",
        coordinates: [13.0650, 80.2600]
      },
      {
        id: "flt-4",
        vehicleNumber: "TN-07-EK-7722",
        model: "Mahindra Blazo X Heavy Bowler",
        capacityLitres: 15000,
        driverName: "Anbu Selvan",
        driverPhone: "+91 97109 88321",
        status: "Maintenance Check",
        currentTripId: null,
        currentLoad: 0,
        waterCategory: null,
        odometerKm: 58120,
        lastSanitized: "2026-10-20",
        flowMeterCalibrated: true,
        gpsDeviceId: "GPS-ECO-7722",
        coordinates: [13.0100, 80.1900]
      }
    ];
  }

  if (!db.transporterPayouts || db.transporterPayouts.length === 0) {
    db.transporterPayouts = [
      {
        id: "PAY-TRN-9021",
        tripRef: "DLV-821928",
        date: "2026-10-24 16:30",
        sourceName: "Millifont water STP",
        destinationName: "Finfee Park Facility",
        quantityLitres: 4500,
        distanceKm: 5.5,
        baseFee: 800,
        distanceFee: 330,
        volumeFee: 225,
        totalFee: 1355,
        method: "Direct Escrow Release",
        payoutChannel: "HDFC Bank (A/C ...2391)",
        status: "Settled",
        referenceNumber: "UTR-HDFC-993810291",
        receiptUrl: "#receipt-9021"
      },
      {
        id: "PAY-TRN-8814",
        tripRef: "DLV-772759",
        date: "2026-10-23 11:15",
        sourceName: "Multimiton water",
        destinationName: "Green Park Facility",
        quantityLitres: 4000,
        distanceKm: 4.8,
        baseFee: 800,
        distanceFee: 288,
        volumeFee: 200,
        totalFee: 1288,
        method: "Instant UPI Payout",
        payoutChannel: "ecoflow.fleet@okhdfcbank",
        status: "Settled",
        referenceNumber: "UPI-REF-48291048",
        receiptUrl: "#receipt-8814"
      },
      {
        id: "PAY-TRN-7412",
        tripRef: "DLV-821882",
        date: "2026-10-22 18:45",
        sourceName: "Apex Tech Park STP",
        destinationName: "City Greens Garden",
        quantityLitres: 5000,
        distanceKm: 6.2,
        baseFee: 800,
        distanceFee: 372,
        volumeFee: 250,
        totalFee: 1422,
        method: "Bank Transfer (NEFT)",
        payoutChannel: "HDFC Bank (A/C ...2391)",
        status: "Settled",
        referenceNumber: "NEFT-N10294819",
        receiptUrl: "#receipt-7412"
      }
    ];
  }
}

// -------------------------------------------------------------
// 1. GET TRANSPORTER PROFILE & WALLET
// -------------------------------------------------------------
router.get('/profile', (req, res) => {
  try {
    const db = loadDB();
    ensureTransporterData(db);
    res.json({
      profile: db.transporterProfile,
      wallet: db.transporterProfile.wallet,
      payoutAccounts: db.transporterProfile.payoutAccounts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transporter profile: ' + err.message });
  }
});

// Update Profile & Payout Settings
router.put('/profile', (req, res) => {
  try {
    const db = loadDB();
    ensureTransporterData(db);
    const { phone, serviceZone, payoutAccounts } = req.body;
    
    if (phone) db.transporterProfile.phone = phone;
    if (serviceZone) db.transporterProfile.serviceZone = serviceZone;
    if (payoutAccounts) {
      db.transporterProfile.payoutAccounts = {
        ...db.transporterProfile.payoutAccounts,
        ...payoutAccounts
      };
    }

    saveDB(db);
    res.json({ success: true, profile: db.transporterProfile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transporter profile: ' + err.message });
  }
});

// -------------------------------------------------------------
// 2. GET TRANSPORTER STATS
// -------------------------------------------------------------
router.get('/stats', (req, res) => {
  try {
    const db = loadDB();
    ensureTransporterData(db);

    const matches = db.matches || [];
    const activeTrips = matches.filter(m => m.status === 'In Transit' || m.status === 'Scheduled' || m.status === 'Transporter Assigned');
    const completedTrips = matches.filter(m => m.status === 'Completed' || m.status === 'Delivered');

    const totalLitres = completedTrips.reduce((sum, m) => sum + (Number(m.confirmedReusedQuantity || m.matchedQuantity || m.quantity) || 0), 0);
    const fleet = db.transporterFleet || [];
    const availableTankers = fleet.filter(f => f.status.includes('Available') || f.status.includes('Standby')).length;

    // Calculate escrow from active scheduled trips
    const escrow = activeTrips.reduce((sum, m) => {
      const dist = Number(m.distanceKm || m.distance) || 5;
      const vol = Number(m.matchedQuantity || m.quantity) || 4000;
      return sum + (800 + Math.round(dist * 60) + Math.round((vol / 1000) * 50));
    }, 0);

    // Update wallet escrow dynamically
    db.transporterProfile.wallet.escrowBalance = escrow;
    db.transporterProfile.wallet.totalTripsCompleted = completedTrips.length;
    db.transporterProfile.wallet.totalLitresDelivered = totalLitres;

    saveDB(db);

    res.json({
      activeDispatches: activeTrips.length,
      completedDeliveries: completedTrips.length,
      totalLitresTransported: totalLitres,
      totalKmTraversed: db.transporterProfile.wallet.totalKmTraversed,
      totalEarnings: db.transporterProfile.wallet.totalEarned,
      availableBalance: db.transporterProfile.wallet.availableBalance,
      escrowBalance: db.transporterProfile.wallet.escrowBalance,
      fleetTotal: fleet.length,
      availableTankers,
      inTransitTankers: fleet.filter(f => f.status === 'In Transit').length,
      co2SavedKg: Math.round(totalLitres * 0.018), // Carbon savings from localized water recycling vs freshwater extraction
      efficiencyRating: "99.4%"
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute transporter stats: ' + err.message });
  }
});

// -------------------------------------------------------------
// 3. GET ASSIGNED TRIPS & DISPATCHES
// -------------------------------------------------------------
router.get('/trips', (req, res) => {
  try {
    const db = loadDB();
    ensureTransporterData(db);

    const { status } = req.query;
    const matches = db.matches || [];

    // Map matches to rich logistics trip items
    const trips = matches.map((m, idx) => {
      const dist = Number(m.distanceKm || m.distance) || 5.5;
      const qty = Number(m.confirmedReusedQuantity || m.matchedQuantity || m.quantity) || 4000;
      const baseFee = 800;
      const distFee = Math.round(dist * 60);
      const volFee = Math.round((qty / 1000) * 50);
      const totalFee = baseFee + distFee + volFee;

      const vehicle = db.transporterFleet[idx % db.transporterFleet.length];

      return {
        id: m.id,
        deliveryRef: m.deliveryRef || `DLV-${m.id.replace(/\D/g, '').slice(-6) || '829101'}`,
        sourceId: m.sourceId,
        sourceName: m.sourceName || 'Apex Tech Park STP',
        sourceAddress: m.pickupLocation || 'Plot 14-B, OMR IT Expressway, Sholinganallur, Chennai',
        sourceCoordinates: [12.9800, 80.2200],
        destinationName: m.destinationName || m.buyerName || 'Green Park Facility',
        destinationAddress: m.destinationLocation || 'Poonamallee High Road, Chennai',
        destinationCoordinates: [13.0827, 80.2707],
        waterCategory: m.waterCategory || m.intendedReuse || 'Treated Wastewater',
        quantityLitres: qty,
        distanceKm: dist,
        estimatedTimeMinutes: Math.round(dist * 3.5),
        currentStatus: m.status === 'Transporter Assigned' ? 'Scheduled' : m.status,
        scheduledPickup: m.scheduledTime || 'Today, 02:00 PM',
        deliveryOtp: m.deliveryOtp || '8492',
        driverName: m.driverName || vehicle.driverName,
        driverPhone: m.driverPhone || vehicle.driverPhone,
        vehicleNumber: vehicle.vehicleNumber,
        tankerModel: vehicle.model,
        transportFee: totalFee,
        feeBreakdown: { baseFee, distFee, volFee, totalFee },
        paymentStatus: (m.status === 'Completed' || m.status === 'Delivered') ? 'Paid / Settled' : 'In Escrow (Pending POD)',
        currentCoordinates: m.status === 'In Transit' ? [13.0418, 80.2341] : (m.status === 'Completed' ? [13.0827, 80.2707] : [12.9800, 80.2200]),
        isRescue: !!m.isRescue,
        rescueReason: m.rescueReason || null,
        updatedAt: m.updatedAt || new Date().toISOString()
      };
    });

    let filtered = trips;
    if (status && status !== 'all') {
      filtered = trips.filter(t => t.currentStatus.toLowerCase() === status.toLowerCase());
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transporter trips: ' + err.message });
  }
});

// -------------------------------------------------------------
// 4. UPDATE TRIP STATUS (LIFECYCLE ADVANCE)
// -------------------------------------------------------------
router.patch('/trips/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, coordinates, note, otp } = req.body;

    const VALID_STATUSES = [
      'Scheduled',
      'En Route to Pickup',
      'Loaded at Supplier',
      'In Transit',
      'Arrived at Buyer',
      'Delivered',
      'Completed'
    ];

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const db = loadDB();
    ensureTransporterData(db);

    const match = (db.matches || []).find(m => m.id === id || m.deliveryRef === id);
    if (!match) {
      return res.status(404).json({ error: 'Trip/Match not found.' });
    }

    // If attempting to complete or deliver, verify OTP if supplied
    if ((status === 'Delivered' || status === 'Completed') && otp) {
      const expectedOtp = match.deliveryOtp || '8492';
      if (otp.trim() !== expectedOtp.trim()) {
        return res.status(400).json({ error: 'Invalid Delivery Confirmation OTP. Please ask the buyer for their 4-digit code.' });
      }
    }

    const prevStatus = match.status;
    match.status = status;
    match.updatedAt = new Date().toISOString();

    // Calculate transport fee
    const dist = Number(match.distanceKm || match.distance) || 5.5;
    const qty = Number(match.confirmedReusedQuantity || match.matchedQuantity || match.quantity) || 4000;
    const fee = 800 + Math.round(dist * 60) + Math.round((qty / 1000) * 50);

    // If transitioned to Delivered or Completed and wasn't before, trigger automated escrow release to wallet!
    if ((status === 'Delivered' || status === 'Completed') && prevStatus !== 'Delivered' && prevStatus !== 'Completed') {
      db.transporterProfile.wallet.availableBalance += fee;
      db.transporterProfile.wallet.escrowBalance = Math.max(0, db.transporterProfile.wallet.escrowBalance - fee);
      db.transporterProfile.wallet.totalEarned += fee;
      db.transporterProfile.wallet.totalTripsCompleted += 1;
      db.transporterProfile.wallet.totalLitresDelivered += qty;
      db.transporterProfile.wallet.totalKmTraversed += Math.round(dist);

      // Create Payout Ledger entry
      const payoutEntry = {
        id: `PAY-TRN-${Date.now().toString().slice(-6)}`,
        tripRef: match.deliveryRef || `DLV-${match.id.replace(/\D/g, '').slice(-6) || '829101'}`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        sourceName: match.sourceName || 'Water Source',
        destinationName: match.destinationName || match.buyerName || 'Buyer Facility',
        quantityLitres: qty,
        distanceKm: dist,
        baseFee: 800,
        distanceFee: Math.round(dist * 60),
        volumeFee: Math.round((qty / 1000) * 50),
        totalFee: fee,
        method: "Direct Escrow Release",
        payoutChannel: "Wallet Available Balance (Direct Credit)",
        status: "Settled",
        referenceNumber: `ESCROW-REL-${Date.now().toString().slice(-8)}`,
        receiptUrl: `#receipt-${Date.now().toString().slice(-6)}`
      };
      db.transporterPayouts.unshift(payoutEntry);
    }

    // Synchronize canonical match status
    await updateMatchStatus(match.id, status === 'Delivered' ? 'Completed' : status, {
      instructions: note || `Transporter updated status to ${status}`,
      confirmedQuantity: qty
    });

    saveDB(db);

    res.json({
      success: true,
      message: `Trip status transitioned to ${status}.`,
      trip: match,
      wallet: db.transporterProfile.wallet
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trip status: ' + err.message });
  }
});

// -------------------------------------------------------------
// 5. PROOF OF DELIVERY (POD) WITH LITRES CONFIRMATION & OTP
// -------------------------------------------------------------
router.post('/trips/:id/verify-delivery', async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, flowMeterReading, buyerSignatureName, notes } = req.body;

    const db = loadDB();
    ensureTransporterData(db);

    const match = (db.matches || []).find(m => m.id === id || m.deliveryRef === id);
    if (!match) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const expectedOtp = match.deliveryOtp || '8492';
    if (otp && otp.trim() !== expectedOtp.trim()) {
      return res.status(400).json({ error: 'Invalid Delivery OTP verification code. Re-check code provided by receiver.' });
    }

    const qty = Number(flowMeterReading) || Number(match.matchedQuantity || match.quantity) || 4000;
    const dist = Number(match.distanceKm || match.distance) || 5.5;
    const fee = 800 + Math.round(dist * 60) + Math.round((qty / 1000) * 50);

    match.status = 'Completed';
    match.confirmedReusedQuantity = qty;
    match.proofOfDelivery = {
      verifiedAt: new Date().toISOString(),
      verifiedBy: buyerSignatureName || 'Site Manager (Green Park)',
      otpVerified: true,
      flowMeterLitres: qty,
      notes: notes || 'Water transferred and meter calibrated on site.'
    };

    // Unlock transport fee into available wallet
    db.transporterProfile.wallet.availableBalance += fee;
    db.transporterProfile.wallet.escrowBalance = Math.max(0, db.transporterProfile.wallet.escrowBalance - fee);
    db.transporterProfile.wallet.totalEarned += fee;
    db.transporterProfile.wallet.totalTripsCompleted += 1;
    db.transporterProfile.wallet.totalLitresDelivered += qty;

    // Log Settlement
    db.transporterPayouts.unshift({
      id: `PAY-POD-${Date.now().toString().slice(-6)}`,
      tripRef: match.deliveryRef || `DLV-${match.id}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceName: match.sourceName,
      destinationName: match.destinationName || 'Buyer Facility',
      quantityLitres: qty,
      distanceKm: dist,
      baseFee: 800,
      distanceFee: Math.round(dist * 60),
      volumeFee: Math.round((qty / 1000) * 50),
      totalFee: fee,
      method: "Direct Escrow Release upon POD",
      payoutChannel: "Transporter Wallet (Cleared)",
      status: "Settled",
      referenceNumber: `POD-UTR-${Date.now().toString().slice(-8)}`
    });

    await updateMatchStatus(match.id, 'Completed', {
      instructions: `Delivery verified via POD & OTP by ${buyerSignatureName || 'Receiver'}. Litres recorded: ${qty}L.`,
      confirmedQuantity: qty
    });

    saveDB(db);

    res.json({
      success: true,
      message: 'Proof of Delivery verified! Litres recorded in Water Impact Ledger and transport fee released.',
      trip: match,
      wallet: db.transporterProfile.wallet
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify proof of delivery: ' + err.message });
  }
});

// -------------------------------------------------------------
// 6. FLEET & TANKERS MANAGEMENT
// -------------------------------------------------------------
router.get('/fleet', (req, res) => {
  try {
    const db = loadDB();
    ensureTransporterData(db);
    res.json(db.transporterFleet || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve fleet: ' + err.message });
  }
});

router.post('/fleet', (req, res) => {
  try {
    const db = loadDB();
    ensureTransporterData(db);
    const { vehicleNumber, model, capacityLitres, driverName, driverPhone } = req.body;

    if (!vehicleNumber || !capacityLitres || !driverName) {
      return res.status(400).json({ error: 'Vehicle number, capacity, and driver name are required.' });
    }

    const newTanker = {
      id: `flt-${Date.now().toString().slice(-4)}`,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      model: model || 'Tata Prima Heavy Bowler',
      capacityLitres: Number(capacityLitres),
      driverName: driverName.trim(),
      driverPhone: driverPhone || '+91 98000 00000',
      status: 'Available / Standby',
      currentTripId: null,
      currentLoad: 0,
      waterCategory: null,
      odometerKm: 12000,
      lastSanitized: new Date().toISOString().slice(0, 10),
      flowMeterCalibrated: true,
      gpsDeviceId: `GPS-ECO-${vehicleNumber.slice(-4)}`,
      coordinates: [13.0418, 80.2341]
    };

    db.transporterFleet.push(newTanker);
    db.transporterProfile.fleetSize = db.transporterFleet.length;
    saveDB(db);

    res.json({ success: true, message: 'New tanker added to logistics fleet.', tanker: newTanker });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add tanker: ' + err.message });
  }
});

// -------------------------------------------------------------
// 7. PAYOUTS & PAYMENT RECEIVED METHODS
// -------------------------------------------------------------
router.get('/payouts', (req, res) => {
  try {
    const db = loadDB();
    ensureTransporterData(db);
    res.json({
      wallet: db.transporterProfile.wallet,
      payoutAccounts: db.transporterProfile.payoutAccounts,
      payouts: db.transporterPayouts || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payouts: ' + err.message });
  }
});

// Withdraw Funds / Instant Payout
router.post('/payouts/withdraw', (req, res) => {
  try {
    const { amount, method, destinationAccount } = req.body;
    const db = loadDB();
    ensureTransporterData(db);

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
    }

    if (withdrawAmount > db.transporterProfile.wallet.availableBalance) {
      return res.status(400).json({ 
        error: `Insufficient available funds. Current available balance is ₹${db.transporterProfile.wallet.availableBalance.toLocaleString('en-IN')}.` 
      });
    }

    // Process payout
    db.transporterProfile.wallet.availableBalance -= withdrawAmount;

    let payoutChannelDesc = '';
    let refPrefix = '';

    if (method === 'upi') {
      payoutChannelDesc = destinationAccount || db.transporterProfile.payoutAccounts.upi.upiId;
      refPrefix = 'UPI-PAY-';
    } else if (method === 'bank') {
      const bank = db.transporterProfile.payoutAccounts.bank;
      payoutChannelDesc = `${bank.bankName} (A/C ...${bank.accountNumber.slice(-4)})`;
      refPrefix = 'NEFT-RTGS-';
    } else {
      payoutChannelDesc = 'ReLoop Direct Escrow Instant Transfer';
      refPrefix = 'ESCROW-DIR-';
    }

    const refNumber = `${refPrefix}${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newPayout = {
      id: `PAY-WDR-${Date.now().toString().slice(-6)}`,
      tripRef: 'Wallet Settlement Payout',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceName: 'EcoFlow Logistics Wallet',
      destinationName: payoutChannelDesc,
      quantityLitres: 0,
      distanceKm: 0,
      baseFee: 0,
      distanceFee: 0,
      volumeFee: 0,
      totalFee: withdrawAmount,
      method: method === 'upi' ? 'Instant UPI Transfer' : (method === 'bank' ? 'Bank Transfer (NEFT/IMPS)' : 'Direct Escrow Settlement'),
      payoutChannel: payoutChannelDesc,
      status: 'Settled',
      referenceNumber: refNumber,
      receiptUrl: `#receipt-wdr-${Date.now().toString().slice(-6)}`
    };

    db.transporterPayouts.unshift(newPayout);
    saveDB(db);

    res.json({
      success: true,
      message: `₹${withdrawAmount.toLocaleString('en-IN')} has been successfully transferred via ${newPayout.method}.`,
      payout: newPayout,
      wallet: db.transporterProfile.wallet
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payout: ' + err.message });
  }
});

export default router;

