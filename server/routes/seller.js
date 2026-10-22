import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  loadDB, 
  saveDB, 
  acceptWaterRequest, 
  rejectWaterRequest, 
  updateMatchStatus, 
  getCanonicalSources 
} from '../services/inventoryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Seed comprehensive seller defaults into DB store if absent
function ensureSellerSeedData(db) {
  if (!db.sellerProfile) {
    db.sellerProfile = {
      id: "seed-supplier-1",
      name: "Apex Tech Park STP",
      organization: "Apex Commercial Facilities Ltd.",
      role: "Seller / Water Supplier",
      initials: "AT",
      email: "supplier@reloop.org",
      phone: "+91 98111 22334",
      facilityAddress: "Plot 14-B, OMR IT Expressway, Sholinganallur",
      city: "Chennai",
      region: "Tamil Nadu",
      postalCode: "600119",
      coordinates: [12.9800, 80.2200],
      operatingHours: "24/7 Continuous Treatment",
      contactPerson: "Dr. Rajesh Sundaram, Plant Operations Director",
      notificationsEnabled: true,
      emailAlerts: true,
      smsAlerts: false
    };
  }

  if (!db.sellerSources || db.sellerSources.length === 0) {
    db.sellerSources = [
      {
        id: "src-seller-1",
        name: "Apex Tech Park STP",
        type: "Treated Wastewater",
        category: "STP Treated Effluent",
        totalRegisteredQuantity: 15000,
        quantity: 9000,
        minSupply: 1000,
        maxSupply: 15000,
        location: "Sholinganallur, OMR, Chennai",
        coordinates: [12.9800, 80.2200],
        intendedUses: ["Landscaping", "HVAC Cooling", "Construction", "Toilet Flushing"],
        quality: "Verified",
        verificationStatus: "Verified",
        availabilityStatus: "Available",
        available: true,
        reportExpiry: "2027-04-15",
        lastUpdated: "2026-10-21",
        description: "State-of-the-art Membrane Bioreactor (MBR) followed by UV disinfection, yielding clear, low-turbidity non-potable water.",
        indicativePrice: "₹0.12/L",
        replenishmentSchedule: "Daily continuous output (~12,000 L/day)",
        labReport: {
          certId: "LAB-2026-098",
          labName: "AquaCert Labs Quality Assurance",
          testDate: "2026-09-15",
          expiryDate: "2027-04-15",
          status: "Verified",
          ph: 7.2,
          turbidity: "1.1 NTU",
          tds: "410 ppm",
          bod: "4.2 mg/L",
          cod: "18 mg/L",
          notes: "Compliant with CPCB Class B Standards for non-contact reuse."
        }
      },
      {
        id: "src-seller-2",
        name: "Factory A Cooling Blowdown",
        type: "Industrial",
        category: "Industrial Cooling Effluent",
        totalRegisteredQuantity: 8000,
        quantity: 5000,
        minSupply: 2000,
        maxSupply: 8000,
        location: "Ambattur Industrial Estate, Chennai",
        coordinates: [13.0878, 80.2785],
        intendedUses: ["Industrial Cooling", "Dust Suppression", "Ash Handling"],
        quality: "Verified",
        verificationStatus: "Verified",
        availabilityStatus: "Available",
        available: true,
        reportExpiry: "2027-02-28",
        lastUpdated: "2026-10-20",
        description: "Secondary blowdown from closed-loop cooling towers, filtered and neutral pH.",
        indicativePrice: "₹0.09/L",
        replenishmentSchedule: "Weekly batch replenishment (8,000 L every Friday)",
        labReport: {
          certId: "LAB-2026-044",
          labName: "State Environmental Testing Laboratory",
          testDate: "2026-08-20",
          expiryDate: "2027-02-28",
          status: "Verified",
          ph: 7.5,
          turbidity: "1.8 NTU",
          tds: "680 ppm",
          bod: "6.0 mg/L",
          cod: "24 mg/L",
          notes: "Approved for thermal power and manufacturing site reuse."
        }
      },
      {
        id: "src-seller-3",
        name: "Apex Central Greywater Bank",
        type: "Greywater",
        category: "Residential & Commercial Greywater",
        totalRegisteredQuantity: 6000,
        quantity: 3500,
        minSupply: 1000,
        maxSupply: 6000,
        location: "Perungudi Tech Zone, Chennai",
        coordinates: [12.9650, 80.2420],
        intendedUses: ["Irrigation", "Park Maintenance", "Road Washing"],
        quality: "Pending Review",
        verificationStatus: "Pending Verification",
        availabilityStatus: "Pending Verification",
        available: false,
        reportExpiry: "Awaiting Lab Clearance",
        lastUpdated: "2026-10-22",
        description: "Filtered sink and wash water treated through activated sand and dual-stage carbon filters.",
        indicativePrice: "₹0.08/L",
        replenishmentSchedule: "Daily 3,000 L generation",
        labReport: {
          certId: "LAB-2026-112",
          labName: "Metropolitan Testing Facility",
          testDate: "2026-10-18",
          expiryDate: "2027-04-18",
          status: "Pending Review",
          ph: 6.9,
          turbidity: "3.2 NTU",
          tds: "530 ppm",
          bod: "8.5 mg/L",
          cod: "32 mg/L",
          notes: "Audit sample submitted on 18 Oct 2026. Awaiting final bacterial pathogen panel."
        }
      },
      {
        id: "src-seller-4",
        name: "North Yard Rainwater Reservoir",
        type: "Rainwater",
        category: "Harvested Rainwater",
        totalRegisteredQuantity: 10000,
        quantity: 0,
        minSupply: 1500,
        maxSupply: 10000,
        location: "Kattankulathur Catchment, Chennai",
        coordinates: [12.8230, 80.0450],
        intendedUses: ["Landscaping", "Construction"],
        quality: "Expired Documentation",
        verificationStatus: "Expired Documentation",
        availabilityStatus: "Unavailable",
        available: false,
        reportExpiry: "2026-09-01 (Expired)",
        lastUpdated: "2026-09-15",
        description: "Surface retention reservoir. Temporarily suspended pending post-monsoon water testing audit.",
        indicativePrice: "₹0.10/L",
        replenishmentSchedule: "Seasonal rainwater catchment",
        labReport: {
          certId: "LAB-2025-089",
          labName: "EcoSafe Laboratory Solutions",
          testDate: "2025-08-25",
          expiryDate: "2026-09-01",
          status: "Expired",
          ph: 7.1,
          turbidity: "2.5 NTU",
          tds: "220 ppm",
          bod: "3.0 mg/L",
          cod: "12 mg/L",
          notes: "Documentation expired. Requires re-certification before matches can be fulfilled."
        }
      }
    ];
  }

  if (!db.sellerRequests || db.sellerRequests.length === 0) {
    db.sellerRequests = [
      {
        id: "req-101",
        buyerName: "Green Valley Residential Society",
        buyerOrg: "Green Valley Apartments",
        sourceId: "src-seller-1",
        sourceName: "Apex Tech Park STP",
        requestedQuantity: 4000,
        intendedReuse: "Irrigation & Landscaping",
        deliveryLocation: "Green Valley Towers, 2nd Main Rd, Anna Nagar, Chennai",
        requestedDate: "2026-10-23",
        timeWindow: "09:00 AM - 12:00 PM",
        estimatedDistance: 6.4,
        estimatedDeliveryCost: 1450,
        suitabilityStatus: "Fully Compliant",
        status: "Pending",
        createdAt: "2026-10-22T08:30:00.000Z",
        notes: "Require 4,000 L of treated water for maintaining 4 acres of apartment community lawns."
      },
      {
        id: "req-102",
        buyerName: "Metro Infrastructure Corp",
        buyerOrg: "Chennai Metro Line Extension Site",
        sourceId: "src-seller-2",
        sourceName: "Factory A Cooling Blowdown",
        requestedQuantity: 3000,
        intendedReuse: "Dust Suppression & Compaction",
        deliveryLocation: "Metro Pier 104, Guindy Industrial Corridor, Chennai",
        requestedDate: "2026-10-23",
        timeWindow: "02:00 PM - 05:00 PM",
        estimatedDistance: 4.8,
        estimatedDeliveryCost: 1100,
        suitabilityStatus: "Fully Compliant",
        status: "Pending",
        createdAt: "2026-10-22T10:15:00.000Z",
        notes: "Daily spraying required to control construction dust along corridor."
      },
      {
        id: "req-103",
        buyerName: "Olympia Horizon Commercial Park",
        buyerOrg: "Olympia Facilities Management",
        sourceId: "src-seller-1",
        sourceName: "Apex Tech Park STP",
        requestedQuantity: 5000,
        intendedReuse: "HVAC Cooling Towers",
        deliveryLocation: "Olympia Tech Park, Guindy, Chennai",
        requestedDate: "2026-10-21",
        timeWindow: "08:00 AM - 11:00 AM",
        estimatedDistance: 7.2,
        estimatedDeliveryCost: 1800,
        suitabilityStatus: "Fully Compliant",
        status: "Accepted",
        createdAt: "2026-10-21T09:00:00.000Z",
        notes: "Secondary supply for centralized chilled water cooling loops."
      },
      {
        id: "req-104",
        buyerName: "Kallikuppam Brick Works",
        buyerOrg: "Kallikuppam Clay & Concrete",
        sourceId: "src-seller-4",
        sourceName: "North Yard Rainwater Reservoir",
        requestedQuantity: 6000,
        intendedReuse: "Brick Curing",
        deliveryLocation: "Kallikuppam Industrial Belt, Chennai",
        requestedDate: "2026-10-20",
        timeWindow: "Full Day Delivery",
        estimatedDistance: 14.5,
        estimatedDeliveryCost: 2900,
        suitabilityStatus: "Ineligible (Expired Certificate)",
        status: "Rejected",
        rejectionReason: "Source documentation expired; pending re-audit.",
        createdAt: "2026-10-20T11:45:00.000Z",
        notes: "Rejected due to safety protocol requirements."
      }
    ];
  }

  if (!db.sellerMatches || db.sellerMatches.length === 0) {
    db.sellerMatches = [
      {
        id: "mat-s-501",
        requestId: "req-103",
        buyerName: "Olympia Tech Park Facilities",
        buyerContact: "+91 98450 11223",
        sourceId: "src-seller-1",
        sourceName: "Apex Tech Park STP",
        matchedQuantity: 5000,
        intendedReuse: "HVAC Cooling Towers",
        matchDate: "2026-10-21",
        status: "In Transit",
        deliveryMethod: "Dedicated Tanker Fleet",
        deliveryRef: "DLV-TN09-8841",
        driverName: "Senthil Kumar (TN-09-CV-8841)",
        driverPhone: "+91 97890 44556",
        tankerCapacity: "6,000 L",
        pickupLocation: "Apex Tech Park STP Outlet Bay 2",
        destinationLocation: "Olympia Tech Park, Guindy, Chennai",
        estimatedCost: 1800,
        scheduledDeliveryDate: "2026-10-22",
        dispatchedAt: "2026-10-22T09:15:00.000Z",
        instructions: "Discharge into Underground Cooling Basin #3. Driver holds safety gate pass."
      },
      {
        id: "mat-s-502",
        requestId: "req-prev-99",
        buyerName: "Green Valley Apartments",
        buyerContact: "+91 98765 43210",
        sourceId: "src-seller-1",
        sourceName: "Apex Tech Park STP",
        matchedQuantity: 4000,
        intendedReuse: "Irrigation",
        matchDate: "2026-10-19",
        status: "Completed",
        deliveryMethod: "Tanker Delivery",
        deliveryRef: "DLV-TN07-2231",
        driverName: "Murugan P. (TN-07-AL-2231)",
        driverPhone: "+91 98401 77889",
        tankerCapacity: "5,000 L",
        pickupLocation: "Apex Tech Park STP Bay 1",
        destinationLocation: "Green Valley Towers, Anna Nagar",
        estimatedCost: 1350,
        scheduledDeliveryDate: "2026-10-19",
        completedAt: "2026-10-19T14:30:00.000Z",
        confirmedReusedQuantity: 4000,
        instructions: "Unloaded into garden sprinkler holding tank. Water quality checklist signed by resident manager."
      },
      {
        id: "mat-s-503",
        requestId: "req-prev-98",
        buyerName: "Southline Construction Hub",
        buyerContact: "+91 98123 99887",
        sourceId: "src-seller-2",
        sourceName: "Factory A Cooling Blowdown",
        matchedQuantity: 5000,
        intendedReuse: "Concrete Curing",
        matchDate: "2026-10-18",
        status: "Completed",
        deliveryMethod: "Tanker Delivery",
        deliveryRef: "DLV-TN02-7711",
        driverName: "Ramesh Babu (TN-02-BQ-7711)",
        driverPhone: "+91 98222 33445",
        tankerCapacity: "5,000 L",
        pickupLocation: "Ambattur Plant Gate 4",
        destinationLocation: "Southline Project Site, Porur",
        estimatedCost: 1650,
        scheduledDeliveryDate: "2026-10-18",
        completedAt: "2026-10-18T16:00:00.000Z",
        confirmedReusedQuantity: 5000,
        instructions: "Delivered directly into curing sprinkler system."
      }
    ];
  }

  if (!db.sellerDocuments || db.sellerDocuments.length === 0) {
    db.sellerDocuments = [
      {
        id: "doc-101",
        sourceId: "src-seller-1",
        sourceName: "Apex Tech Park STP",
        title: "Comprehensive Tertiary Treated Water Quality Audit",
        labName: "AquaCert Labs Quality Assurance",
        accreditation: "NABL / ISO 17025 Certified",
        reportNumber: "LAB-2026-098",
        issueDate: "2026-09-15",
        expiryDate: "2027-04-15",
        status: "Verified",
        parameters: {
          ph: 7.2,
          turbidity: "1.1 NTU",
          tds: "410 ppm",
          bod: "4.2 mg/L",
          cod: "18 mg/L",
          totalColiform: "< 2 MPN/100mL"
        },
        fileUrl: "/docs/apex_stp_cert_2026.pdf",
        fileSize: "1.4 MB",
        verificationNotes: "All tested parameters meet or exceed standards for non-potable urban reuse."
      },
      {
        id: "doc-102",
        sourceId: "src-seller-2",
        sourceName: "Factory A Cooling Blowdown",
        title: "Heavy Metal & Mineral Content Screening Certificate",
        labName: "State Environmental Testing Laboratory",
        accreditation: "TNPCB Recognized",
        reportNumber: "LAB-2026-044",
        issueDate: "2026-08-20",
        expiryDate: "2027-02-28",
        status: "Verified",
        parameters: {
          ph: 7.5,
          turbidity: "1.8 NTU",
          tds: "680 ppm",
          bod: "6.0 mg/L",
          cod: "24 mg/L",
          heavyMetals: "Below detection limits"
        },
        fileUrl: "/docs/factory_a_screening_2026.pdf",
        fileSize: "890 KB",
        verificationNotes: "Approved for industrial dust suppression, cooling towers, and construction use."
      },
      {
        id: "doc-103",
        sourceId: "src-seller-3",
        sourceName: "Apex Central Greywater Bank",
        title: "Microbiological & Pathogen Safety Assay",
        labName: "Metropolitan Testing Facility",
        accreditation: "NABL Certified",
        reportNumber: "LAB-2026-112",
        issueDate: "2026-10-18",
        expiryDate: "2027-04-18",
        status: "Pending Review",
        parameters: {
          ph: 6.9,
          turbidity: "3.2 NTU",
          tds: "530 ppm",
          bod: "8.5 mg/L",
          cod: "32 mg/L"
        },
        fileUrl: "/docs/greywater_assay_pending.pdf",
        fileSize: "1.1 MB",
        verificationNotes: "Submitted on Oct 18. Official verification officer review scheduled within 48 hours."
      },
      {
        id: "doc-104",
        sourceId: "src-seller-4",
        sourceName: "North Yard Rainwater Reservoir",
        title: "Annual Retention Basin Water Quality Certificate",
        labName: "EcoSafe Laboratory Solutions",
        accreditation: "NABL Certified",
        reportNumber: "LAB-2025-089",
        issueDate: "2025-08-25",
        expiryDate: "2026-09-01",
        status: "Expired",
        parameters: {
          ph: 7.1,
          turbidity: "2.5 NTU",
          tds: "220 ppm",
          bod: "3.0 mg/L",
          cod: "12 mg/L"
        },
        fileUrl: "/docs/rainwater_cert_2025.pdf",
        fileSize: "620 KB",
        verificationNotes: "Expired on 01 Sep 2026. Source is currently suspended until a current test report is uploaded and verified."
      }
    ];
  }

  if (!db.sellerNotifications || db.sellerNotifications.length === 0) {
    db.sellerNotifications = [
      {
        id: "notif-s-1",
        title: "New Buyer Request Received",
        message: "Green Valley Apartments requested 4,000 L of STP treated water for lawn irrigation.",
        time: "15 minutes ago",
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        read: false,
        type: "request",
        targetTab: "incoming-requests"
      },
      {
        id: "notif-s-2",
        title: "New Dust Suppression Request",
        message: "Metro Infrastructure Corp placed a request for 3,000 L from Factory A.",
        time: "2 hours ago",
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        read: false,
        type: "request",
        targetTab: "incoming-requests"
      },
      {
        id: "notif-s-3",
        title: "Delivery Dispatched",
        message: "Tanker TN-09-CV-8841 is in transit carrying 5,000 L to Olympia Tech Park.",
        time: "3 hours ago",
        timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
        read: true,
        type: "delivery",
        targetTab: "delivery-tracking"
      },
      {
        id: "notif-s-4",
        title: "Quality Certificate Approaching Expiry",
        message: "Factory A screening certificate LAB-2026-044 expires in 4 months (Feb 2027).",
        time: "1 day ago",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        type: "verification",
        targetTab: "quality-verification"
      },
      {
        id: "notif-s-5",
        title: "Match Completed & Water Reused",
        message: "Delivery DLV-TN07-2231 successfully fulfilled 4,000 L to Green Valley Apartments.",
        time: "3 days ago",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        read: true,
        type: "match",
        targetTab: "my-matches"
      }
    ];
  }
}

// -------------------------------------------------------------
// 1. SELLER STATS (LIVE RE-CALCULATION)
// -------------------------------------------------------------
function calculateSellerStats(db) {
  const sources = db.sellerSources || [];
  const requests = db.sellerRequests || [];
  const matches = db.sellerMatches || [];

  // Total water registered by seller across all sources
  const totalWaterListed = sources.reduce((sum, s) => sum + Number(s.totalRegisteredQuantity || s.quantity || 0), 0);

  // Available water: only sources that are Available AND Verified (not suspended, exhausted, or expired)
  const eligibleSources = sources.filter(s => s.available && s.verificationStatus === 'Verified' && s.availabilityStatus === 'Available');
  const availableWater = eligibleSources.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

  // Active sources count
  const activeSourcesCount = eligibleSources.length;

  // Pending buyer requests
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;

  // Successful matches (Delivered or Completed)
  const completedMatches = matches.filter(m => m.status === 'Completed' || m.status === 'Delivered');
  const successfulMatchesCount = completedMatches.length;

  // Total quantity confirmed reused / delivered
  const totalWaterReusedDelivered = completedMatches.reduce((sum, m) => {
    return sum + Number(m.confirmedReusedQuantity || m.matchedQuantity || 0);
  }, 0);

  // Total quantity currently in active matches
  const activeMatchedQuantity = matches.reduce((sum, m) => sum + Number(m.matchedQuantity || 0), 0);

  // Utilization Rate: matched quantity relative to listed
  const utilizationRate = totalWaterListed > 0 
    ? Math.round((activeMatchedQuantity / totalWaterListed) * 100) 
    : 0;

  return {
    totalWaterListed,
    activeSourcesCount,
    availableWater,
    pendingRequests,
    successfulMatches: successfulMatchesCount,
    totalWaterReusedDelivered,
    utilizationRate,
    freshwaterSaved: totalWaterReusedDelivered,
    freshwaterSavedEq: totalWaterReusedDelivered * 2,
    co2AvoidedKg: Number((totalWaterReusedDelivered * 0.0016).toFixed(1)), // ~1.6 kg CO2 eq per 1000 L of treated water vs freshwater pumping
    revenueGenerated: completedMatches.reduce((sum, m) => sum + Number(m.estimatedCost || 0), 0)
  };
}

router.get('/stats', (req, res) => {
  const db = loadDB();
  const stats = calculateSellerStats(db);
  res.json(stats);
});

// -------------------------------------------------------------
// 2. SELLER PROFILE & SETTINGS
// -------------------------------------------------------------
router.get('/profile', (req, res) => {
  const db = loadDB();
  res.json(db.sellerProfile);
});

router.put('/profile', (req, res) => {
  const db = loadDB();
  db.sellerProfile = {
    ...db.sellerProfile,
    ...req.body,
    lastUpdated: new Date().toISOString()
  };
  saveDB(db);
  res.json({ success: true, message: "Seller profile updated successfully.", profile: db.sellerProfile });
});

// -------------------------------------------------------------
// 3. SELLER WATER SOURCES (CRUD & ACTIONS)
// -------------------------------------------------------------
router.get('/sources', (req, res) => {
  const db = loadDB();
  res.json(db.sellerSources || []);
});

router.post('/sources', (req, res) => {
  const db = loadDB();
  const {
    name,
    type,
    category,
    totalRegisteredQuantity,
    quantity,
    minSupply,
    maxSupply,
    location,
    city,
    coordinates,
    intendedUses,
    description,
    replenishmentSchedule,
    labReport
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Source name and water type are required." });
  }

  const registeredQty = Number(totalRegisteredQuantity || quantity || 5000);
  const availQty = Number(quantity !== undefined ? quantity : registeredQty);

  if (registeredQty < 0 || availQty < 0) {
    return res.status(400).json({ error: "Water quantities cannot be negative." });
  }

  if (availQty > registeredQty) {
    return res.status(400).json({ error: "Available quantity cannot exceed the registered total quantity." });
  }

  const newSource = {
    id: `src-seller-${Date.now()}`,
    name: name.trim(),
    type: type.trim(),
    category: category || type.trim(),
    totalRegisteredQuantity: registeredQty,
    quantity: availQty,
    minSupply: Number(minSupply) || 1000,
    maxSupply: Number(maxSupply) || registeredQty,
    location: location ? location.trim() : (city ? `${city}, Tamil Nadu` : "Chennai, Tamil Nadu"),
    coordinates: coordinates && coordinates.length === 2 ? coordinates : [12.9800 + (Math.random() - 0.5) * 0.05, 80.2200 + (Math.random() - 0.5) * 0.05],
    intendedUses: Array.isArray(intendedUses) && intendedUses.length > 0 ? intendedUses : ["Landscaping", "Construction", "Dust Suppression"],
    description: description ? description.trim() : "Registered water reuse source awaiting verification.",
    replenishmentSchedule: replenishmentSchedule || "Daily replenishment",
    quality: "Pending Review",
    verificationStatus: "Pending Verification",
    availabilityStatus: "Pending Verification",
    available: false, // Must be verified before matching!
    reportExpiry: labReport?.expiryDate || "Awaiting Verification",
    lastUpdated: new Date().toISOString().split('T')[0],
    labReport: labReport ? {
      certId: labReport.certId || `LAB-${Date.now().toString().slice(-6)}`,
      labName: labReport.labName || "Authorized Environmental Lab",
      testDate: labReport.testDate || new Date().toISOString().split('T')[0],
      expiryDate: labReport.expiryDate || "Pending Review",
      status: "Pending Review",
      ph: labReport.ph || 7.0,
      turbidity: labReport.turbidity || "2.0 NTU",
      tds: labReport.tds || "500 ppm",
      bod: labReport.bod || "5 mg/L",
      cod: labReport.cod || "20 mg/L",
      notes: labReport.notes || "Initial test document submitted for audit."
    } : null
  };

  db.sellerSources.unshift(newSource);

  // Add document record if lab report provided
  if (newSource.labReport) {
    db.sellerDocuments.unshift({
      id: `doc-${Date.now()}`,
      sourceId: newSource.id,
      sourceName: newSource.name,
      title: `${newSource.name} Safety & Quality Report`,
      labName: newSource.labReport.labName,
      accreditation: "NABL Accredited",
      reportNumber: newSource.labReport.certId,
      issueDate: newSource.labReport.testDate,
      expiryDate: newSource.labReport.expiryDate,
      status: "Pending Review",
      parameters: {
        ph: newSource.labReport.ph,
        turbidity: newSource.labReport.turbidity,
        tds: newSource.labReport.tds,
        bod: newSource.labReport.bod,
        cod: newSource.labReport.cod
      },
      fileUrl: "/docs/sample_water_quality_report.pdf",
      fileSize: "1.2 MB",
      verificationNotes: "Uploaded by seller. Pending official verifier audit."
    });
  }

  // Also reflect in general sources table for platform discoverability
  if (db.sources) {
    db.sources.push({
      id: newSource.id,
      name: newSource.name,
      type: newSource.type,
      iconType: "factory",
      quantity: newSource.quantity,
      distance: 5.5,
      quality: "Pending",
      coordinates: newSource.coordinates,
      available: false,
      description: newSource.description
    });
  }

  // Add notification
  db.sellerNotifications.unshift({
    id: `notif-s-${Date.now()}`,
    title: "New Water Source Registered",
    message: `${newSource.name} (${newSource.quantity.toLocaleString()} L) registered and submitted for quality verification.`,
    time: "Just now",
    timestamp: new Date().toISOString(),
    read: false,
    type: "source",
    targetTab: "my-sources"
  });

  saveDB(db);
  res.status(201).json({ success: true, message: "Water source registered successfully and submitted for audit.", source: newSource });
});

router.put('/sources/:id', (req, res) => {
  const db = loadDB();
  const sourceId = req.params.id;
  const idx = db.sellerSources.findIndex(s => s.id === sourceId);

  if (idx === -1) {
    return res.status(404).json({ error: "Water source not found." });
  }

  const current = db.sellerSources[idx];
  const updated = {
    ...current,
    ...req.body,
    id: current.id, // prevent ID overwrite
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  // Re-check quantities
  if (updated.quantity < 0 || updated.totalRegisteredQuantity < 0) {
    return res.status(400).json({ error: "Quantities cannot be negative." });
  }
  if (updated.quantity > updated.totalRegisteredQuantity) {
    return res.status(400).json({ error: "Available quantity cannot exceed total registered quantity." });
  }

  db.sellerSources[idx] = updated;
  saveDB(db);
  res.json({ success: true, message: "Water source details updated.", source: updated });
});

router.patch('/sources/:id/availability', (req, res) => {
  const db = loadDB();
  const sourceId = req.params.id;
  const source = db.sellerSources.find(s => s.id === sourceId);

  if (!source) {
    return res.status(404).json({ error: "Water source not found." });
  }

  const { available, availabilityStatus } = req.body;
  
  if (available !== undefined) {
    // If certificate is expired or rejected, cannot be made Available!
    if (available && (source.verificationStatus === 'Expired' || source.verificationStatus === 'Expired Documentation')) {
      return res.status(400).json({ 
        error: "Cannot mark source as Available: Its required water safety certificate is expired. Please submit an updated test report first." 
      });
    }

    source.available = Boolean(available);
    source.availabilityStatus = available ? "Available" : "Unavailable";
  } else if (availabilityStatus) {
    source.availabilityStatus = availabilityStatus;
    source.available = availabilityStatus === "Available";
  }

  source.lastUpdated = new Date().toISOString().split('T')[0];

  const matchedBuyerSource = (db.sources || []).find(s => s.id === sourceId);
  if (matchedBuyerSource) {
    matchedBuyerSource.available = source.available;
    matchedBuyerSource.availabilityStatus = source.availabilityStatus;
    matchedBuyerSource.lastUpdated = source.lastUpdated;
  }

  saveDB(db);
  res.json({ success: true, message: `Source availability updated to ${source.availabilityStatus}.`, source });
});

router.patch('/sources/:id/quantity', (req, res) => {
  const db = loadDB();
  const sourceId = req.params.id;
  const source = db.sellerSources.find(s => s.id === sourceId);

  if (!source) {
    return res.status(404).json({ error: "Water source not found." });
  }

  const { quantity } = req.body;
  const newQty = Number(quantity);

  if (isNaN(newQty) || newQty < 0) {
    return res.status(400).json({ error: "Please provide a valid, non-negative quantity." });
  }

  if (newQty > source.totalRegisteredQuantity) {
    return res.status(400).json({ 
      error: `Available quantity (${newQty.toLocaleString()} L) cannot exceed registered capacity (${source.totalRegisteredQuantity.toLocaleString()} L).` 
    });
  }

  source.quantity = newQty;
  source.availableQuantity = newQty;
  source.lastUpdated = new Date().toISOString().split('T')[0];

  const matchedBuyerSource = (db.sources || []).find(s => s.id === sourceId);
  if (matchedBuyerSource) {
    matchedBuyerSource.quantity = newQty;
    matchedBuyerSource.availableQuantity = newQty;
    matchedBuyerSource.lastUpdated = source.lastUpdated;
  }

  saveDB(db);
  res.json({ success: true, message: "Available quantity updated successfully.", source });
});

router.delete('/sources/:id', (req, res) => {
  const db = loadDB();
  const sourceId = req.params.id;
  
  // Cancel any active matches gracefully
  if (db.sellerMatches) {
    db.sellerMatches.forEach(m => {
      if (m.sourceId === sourceId && (m.status === 'In Transit' || m.status === 'Scheduled' || m.status === 'Accepted')) {
        m.status = 'Cancelled';
        m.cancellationReason = 'Source deleted by supplier.';
      }
    });
  }

  if (db.matches) {
    db.matches.forEach(m => {
      if (m.sourceId === sourceId && (m.status === 'In Transit' || m.status === 'Scheduled' || m.status === 'Accepted')) {
        m.status = 'Cancelled';
        m.cancellationReason = 'Source deleted by supplier.';
      }
    });
  }

  db.sellerSources = (db.sellerSources || []).filter(s => s.id !== sourceId);
  if (db.sources) {
    db.sources = db.sources.filter(s => s.id !== sourceId);
  }

  if (db.sellerDocuments) {
    db.sellerDocuments = db.sellerDocuments.filter(d => d.sourceId !== sourceId);
  }

  saveDB(db);
  res.json({ success: true, message: "Water source removed successfully.", deletedId: sourceId });
});

// -------------------------------------------------------------
// 4. INCOMING REQUESTS (RESPONSE WORKFLOW)
// -------------------------------------------------------------
router.get('/requests', (req, res) => {
  const db = loadDB();
  const { status } = req.query;
  let requests = db.sellerRequests || [];
  if (status && status !== 'All') {
    requests = requests.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }
  res.json(requests);
});

// ACCEPT BUYER REQUEST
router.post('/requests/:id/accept', async (req, res) => {
  try {
    const requestId = req.params.id;
    const result = await acceptWaterRequest(requestId);
    res.json({ 
      success: true, 
      message: `Request accepted! ${result.request.requestedQuantity.toLocaleString()} L allocated. Delivery scheduled.`,
      request: result.request,
      match: result.match,
      updatedSourceQuantity: result.updatedSource.quantity
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// REJECT BUYER REQUEST
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { reason, notes } = req.body;
    const request = await rejectWaterRequest(requestId, reason, notes);
    res.json({ 
      success: true, 
      message: "Request has been declined and buyer notified.", 
      request 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. MY MATCHES & DELIVERY FULFILLMENT
// -------------------------------------------------------------
router.get('/matches', (req, res) => {
  const db = loadDB();
  res.json(db.sellerMatches || []);
});

router.patch('/matches/:id/status', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { status, driverName, driverPhone, instructions } = req.body;
    const match = await updateMatchStatus(matchId, status, { driverName, driverPhone, instructions });
    res.json({ 
      success: true, 
      message: `Match status updated to ${status}.`, 
      match 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// 6. QUALITY & VERIFICATION CENTER
// -------------------------------------------------------------
router.get('/documents', (req, res) => {
  const db = loadDB();
  res.json(db.sellerDocuments || []);
});

router.post('/documents', (req, res) => {
  const db = loadDB();
  const {
    sourceId,
    title,
    labName,
    reportNumber,
    issueDate,
    expiryDate,
    parameters,
    verificationNotes
  } = req.body;

  if (!sourceId || !title || !labName) {
    return res.status(400).json({ error: "Source ID, Document Title, and Testing Laboratory name are required." });
  }

  const source = (db.sellerSources || []).find(s => s.id === sourceId);

  const newDoc = {
    id: `doc-${Date.now()}`,
    sourceId,
    sourceName: source?.name || "Water Source",
    title: title.trim(),
    labName: labName.trim(),
    accreditation: "NABL / ISO 17025 Certified",
    reportNumber: reportNumber || `LAB-${Date.now().toString().slice(-6)}`,
    issueDate: issueDate || new Date().toISOString().split('T')[0],
    expiryDate: expiryDate || "2027-04-30",
    status: "Pending Review",
    parameters: parameters || {
      ph: 7.2,
      turbidity: "1.2 NTU",
      tds: "450 ppm",
      bod: "4.5 mg/L",
      cod: "19 mg/L"
    },
    fileUrl: "/docs/uploaded_safety_cert.pdf",
    fileSize: "1.5 MB",
    verificationNotes: verificationNotes || "Submitted for verifier gatekeeper approval."
  };

  db.sellerDocuments.unshift(newDoc);

  // Update source documentation status if found
  if (source) {
    source.reportExpiry = newDoc.expiryDate;
    source.lastUpdated = new Date().toISOString().split('T')[0];
  }

  db.sellerNotifications.unshift({
    id: `notif-s-${Date.now()}`,
    title: "Quality Document Submitted",
    message: `${newDoc.title} submitted to Verifier portal. Awaiting compliance audit.`,
    time: "Just now",
    timestamp: new Date().toISOString(),
    read: false,
    type: "verification",
    targetTab: "quality-verification"
  });

  saveDB(db);
  res.status(201).json({ success: true, message: "Document submitted for verification.", document: newDoc });
});

// -------------------------------------------------------------
// 7. SELLER IMPACT REPORTS
// -------------------------------------------------------------
router.get('/impact', (req, res) => {
  const db = loadDB();
  const stats = calculateSellerStats(db);

  const monthlyTrends = [
    { month: "May 2026", listed: 20000, reused: 8000, matches: 3 },
    { month: "Jun 2026", listed: 25000, reused: 12000, matches: 5 },
    { month: "Jul 2026", listed: 28000, reused: 15500, matches: 6 },
    { month: "Aug 2026", listed: 30000, reused: 14000, matches: 6 },
    { month: "Sep 2026", listed: 35000, reused: 16500, matches: 7 },
    { month: "Oct 2026", listed: stats.totalWaterListed, reused: stats.totalWaterReusedDelivered, matches: stats.successfulMatches }
  ];

  const categoryBreakdown = [
    { category: "Treated Wastewater (STP)", volume: 15000, percentage: 52 },
    { category: "Industrial Cooling Blowdown", volume: 8000, percentage: 28 },
    { category: "Commercial Greywater", volume: 6000, percentage: 20 }
  ];

  res.json({
    stats,
    monthlyTrends,
    categoryBreakdown,
    sustainabilityMetrics: {
      freshwaterSavedLiters: stats.freshwaterSaved,
      co2ReductionKg: stats.co2AvoidedKg,
      totalEconomicValue: stats.revenueGenerated,
      activeSources: stats.activeSourcesCount,
      utilizationRate: stats.utilizationRate
    }
  });
});

// -------------------------------------------------------------
// 8. NOTIFICATIONS
// -------------------------------------------------------------
router.get('/notifications', (req, res) => {
  const db = loadDB();
  res.json(db.sellerNotifications || []);
});

router.patch('/notifications/:id/read', (req, res) => {
  const db = loadDB();
  const notifId = req.params.id;
  const notif = (db.sellerNotifications || []).find(n => n.id === notifId);
  if (notif) {
    notif.read = true;
    saveDB(db);
  }
  res.json({ success: true });
});

router.post('/notifications/read-all', (req, res) => {
  const db = loadDB();
  (db.sellerNotifications || []).forEach(n => { n.read = true; });
  saveDB(db);
  res.json({ success: true, message: "All notifications marked as read." });
});

// -------------------------------------------------------------
// 9. RELOOP RESCUE INTEGRATION (SELLER RECOVERY)
// -------------------------------------------------------------
router.post('/rescue', (req, res) => {
  const db = loadDB();
  const { sourceId, reason } = req.body;

  const affectedSource = (db.sellerSources || []).find(s => s.id === sourceId);

  if (!affectedSource) {
    return res.status(404).json({ error: "Source not found." });
  }

  // Suspend affected source immediately to prevent unsafe matching
  affectedSource.available = false;
  affectedSource.availabilityStatus = "Suspended";
  affectedSource.lastUpdated = new Date().toISOString().split('T')[0];

  // Identify eligible alternative sources from platform
  const alternatives = (db.sellerSources || []).filter(s => 
    s.id !== sourceId && 
    s.verificationStatus === 'Verified' && 
    s.quantity > 0
  );

  alternatives.sort((a, b) => b.quantity - a.quantity);

  const bestAlternative = alternatives.length > 0 ? alternatives[0] : null;

  // Log rescue event
  db.sellerNotifications.unshift({
    id: `notif-s-${Date.now()}`,
    title: "ReLoop Rescue™ Triggered",
    message: `${affectedSource.name} suspended (${reason || 'Capacity / safety alert'}). ${bestAlternative ? `Alternative ${bestAlternative.name} flagged as backup.` : 'No immediate backup available.'}`,
    time: "Just now",
    timestamp: new Date().toISOString(),
    read: false,
    type: "rescue",
    targetTab: "my-sources"
  });

  saveDB(db);
  res.json({
    success: true,
    message: "ReLoop Rescue protocol activated. Affected source safely suspended.",
    affectedSource,
    recommendedAlternative: bestAlternative,
    availableAlternativesCount: alternatives.length
  });
});

export default router;
