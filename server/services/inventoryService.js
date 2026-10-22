// server/services/inventoryService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDbConnected } from '../db.js';
import { SupplierListing } from '../models/SupplierListing.js';
import { BuyerRequest } from '../models/BuyerRequest.js';
import { Match } from '../models/Match.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data_store.json');

// Serialized concurrency mutex lock to prevent race conditions during inventory allocations
class AsyncLock {
  constructor() {
    this._queue = Promise.resolve();
  }

  acquire(fn) {
    const result = this._queue.then(() => fn());
    this._queue = result.catch(() => {});
    return result;
  }
}

const lock = new AsyncLock();

/**
 * Load database from data_store.json with robust structure initialization
 */
export function loadDB() {
  let db = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error("[inventoryService] Error reading DB file:", e);
      db = {};
    }
  }

  ensureCanonicalStructure(db);
  return db;
}

/**
 * Save database to data_store.json
 */
export function saveDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error("[inventoryService] Error writing DB file:", e);
  }
}

/**
 * Ensures shared, canonical data structures across both buyer and seller contexts
 */
function ensureCanonicalStructure(db) {
  if (!db.user) {
    db.user = {
      name: "Green Park",
      role: "Buyer",
      initials: "GP",
      location: "Chennai, Tamil Nadu",
      coordinates: [13.0827, 80.2707],
    };
  }

  if (!db.sellerProfile) {
    db.sellerProfile = {
      id: "seed-supplier-1",
      name: "Apex Tech Park STP",
      organization: "Apex Commercial Facilities Ltd.",
      role: "Seller / Water Supplier",
      initials: "AT",
      email: "supplier@reloop.org",
      phone: "+91 98111 22334",
      coordinates: [12.9800, 80.2200],
    };
  }

  if (!db.demands) db.demands = [];
  if (!db.sources) db.sources = [];
  if (!db.sellerSources) db.sellerSources = [];
  if (!db.requests) db.requests = [];
  if (!db.sellerRequests) db.sellerRequests = [];
  if (!db.matches) db.matches = [];
  if (!db.sellerMatches) db.sellerMatches = [];
  if (!db.activities) db.activities = [];
  if (!db.notifications) db.notifications = [];
  if (!db.sellerNotifications) db.sellerNotifications = [];
  if (!db.stats) db.stats = {};

  // Standardize existing sources so both buyer and seller view the SAME complete source inventory
  // If sellerSources has entries not in sources, merge them in
  const sourceMap = new Map();

  // First seed standard verified & available sources
  const defaultSources = [
    {
      id: "src-seller-1",
      name: "Apex Tech Park STP",
      supplierId: "seed-supplier-1",
      supplierName: "Apex Commercial Facilities Ltd.",
      type: "Treated Wastewater",
      category: "STP Treated Effluent",
      totalRegisteredQuantity: 15000,
      quantity: 9000,
      reservedQuantity: 0,
      deliveredQuantity: 6000,
      minSupply: 1000,
      maxSupply: 15000,
      location: "Sholinganallur, OMR, Chennai",
      coordinates: [12.9800, 80.2200],
      intendedUses: ["Landscaping", "HVAC Cooling", "Construction", "Toilet Flushing", "Irrigation"],
      quality: "Verified",
      verificationStatus: "Verified",
      availabilityStatus: "Available",
      available: true,
      reportExpiry: "2027-04-15",
      lastUpdated: "2026-10-22",
      description: "State-of-the-art Membrane Bioreactor (MBR) followed by UV disinfection, yielding clear, low-turbidity non-potable water.",
      indicativePrice: "₹0.12/L",
      pricePerLitre: 0.12,
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
      supplierId: "seed-supplier-1",
      supplierName: "Apex Commercial Facilities Ltd.",
      type: "Industrial",
      category: "Industrial Cooling Effluent",
      totalRegisteredQuantity: 8000,
      quantity: 5000,
      reservedQuantity: 0,
      deliveredQuantity: 3000,
      minSupply: 2000,
      maxSupply: 8000,
      location: "Ambattur Industrial Estate, Chennai",
      coordinates: [13.0878, 80.2785],
      intendedUses: ["Industrial Cooling", "Dust Suppression", "Ash Handling", "Construction", "Concrete Curing"],
      quality: "Verified",
      verificationStatus: "Verified",
      availabilityStatus: "Available",
      available: true,
      reportExpiry: "2027-02-28",
      lastUpdated: "2026-10-22",
      description: "Secondary blowdown from closed-loop cooling towers, filtered and neutral pH.",
      indicativePrice: "₹0.09/L",
      pricePerLitre: 0.09,
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
      supplierId: "seed-supplier-1",
      supplierName: "Apex Commercial Facilities Ltd.",
      type: "Greywater",
      category: "Residential & Commercial Greywater",
      totalRegisteredQuantity: 6000,
      quantity: 3500,
      reservedQuantity: 0,
      deliveredQuantity: 0,
      minSupply: 1000,
      maxSupply: 6000,
      location: "Perungudi Tech Zone, Chennai",
      coordinates: [12.9650, 80.2420],
      intendedUses: ["Irrigation", "Park Maintenance", "Road Washing", "Landscaping"],
      quality: "Pending Review",
      verificationStatus: "Pending Verification",
      availabilityStatus: "Pending Verification",
      available: false,
      reportExpiry: "Awaiting Lab Clearance",
      lastUpdated: "2026-10-22",
      description: "Filtered sink and wash water treated through activated sand and dual-stage carbon filters.",
      indicativePrice: "₹0.08/L",
      pricePerLitre: 0.08,
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
      supplierId: "seed-supplier-1",
      supplierName: "Apex Commercial Facilities Ltd.",
      type: "Rainwater",
      category: "Harvested Rainwater",
      totalRegisteredQuantity: 10000,
      quantity: 0,
      reservedQuantity: 0,
      deliveredQuantity: 0,
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
      pricePerLitre: 0.10,
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

  // Index existing sources
  for (const s of defaultSources) {
    sourceMap.set(s.id, { ...s });
  }

  for (const s of db.sellerSources) {
    if (sourceMap.has(s.id)) {
      sourceMap.set(s.id, { ...sourceMap.get(s.id), ...s });
    } else {
      sourceMap.set(s.id, {
        totalRegisteredQuantity: s.totalRegisteredQuantity || s.quantity || 5000,
        reservedQuantity: s.reservedQuantity || 0,
        deliveredQuantity: s.deliveredQuantity || 0,
        ...s
      });
    }
  }

  for (const s of db.sources) {
    if (sourceMap.has(s.id)) {
      sourceMap.set(s.id, { ...sourceMap.get(s.id), ...s });
    } else {
      sourceMap.set(s.id, {
        totalRegisteredQuantity: s.totalRegisteredQuantity || s.quantity || 5000,
        reservedQuantity: s.reservedQuantity || 0,
        deliveredQuantity: s.deliveredQuantity || 0,
        supplierId: "seed-supplier-1",
        supplierName: "Apex Commercial Facilities Ltd.",
        verificationStatus: s.quality || "Verified",
        ...s
      });
    }
  }

  const unifiedSources = Array.from(sourceMap.values());
  // Ensure inventory accounting formula for all sources:
  for (const s of unifiedSources) {
    if (s.reservedQuantity === undefined) s.reservedQuantity = 0;
    if (s.deliveredQuantity === undefined) s.deliveredQuantity = 0;
    if (s.totalRegisteredQuantity === undefined) {
      s.totalRegisteredQuantity = Number(s.quantity || 5000) + s.reservedQuantity + s.deliveredQuantity;
    }
    // Available quantity is clamped non-negative
    s.quantity = Math.max(0, s.totalRegisteredQuantity - s.reservedQuantity - s.deliveredQuantity);
    s.availableQuantity = s.quantity;
  }

  db.sources = unifiedSources;
  db.sellerSources = unifiedSources;

  // Unify requests
  const requestMap = new Map();
  for (const r of db.sellerRequests) requestMap.set(r.id, r);
  for (const r of db.requests) requestMap.set(r.id, { ...requestMap.get(r.id), ...r });

  const unifiedRequests = Array.from(requestMap.values());
  db.requests = unifiedRequests;
  db.sellerRequests = unifiedRequests;

  // Unify matches
  const matchMap = new Map();
  for (const m of db.sellerMatches) matchMap.set(m.id, m);
  for (const m of db.matches) matchMap.set(m.id, { ...matchMap.get(m.id), ...m });

  const unifiedMatches = Array.from(matchMap.values());
  db.matches = unifiedMatches;
  db.sellerMatches = unifiedMatches;
}

/**
 * Get all canonical sources
 */
export async function getCanonicalSources() {
  return lock.acquire(async () => {
    const db = loadDB();
    return db.sources;
  });
}

/**
 * Get source by ID
 */
export async function getSourceById(sourceId) {
  return lock.acquire(async () => {
    const db = loadDB();
    return db.sources.find(s => s.id === sourceId) || null;
  });
}

/**
 * Get all demands
 */
export async function getCanonicalDemands() {
  return lock.acquire(async () => {
    const db = loadDB();
    return db.demands;
  });
}

/**
 * Get demand by ID
 */
export async function getDemandById(demandId) {
  return lock.acquire(async () => {
    const db = loadDB();
    return db.demands.find(d => d.id === demandId) || null;
  });
}

/**
 * Create a new demand
 */
export async function createDemand(demandData) {
  return lock.acquire(async () => {
    const db = loadDB();
    const reqQty = Number(demandData.quantity || demandData.requiredQuantity);
    if (!reqQty || reqQty <= 0) {
      throw new Error("Required water quantity must be greater than 0 Litres.");
    }

    const newDemand = {
      id: demandData.id || `dem-${Date.now()}`,
      title: (demandData.title || "Water Demand").trim(),
      buyerId: demandData.buyerId || "seed-buyer-1",
      buyerName: demandData.buyerName || "Green Park",
      buyerOrg: demandData.buyerOrg || "Green Park Facilities",
      quantity: reqQty,
      requiredQuantity: reqQty,
      allocatedQuantity: 0,
      fulfilledQuantity: 0,
      remainingQuantity: reqQty,
      purpose: demandData.purpose || demandData.intendedUse || "General Reuse",
      status: "Active",
      statusColor: "green",
      deliveryLocation: demandData.deliveryLocation || "Chennai, Tamil Nadu",
      coordinates: demandData.coordinates || [13.0827, 80.2707],
      maxDistance: demandData.maxDistance ? Number(demandData.maxDistance) : 25,
      budgetPerLitre: demandData.budgetPerLitre || 0.15,
      requiredDate: demandData.requiredDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    db.demands.unshift(newDemand);
    db.activities.unshift({
      id: `act-${Date.now()}`,
      type: "demand",
      title: "New Demand Registered",
      detail: `${newDemand.title} - ${newDemand.quantity.toLocaleString()} L (${newDemand.purpose})`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      icon: "clipboard"
    });

    saveDB(db);

    // Sync to MongoDB if connected
    if (isDbConnected()) {
      try {
        await BuyerRequest.create({
          requestCode: newDemand.id,
          buyerName: newDemand.buyerName,
          title: newDemand.title,
          waterCategory: demandData.waterCategory || 'Treated Wastewater',
          requiredQuantity: newDemand.quantity,
          purpose: newDemand.purpose,
          intendedUse: newDemand.purpose,
          deliveryLocation: {
            address: newDemand.deliveryLocation,
            coordinates: newDemand.coordinates
          },
          status: 'Active'
        });
      } catch (err) {
        console.warn("[inventoryService] MongoDB sync error on demand create:", err.message);
      }
    }

    return newDemand;
  });
}

/**
 * Buyer submits request for water against a source and demand
 * Enforces authorization, eligibility, and remaining demand checks
 */
export async function createWaterRequest(params) {
  return lock.acquire(async () => {
    const db = loadDB();
    const {
      sourceId,
      demandId,
      requestedQuantity,
      buyerName,
      buyerOrg,
      notes,
      requestedDate,
      timeWindow
    } = params;

    const source = db.sources.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Water source '${sourceId}' not found.`);
    }

    const demand = db.demands.find(d => d.id === demandId);
    if (!demand) {
      throw new Error(`Water demand '${demandId}' not found.`);
    }

    // Check if demand is already fully satisfied
    const remainingDemand = demand.remainingQuantity !== undefined 
      ? demand.remainingQuantity 
      : Math.max(0, (demand.requiredQuantity || demand.quantity) - (demand.allocatedQuantity || 0) - (demand.fulfilledQuantity || 0));

    if (remainingDemand <= 0) {
      throw new Error(`Demand '${demand.title}' is already fully allocated or fulfilled. No further allocations permitted.`);
    }

    const reqQty = Number(requestedQuantity) || Math.min(source.quantity, remainingDemand);
    if (reqQty <= 0) {
      throw new Error("Requested water quantity must be greater than 0 Litres.");
    }

    if (reqQty > remainingDemand) {
      throw new Error(`Requested quantity (${reqQty.toLocaleString()} L) exceeds the remaining unmet demand (${remainingDemand.toLocaleString()} L).`);
    }

    // Check available unreserved quantity
    if (source.quantity < reqQty) {
      throw new Error(`Insufficient unreserved inventory: Source currently has ${source.quantity.toLocaleString()} L available, but ${reqQty.toLocaleString()} L was requested.`);
    }

    // Revalidate quality & safety eligibility
    if (source.verificationStatus !== 'Verified' && source.quality !== 'Verified') {
      throw new Error(`Source '${source.name}' has unverified water quality status ('${source.verificationStatus || source.quality}'). Unverified sources cannot be requested.`);
    }

    if (source.available === false || source.availabilityStatus === 'Unavailable') {
      throw new Error(`Source '${source.name}' is currently unavailable.`);
    }

    // Check duplicate pending request for same source and demand
    const duplicate = db.requests.find(r => 
      r.sourceId === sourceId && 
      r.demandId === demandId && 
      (r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Scheduled')
    );

    if (duplicate) {
      throw new Error(`An active request (#${duplicate.id}) already exists between demand '${demand.title}' and source '${source.name}'.`);
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      demandId: demand.id,
      demandTitle: demand.title,
      sourceId: source.id,
      sourceName: source.name,
      supplierId: source.supplierId || "seed-supplier-1",
      supplierName: source.supplierName || "Apex Commercial Facilities Ltd.",
      buyerName: buyerName || demand.buyerName || "Green Park",
      buyerOrg: buyerOrg || demand.buyerOrg || "Green Park Facilities",
      requestedQuantity: reqQty,
      intendedReuse: demand.purpose || "General Reuse",
      deliveryLocation: demand.deliveryLocation || "Chennai, Tamil Nadu",
      coordinates: demand.coordinates || [13.0827, 80.2707],
      requestedDate: requestedDate || demand.requiredDate || new Date().toISOString().split('T')[0],
      timeWindow: timeWindow || "Morning (09:00 AM - 12:00 PM)",
      estimatedDistance: source.distance || 4.5,
      estimatedDeliveryCost: Math.round(450 + ((source.distance || 4.5) * 110)),
      status: "Pending", // Requested, awaiting seller review
      notes: notes || `Water allocation request for ${demand.purpose}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.requests.unshift(newRequest);
    db.sellerRequests.unshift(newRequest);

    // Notify seller
    db.sellerNotifications.unshift({
      id: `notif-s-${Date.now()}`,
      title: "New Water Request Received",
      message: `${newRequest.buyerName} requested ${newRequest.requestedQuantity.toLocaleString()} L from ${source.name} for ${newRequest.intendedReuse}.`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      read: false,
      type: "request",
      targetTab: "incoming-requests"
    });

    db.activities.unshift({
      id: `act-${Date.now()}`,
      type: "request",
      title: "Water request sent",
      detail: `${newRequest.buyerName} → ${source.name} (${newRequest.requestedQuantity.toLocaleString()} L)`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      icon: "send"
    });

    saveDB(db);
    return newRequest;
  });
}

/**
 * Seller accepts a buyer request
 * CRITICAL: Performs safe atomic inventory reservation and prevents double-allocation
 */
export async function acceptWaterRequest(requestId) {
  return lock.acquire(async () => {
    const db = loadDB();
    const request = db.requests.find(r => r.id === requestId);
    if (!request) {
      throw new Error(`Request #${requestId} not found.`);
    }

    if (request.status !== 'Pending') {
      throw new Error(`Request #${requestId} has already been ${request.status.toLowerCase()}.`);
    }

    const source = db.sources.find(s => s.id === request.sourceId);
    if (!source) {
      throw new Error(`Source #${request.sourceId} associated with request not found.`);
    }

    // 1. Strict Eligibility Re-Check
    if (source.available === false || source.availabilityStatus === 'Unavailable') {
      throw new Error(`Cannot accept request: Source '${source.name}' is currently unavailable.`);
    }

    if (source.verificationStatus !== 'Verified' && source.quality !== 'Verified') {
      throw new Error(`Cannot accept request: Source '${source.name}' water quality status is '${source.verificationStatus || source.quality}'. Only lab-verified water can be allocated.`);
    }

    // 2. Strict Inventory Reservation Check
    if (source.quantity < request.requestedQuantity) {
      throw new Error(`Insufficient available inventory: Source has ${source.quantity.toLocaleString()} L available, but request requires ${request.requestedQuantity.toLocaleString()} L. Conflicting concurrent allocation detected.`);
    }

    // 3. Demand remaining balance check
    const demand = db.demands.find(d => d.id === request.demandId);
    if (demand) {
      const remaining = demand.remainingQuantity !== undefined 
        ? demand.remainingQuantity 
        : Math.max(0, (demand.requiredQuantity || demand.quantity) - (demand.allocatedQuantity || 0) - (demand.fulfilledQuantity || 0));
      
      if (remaining < request.requestedQuantity) {
        throw new Error(`Cannot accept request: Demand requires ${remaining.toLocaleString()} L remaining, but request allocates ${request.requestedQuantity.toLocaleString()} L.`);
      }

      demand.allocatedQuantity = (demand.allocatedQuantity || 0) + request.requestedQuantity;
      demand.remainingQuantity = Math.max(0, (demand.requiredQuantity || demand.quantity) - demand.allocatedQuantity - (demand.fulfilledQuantity || 0));
      if (demand.remainingQuantity === 0) {
        demand.status = "Matched";
      } else {
        demand.status = "Partially Matched";
      }
      demand.updatedAt = new Date().toISOString();
    }

    // 4. ATOMIC INVENTORY DEDUCTION & RESERVATION
    source.quantity -= request.requestedQuantity;
    source.availableQuantity = source.quantity;
    source.reservedQuantity = (source.reservedQuantity || 0) + request.requestedQuantity;
    source.lastUpdated = new Date().toISOString().split('T')[0];

    // Synchronize sellerSources mirror
    const sellerSource = db.sellerSources.find(s => s.id === source.id);
    if (sellerSource) {
      sellerSource.quantity = source.quantity;
      sellerSource.availableQuantity = source.quantity;
      sellerSource.reservedQuantity = source.reservedQuantity;
      sellerSource.lastUpdated = source.lastUpdated;
    }

    // 5. Update Request Status
    request.status = "Accepted";
    request.acceptedAt = new Date().toISOString();

    const sellerReq = db.sellerRequests.find(r => r.id === request.id);
    if (sellerReq) {
      sellerReq.status = "Accepted";
      sellerReq.acceptedAt = request.acceptedAt;
    }

    // 6. Create Persistent Match Record with Stable ID
    const newMatch = {
      id: `mat-${Date.now()}`,
      requestId: request.id,
      demandId: request.demandId,
      sourceId: source.id,
      sourceName: source.name,
      buyerName: request.buyerOrg || request.buyerName,
      buyerContact: "+91 98765 43210",
      supplierId: source.supplierId || "seed-supplier-1",
      supplierName: source.supplierName || "Apex Commercial Facilities Ltd.",
      matchedQuantity: request.requestedQuantity,
      quantity: request.requestedQuantity,
      intendedReuse: request.intendedReuse,
      distanceKm: request.estimatedDistance || 4.5,
      distance: request.estimatedDistance || 4.5,
      destinationLocation: request.deliveryLocation,
      destinationName: demand?.title || request.buyerName,
      pickupLocation: `${source.name} Loading Dock, ${source.location}`,
      status: "Scheduled", // Accepted -> Scheduled
      deliveryMethod: "Tanker Fleet Delivery",
      deliveryRef: `DLV-${Date.now().toString().slice(-6)}`,
      driverName: "Senthil Kumar (TN-09-CV-8841)",
      driverPhone: "+91 97890 44556",
      tankerCapacity: `${Math.ceil(request.requestedQuantity / 1000) * 1000} L`,
      estimatedCost: request.estimatedDeliveryCost || 1450,
      matchDate: new Date().toISOString().split('T')[0],
      scheduledDeliveryDate: request.requestedDate || new Date().toISOString().split('T')[0],
      instructions: `Transport ${request.requestedQuantity.toLocaleString()} L from ${source.name} to ${request.buyerName} for ${request.intendedReuse}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.matches.unshift(newMatch);
    db.sellerMatches.unshift(newMatch);

    // Notifications & Activities
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: "Water Request Accepted!",
      message: `${source.name} accepted your request for ${request.requestedQuantity.toLocaleString()} L. Delivery scheduled.`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      read: false,
      type: "match",
      targetTab: "my-matches"
    });

    db.sellerNotifications.unshift({
      id: `notif-s-${Date.now()}`,
      title: "Request Accepted & Reserved",
      message: `Allocated ${request.requestedQuantity.toLocaleString()} L from ${source.name} to ${request.buyerName}. Waybill ${newMatch.deliveryRef}.`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      read: false,
      type: "match",
      targetTab: "my-matches"
    });

    db.activities.unshift({
      id: `act-${Date.now()}`,
      type: "match",
      title: "Match Accepted & Water Reserved",
      detail: `${source.name} → ${request.buyerName} (${request.requestedQuantity.toLocaleString()} L)`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      icon: "link"
    });

    saveDB(db);

    // Sync with MongoDB if connected
    if (isDbConnected()) {
      try {
        await Match.create({
          matchCode: newMatch.id,
          sourceId: source.id,
          sourceName: source.name,
          demandId: request.demandId,
          destinationName: newMatch.destinationName,
          quantity: newMatch.matchedQuantity,
          distanceKm: newMatch.distanceKm,
          status: 'Matched',
          qualityVerified: true
        });
        await SupplierListing.findOneAndUpdate(
          { listingCode: source.id },
          { $inc: { availableQuantity: -request.requestedQuantity } }
        );
      } catch (err) {
        console.warn("[inventoryService] MongoDB sync error on accept:", err.message);
      }
    }

    return { request, match: newMatch, updatedSource: source };
  });
}

/**
 * Seller rejects a buyer request
 * Persists the rejection reason, does not deduct inventory, and allows buyer to discover alternatives
 */
export async function rejectWaterRequest(requestId, reason, notes = '') {
  return lock.acquire(async () => {
    const db = loadDB();
    const request = db.requests.find(r => r.id === requestId);
    if (!request) {
      throw new Error(`Request #${requestId} not found.`);
    }

    if (request.status !== 'Pending') {
      throw new Error(`Request #${requestId} has already been ${request.status.toLowerCase()}.`);
    }

    if (!reason) {
      throw new Error("A specific reason for declining the water request is required.");
    }

    request.status = "Rejected";
    request.rejectionReason = reason;
    request.rejectionNotes = notes;
    request.rejectedAt = new Date().toISOString();

    const sellerReq = db.sellerRequests.find(r => r.id === request.id);
    if (sellerReq) {
      sellerReq.status = "Rejected";
      sellerReq.rejectionReason = reason;
      sellerReq.rejectionNotes = notes;
      sellerReq.rejectedAt = request.rejectedAt;
    }

    // Notify buyer
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: "Water Request Declined",
      message: `Your request for ${request.requestedQuantity.toLocaleString()} L from ${request.sourceName} was declined: "${reason}". Click ReLoop Rescue to discover alternative sources.`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      read: false,
      type: "rescue",
      targetTab: "reloop-rescue"
    });

    db.activities.unshift({
      id: `act-${Date.now()}`,
      type: "rejection",
      title: "Request Declined by Supplier",
      detail: `${request.sourceName} declined request from ${request.buyerName} (${reason})`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      icon: "x-circle"
    });

    saveDB(db);
    return request;
  });
}

/**
 * Update match delivery lifecycle status (Scheduled -> In Transit -> Delivered -> Completed)
 * When Completed: transfers reserved quantity to delivered quantity and updates verified impact
 */
export async function updateMatchStatus(matchId, newStatus, details = {}) {
  return lock.acquire(async () => {
    const db = loadDB();
    const match = db.matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error(`Match record #${matchId} not found.`);
    }

    const validTransitions = {
      'Scheduled': ['In Transit', 'Cancelled'],
      'In Transit': ['Delivered', 'Cancelled', 'Failed'],
      'Delivered': ['Completed', 'Failed'],
      'Completed': [],
      'Cancelled': [],
      'Failed': []
    };

    const allowed = validTransitions[match.status] || [];
    if (!allowed.includes(newStatus) && match.status !== newStatus) {
      throw new Error(`Invalid status transition: Cannot transition match from '${match.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'None'}`);
    }

    const oldStatus = match.status;
    match.status = newStatus;
    match.updatedAt = new Date().toISOString();

    if (details.driverName) match.driverName = details.driverName;
    if (details.driverPhone) match.driverPhone = details.driverPhone;
    if (details.instructions) match.instructions = details.instructions;

    const source = db.sources.find(s => s.id === match.sourceId);
    const demand = db.demands.find(d => d.id === match.demandId);

    if (newStatus === 'In Transit') {
      match.dispatchedAt = new Date().toISOString();
    } else if (newStatus === 'Delivered') {
      match.deliveredAt = new Date().toISOString();
    } else if (newStatus === 'Completed') {
      match.completedAt = new Date().toISOString();
      match.confirmedReusedQuantity = match.matchedQuantity;

      // Transfer quantity from reserved -> delivered (EXACTLY ONCE)
      if (source && oldStatus !== 'Completed') {
        source.reservedQuantity = Math.max(0, (source.reservedQuantity || 0) - match.matchedQuantity);
        source.deliveredQuantity = (source.deliveredQuantity || 0) + match.matchedQuantity;
        source.quantity = Math.max(0, source.totalRegisteredQuantity - source.reservedQuantity - source.deliveredQuantity);
        source.availableQuantity = source.quantity;
      }

      // Update demand fulfilled quantity
      if (demand && oldStatus !== 'Completed') {
        demand.allocatedQuantity = Math.max(0, (demand.allocatedQuantity || 0) - match.matchedQuantity);
        demand.fulfilledQuantity = (demand.fulfilledQuantity || 0) + match.matchedQuantity;
        demand.remainingQuantity = Math.max(0, (demand.requiredQuantity || demand.quantity) - demand.allocatedQuantity - demand.fulfilledQuantity);
        if (demand.remainingQuantity === 0 && demand.allocatedQuantity === 0) {
          demand.status = "Fulfilled";
        }
      }

      // Record verified impact
      db.activities.unshift({
        id: `act-${Date.now()}`,
        type: "complete",
        title: "Water Reuse Successfully Completed",
        detail: `${match.matchedQuantity.toLocaleString()} L fulfilled from ${match.sourceName} to ${match.buyerName}`,
        time: "Just now",
        timestamp: new Date().toISOString(),
        icon: "award"
      });
    } else if (newStatus === 'Cancelled' || newStatus === 'Failed') {
      // Release reservation back to available inventory
      if (source && oldStatus !== 'Completed') {
        source.reservedQuantity = Math.max(0, (source.reservedQuantity || 0) - match.matchedQuantity);
        source.quantity = Math.max(0, source.totalRegisteredQuantity - source.reservedQuantity - (source.deliveredQuantity || 0));
        source.availableQuantity = source.quantity;
      }

      if (demand && oldStatus !== 'Completed') {
        demand.allocatedQuantity = Math.max(0, (demand.allocatedQuantity || 0) - match.matchedQuantity);
        demand.remainingQuantity = Math.max(0, (demand.requiredQuantity || demand.quantity) - demand.allocatedQuantity - (demand.fulfilledQuantity || 0));
        if (demand.status === 'Matched' || demand.status === 'Partially Matched') {
          demand.status = demand.fulfilledQuantity > 0 ? 'Partially Matched' : 'Active';
        }
      }
    }

    // Mirror to sellerMatches
    const sellerMatch = db.sellerMatches.find(m => m.id === match.id);
    if (sellerMatch) {
      Object.assign(sellerMatch, match);
    }

    saveDB(db);
    return match;
  });
}
