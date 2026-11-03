// src/services/transporterApi.js
const API_BASE = '/api/transporter';

const fallbackTransporter = {
  profile: {
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
  },
  stats: {
    activeDispatches: 2,
    completedDeliveries: 26,
    totalLitresTransported: 104000,
    totalKmTraversed: 485,
    totalEarnings: 52400,
    availableBalance: 16800,
    escrowBalance: 3950,
    fleetTotal: 4,
    availableTankers: 2,
    inTransitTankers: 1,
    co2SavedKg: 1872,
    efficiencyRating: "99.4%"
  }
};

const notifyMutation = (action) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action } }));
    localStorage.setItem('reloop_last_mutation', String(Date.now()));
  }
};

export const transporterApi = {
  async getProfile() {
    try {
      const res = await fetch(`${API_BASE}/profile`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[transporterApi] Using fallback profile:", e.message);
    }
    return {
      profile: fallbackTransporter.profile,
      wallet: fallbackTransporter.profile.wallet,
      payoutAccounts: fallbackTransporter.profile.payoutAccounts
    };
  },

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        notifyMutation('transporter_profile_updated');
        return await res.json();
      }
    } catch (e) {
      console.warn("[transporterApi] Error updating profile:", e.message);
    }
    return { success: true };
  },

  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[transporterApi] Using fallback stats:", e.message);
    }
    return fallbackTransporter.stats;
  },

  async getTrips(status = 'all') {
    try {
      const url = status && status !== 'all' ? `${API_BASE}/trips?status=${status}` : `${API_BASE}/trips`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[transporterApi] Using fallback trips:", e.message);
    }
    return [
      {
        id: "mat-1792821928402",
        deliveryRef: "DLV-821928",
        sourceName: "Millifont water STP",
        sourceAddress: "Plot 14-B, OMR IT Expressway, Sholinganallur, Chennai",
        destinationName: "Finfee Park Facility",
        destinationAddress: "Poonamallee High Road, Chennai",
        waterCategory: "Rainwater",
        quantityLitres: 4500,
        distanceKm: 5.5,
        estimatedTimeMinutes: 20,
        currentStatus: "In Transit",
        scheduledPickup: "Today, 02:00 PM",
        deliveryOtp: "8492",
        driverName: "Senthil Kumar",
        driverPhone: "+91 97890 44556",
        vehicleNumber: "TN-09-CV-8841",
        tankerModel: "Tata Prima 2830 Bowler",
        transportFee: 1355,
        feeBreakdown: { baseFee: 800, distFee: 330, volFee: 225, totalFee: 1355 },
        paymentStatus: "In Escrow (Pending POD)",
        currentCoordinates: [13.0418, 80.2341],
        sourceCoordinates: [12.9800, 80.2200],
        destinationCoordinates: [13.0827, 80.2707],
        isRescue: false
      },
      {
        id: "rescue-1793706904995",
        deliveryRef: "DLV-904995",
        sourceName: "Millifont water (Rescue Alt)",
        sourceAddress: "Plot 14-B, OMR IT Expressway, Sholinganallur, Chennai",
        destinationName: "Finfee Park Facility",
        destinationAddress: "Poonamallee High Road, Chennai",
        waterCategory: "Rainwater",
        quantityLitres: 4500,
        distanceKm: 5.5,
        estimatedTimeMinutes: 18,
        currentStatus: "Scheduled",
        scheduledPickup: "Today, 04:30 PM",
        deliveryOtp: "3912",
        driverName: "K. Rajesh",
        driverPhone: "+91 98777 66554",
        vehicleNumber: "TN-09-CW-8492",
        tankerModel: "BharatBenz 1617R Tanker",
        transportFee: 1355,
        feeBreakdown: { baseFee: 800, distFee: 330, volFee: 225, totalFee: 1355 },
        paymentStatus: "In Escrow",
        currentCoordinates: [12.9800, 80.2200],
        sourceCoordinates: [12.9800, 80.2200],
        destinationCoordinates: [13.0827, 80.2707],
        isRescue: true,
        rescueReason: "Primary supplier unexpected shutdown; rerouted via ReLoop Rescue"
      },
      {
        id: "mat-1792772759857",
        deliveryRef: "DLV-772759",
        sourceName: "Multimiton water",
        sourceAddress: "Ambattur Industrial Estate, Chennai",
        destinationName: "Green Park Facility",
        destinationAddress: "Anna Nagar West, Chennai",
        waterCategory: "Treated Wastewater",
        quantityLitres: 4000,
        distanceKm: 4.8,
        estimatedTimeMinutes: 15,
        currentStatus: "Completed",
        scheduledPickup: "Yesterday, 11:00 AM",
        deliveryOtp: "5821",
        driverName: "Murugan V.",
        driverPhone: "+91 98402 11993",
        vehicleNumber: "TN-11-BT-3910",
        tankerModel: "Ashok Leyland Ecomet Tanker",
        transportFee: 1288,
        feeBreakdown: { baseFee: 800, distFee: 288, volFee: 200, totalFee: 1288 },
        paymentStatus: "Paid / Settled",
        currentCoordinates: [13.0827, 80.2707],
        sourceCoordinates: [13.0650, 80.2600],
        destinationCoordinates: [13.0827, 80.2707],
        isRescue: false
      }
    ];
  },

  async updateTripStatus(tripId, status, { note = '', otp = '', coordinates = null } = {}) {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, otp, coordinates })
      });
      if (res.ok) {
        notifyMutation('trip_status_updated');
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to update trip status');
    } catch (e) {
      console.warn("[transporterApi] Status update fallback/error:", e.message);
      throw e;
    }
  },

  async verifyDelivery(tripId, { otp, flowMeterReading, buyerSignatureName, notes }) {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/verify-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, flowMeterReading, buyerSignatureName, notes })
      });
      if (res.ok) {
        notifyMutation('delivery_verified_pod');
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to verify POD');
    } catch (e) {
      console.warn("[transporterApi] POD error:", e.message);
      throw e;
    }
  },

  async getFleet() {
    try {
      const res = await fetch(`${API_BASE}/fleet`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[transporterApi] Using fallback fleet:", e.message);
    }
    return [
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
        flowMeterCalibrated: true
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
        flowMeterCalibrated: true
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
        flowMeterCalibrated: true
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
        flowMeterCalibrated: true
      }
    ];
  },

  async addTanker(tankerData) {
    try {
      const res = await fetch(`${API_BASE}/fleet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tankerData)
      });
      if (res.ok) {
        notifyMutation('tanker_added');
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to add tanker');
    } catch (e) {
      console.warn("[transporterApi] Add tanker error:", e.message);
      throw e;
    }
  },

  async getPayouts() {
    try {
      const res = await fetch(`${API_BASE}/payouts`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[transporterApi] Using fallback payouts:", e.message);
    }
    return {
      wallet: fallbackTransporter.profile.wallet,
      payoutAccounts: fallbackTransporter.profile.payoutAccounts,
      payouts: [
        {
          id: "PAY-TRN-9021",
          tripRef: "DLV-821928",
          date: "2026-10-24 16:30",
          sourceName: "Millifont water STP",
          destinationName: "Finfee Park Facility",
          quantityLitres: 4500,
          distanceKm: 5.5,
          totalFee: 1355,
          method: "Direct Escrow Release",
          payoutChannel: "HDFC Bank (A/C ...2391)",
          status: "Settled",
          referenceNumber: "UTR-HDFC-993810291"
        },
        {
          id: "PAY-TRN-8814",
          tripRef: "DLV-772759",
          date: "2026-10-23 11:15",
          sourceName: "Multimiton water",
          destinationName: "Green Park Facility",
          quantityLitres: 4000,
          distanceKm: 4.8,
          totalFee: 1288,
          method: "Instant UPI Payout",
          payoutChannel: "ecoflow.fleet@okhdfcbank",
          status: "Settled",
          referenceNumber: "UPI-REF-48291048"
        }
      ]
    };
  },

  async requestPayout({ amount, method, destinationAccount }) {
    try {
      const res = await fetch(`${API_BASE}/payouts/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, destinationAccount })
      });
      if (res.ok) {
        notifyMutation('transporter_payout_withdrawn');
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to process payout');
    } catch (e) {
      console.warn("[transporterApi] Payout request error:", e.message);
      throw e;
    }
  }
};

