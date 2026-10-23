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
import { isDbConnected } from '../db.js';
import { SupplierListing } from '../models/SupplierListing.js';

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

  if (!db.sellerSources) db.sellerSources = [];
  if (!db.sellerRequests) db.sellerRequests = [];
  if (!db.sellerMatches) db.sellerMatches = [];
  if (!db.sellerDocuments) db.sellerDocuments = [];
  if (!db.sellerNotifications) db.sellerNotifications = [];
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

router.post('/sources', async (req, res) => {
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

  const isVerifiedLab = labReport && labReport.testDate && labReport.expiryDate;
  const isAvailable = req.body.available !== undefined ? Boolean(req.body.available) : true;

  const newSource = {
    id: `src-seller-${Date.now()}`,
    name: name.trim(),
    type: type.trim(),
    category: category || type.trim(),
    supplierId: "seed-supplier-1",
    supplierName: "Apex Commercial Facilities Ltd.",
    totalRegisteredQuantity: registeredQty,
    quantity: availQty,
    reservedQuantity: 0,
    deliveredQuantity: 0,
    minSupply: Number(minSupply) || 1000,
    maxSupply: Number(maxSupply) || registeredQty,
    distance: 5.5,
    indicativePrice: "₹0.10/L",
    pricePerLitre: 0.10,
    location: location ? location.trim() : (city ? `${city}, Tamil Nadu` : "Chennai, Tamil Nadu"),
    coordinates: coordinates && coordinates.length === 2 ? coordinates : [12.9800 + (Math.random() - 0.5) * 0.05, 80.2200 + (Math.random() - 0.5) * 0.05],
    intendedUses: Array.isArray(intendedUses) && intendedUses.length > 0 ? intendedUses : ["Landscaping", "Construction", "Dust Suppression", "Toilet Flushing"],
    description: description ? description.trim() : `Treated water source registered by supplier.`,
    replenishmentSchedule: replenishmentSchedule || "Daily replenishment",
    quality: isVerifiedLab ? "Verified" : (req.body.quality || "Verified"),
    verificationStatus: isVerifiedLab ? "Verified" : (req.body.verificationStatus || "Verified"),
    availabilityStatus: isAvailable ? "Available" : "Unavailable",
    available: isAvailable,
    reportExpiry: labReport?.expiryDate || "2027-04-30",
    lastUpdated: new Date().toISOString().split('T')[0],
    labReport: labReport ? {
      certId: labReport.certId || `LAB-${Date.now().toString().slice(-6)}`,
      labName: labReport.labName || "AquaCert Labs Quality Assurance",
      testDate: labReport.testDate || new Date().toISOString().split('T')[0],
      expiryDate: labReport.expiryDate || "2027-04-30",
      status: "Verified",
      ph: labReport.ph || 7.2,
      turbidity: labReport.turbidity || "1.2 NTU",
      tds: labReport.tds || "420 ppm",
      bod: labReport.bod || "4.5 mg/L",
      cod: labReport.cod || "18 mg/L",
      notes: labReport.notes || "Accredited laboratory quality testing certificate attached."
    } : null
  };

  db.sellerSources.unshift(newSource);

  // Sync to canonical platform sources catalog for buyer discoverability
  if (db.sources) {
    const existingIdx = db.sources.findIndex(s => s.id === newSource.id);
    if (existingIdx >= 0) {
      db.sources[existingIdx] = { ...newSource };
    } else {
      db.sources.unshift({ ...newSource });
    }
  }

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
      status: "Verified",
      parameters: {
        ph: newSource.labReport.ph,
        turbidity: newSource.labReport.turbidity,
        tds: newSource.labReport.tds,
        bod: newSource.labReport.bod,
        cod: newSource.labReport.cod
      },
      fileUrl: "/docs/sample_water_quality_report.pdf",
      fileSize: "1.2 MB",
      verificationNotes: "Uploaded by seller and verified for safe industrial/non-potable reuse."
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

  if (isDbConnected()) {
    try {
      await SupplierListing.create({
        listingCode: newSource.id,
        supplierName: newSource.supplierName || "Apex Commercial Facilities Ltd.",
        waterCategory: newSource.type || 'Treated Wastewater',
        title: newSource.name,
        description: newSource.description,
        totalQuantity: newSource.totalRegisteredQuantity,
        availableQuantity: newSource.quantity,
        indicativePrice: newSource.indicativePrice || "₹0.10/L",
        pricePerLitre: newSource.pricePerLitre || 0.10,
        intendedUses: newSource.intendedUses,
        location: {
          address: newSource.location,
          coordinates: newSource.coordinates
        },
        qualityVerified: true,
        verificationStatus: 'Verified',
        status: 'active'
      });
    } catch (dbErr) {
      console.warn("[seller.js] MongoDB sync error:", dbErr.message);
    }
  }

  res.status(201).json({ success: true, message: "Water source registered successfully and verified for platform reuse.", source: newSource });
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
