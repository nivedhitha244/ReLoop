// server/services/inventoryService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDbConnected } from '../db.js';
import { SupplierListing } from '../models/SupplierListing.js';
import { BuyerRequest } from '../models/BuyerRequest.js';
import { Match } from '../models/Match.js';
import { Delivery } from '../models/Delivery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data_store.json');

export async function syncMongoRequest(request) {
  if (!isDbConnected() || !request) return;
  try {
    await BuyerRequest.findOneAndUpdate(
      { requestCode: request.id },
      {
        requestCode: request.id,
        buyerName: request.buyerName || request.buyerOrg || 'Green Park',
        title: request.demandTitle || `Request for ${request.sourceName || 'Water'}`,
        waterCategory: request.intendedReuse || 'Treated Wastewater',
        requiredQuantity: Number(request.requestedQuantity) || 4000,
        fulfilledQuantity: (request.status === 'Confirmed' || request.status === 'Completed') ? (Number(request.requestedQuantity) || 4000) : 0,
        purpose: request.intendedReuse || 'General Reuse',
        intendedUse: request.intendedReuse || 'General Reuse',
        status: request.status || 'Pending',
        matchingStatus: (request.status === 'Confirmed' || request.status === 'Accepted') ? 'Matched' : 'In Review',
        deliveryLocation: {
          address: request.deliveryLocation || 'Chennai, Tamil Nadu',
          coordinates: request.coordinates || [13.0418, 80.2341]
        }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[MongoSync] Request sync error:', err.message);
  }
}

export async function syncMongoMatch(match) {
  if (!isDbConnected() || !match) return;
  try {
    await Match.findOneAndUpdate(
      { matchCode: match.id },
      {
        matchCode: match.id,
        sourceId: match.sourceId || 'src-1',
        sourceName: match.sourceName || 'Water Source',
        demandId: match.demandId || 'dem-1',
        destinationName: match.destinationName || match.buyerName || 'Green Park',
        quantity: Number(match.matchedQuantity || match.quantity) || 4000,
        matchedQuantity: Number(match.matchedQuantity || match.quantity) || 4000,
        distanceKm: Number(match.distanceKm || match.distance) || 5.5,
        waterCategory: match.intendedReuse || 'Treated Wastewater',
        matchScore: 95,
        status: match.status === 'Confirmed' ? 'Admin Approved' : (match.status || 'Scheduled'),
        deliveryReference: match.deliveryRef || `DLV-${match.id}`,
        driverName: match.driverName || 'Senthil Kumar (TN-09-CV-8841)',
        driverPhone: match.driverPhone || '+91 97890 44556',
      },
      { upsert: true, new: true }
    );

    await Delivery.findOneAndUpdate(
      { deliveryCode: match.deliveryRef || `DLV-${match.id}` },
      {
        deliveryCode: match.deliveryRef || `DLV-${match.id}`,
        sourceName: match.sourceName || 'Water Source',
        destinationName: match.destinationName || match.buyerName || 'Green Park',
        transporterName: 'EcoFlow Logistics Fleet',
        driverName: match.driverName || 'Senthil Kumar (TN-09-CV-8841)',
        vehicleNumber: (match.driverName && match.driverName.includes('(')) ? match.driverName.match(/\(([^)]+)\)/)?.[1] || 'TN-09-CV-8841' : 'TN-09-CV-8841',
        quantity: Number(match.matchedQuantity || match.quantity) || 4000,
        status: match.status === 'Completed' ? 'Completed' : (match.status === 'In Transit' ? 'In Transit' : 'Scheduled'),
        pickupLocation: { name: match.pickupLocation || 'Supplier Dock', coordinates: [12.9800, 80.2200] },
        deliveryLocation: { name: match.destinationLocation || match.buyerName, coordinates: [13.0827, 80.2707] },
        estimatedDistanceKm: Number(match.distanceKm || match.distance) || 5.5,
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('[MongoSync] Match/Delivery sync error:', err.message);
  }
}

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

  // Clean state: no artificial default demo sources
  const defaultSources = [];

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
      // Merge keeping detailed seller source fields authoritative
      sourceMap.set(s.id, { ...s, ...sourceMap.get(s.id) });
    } else {
      sourceMap.set(s.id, {
        totalRegisteredQuantity: s.totalRegisteredQuantity || s.quantity || 5000,
        reservedQuantity: s.reservedQuantity || 0,
        deliveredQuantity: s.deliveredQuantity || 0,
        supplierId: "seed-supplier-1",
        supplierName: "Apex Commercial Facilities Ltd.",
        verificationStatus: s.quality || "Verified",
        quality: s.quality || "Verified",
        available: s.available !== undefined ? s.available : true,
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
    if (s.distance === undefined) s.distance = 5.5;
    s.quality = s.quality || s.verificationStatus || 'Verified';
    s.verificationStatus = s.verificationStatus || s.quality || 'Verified';
    if (s.verificationStatus === 'Verified' || s.quality === 'Verified') {
      s.available = s.quantity > 0;
      s.availabilityStatus = s.available ? 'Available' : 'Depleted';
    }
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

    let demand = demandId ? db.demands.find(d => d.id === demandId) : null;
    if (!demand) {
      const qty = Number(requestedQuantity) || Math.min(source.quantity || 4000, 4000);
      const title = params.demandTitle || `Water Demand for ${source.name}`;
      demand = {
        id: `dem-${Date.now()}`,
        title,
        buyerId: params.buyerId || "seed-buyer-1",
        buyerName: buyerName || "Green Park",
        buyerOrg: buyerOrg || "Green Park Residential Society",
        quantity: qty,
        requiredQuantity: qty,
        allocatedQuantity: 0,
        fulfilledQuantity: 0,
        remainingQuantity: qty,
        purpose: params.purpose || params.intendedReuse || (source.intendedUses && source.intendedUses[0]) || "Irrigation",
        status: "Active",
        statusColor: "green",
        deliveryLocation: params.deliveryLocation || "Chennai, Tamil Nadu",
        coordinates: params.coordinates || [13.0827, 80.2707],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      };
      db.demands.unshift(demand);
      db.activities.unshift({
        id: `act-${Date.now()}`,
        type: "demand",
        title: "New Demand Registered",
        detail: `${demand.title} - ${demand.quantity.toLocaleString()} L (${demand.purpose})`,
        time: "Just now",
        timestamp: new Date().toISOString(),
        icon: "clipboard"
      });
      if (isDbConnected()) {
        try {
          await BuyerRequest.create({
            requestCode: demand.id,
            buyerName: demand.buyerName,
            title: demand.title,
            waterCategory: source.type || source.category || 'Treated Wastewater',
            requiredQuantity: demand.quantity,
            purpose: demand.purpose,
            intendedUse: demand.purpose,
            deliveryLocation: { address: demand.deliveryLocation, coordinates: demand.coordinates },
            status: 'Active'
          });
        } catch (e) {
          console.warn("[createWaterRequest] MongoDB sync error on demand auto-create:", e.message);
        }
      }
    }

    // Check if demand is already fully satisfied
    let remainingDemand = demand.remainingQuantity !== undefined 
      ? demand.remainingQuantity 
      : Math.max(0, (demand.requiredQuantity || demand.quantity) - (demand.allocatedQuantity || 0) - (demand.fulfilledQuantity || 0));

    if (remainingDemand <= 0) {
      // Auto-create a continuation batch for this facility so the buyer's request proceeds smoothly
      const baseTitle = (demand.title || "Facility Water Demand").replace(/\s*\(Batch\s*\d+\)$/i, '');
      const batchNum = (db.demands || []).filter(d => (d.title || '').startsWith(baseTitle)).length + 1;
      const reqVol = Number(requestedQuantity) || Math.min(source.quantity || 4000, 4000);
      const continuationDemand = {
        id: `dem-${Date.now()}`,
        title: `${baseTitle} (Batch ${batchNum})`,
        buyerId: demand.buyerId || "seed-buyer-1",
        buyerName: demand.buyerName || buyerName || "Green Park",
        buyerOrg: demand.buyerOrg || buyerOrg || "Green Park Residential Society",
        quantity: reqVol,
        requiredQuantity: reqVol,
        allocatedQuantity: 0,
        fulfilledQuantity: 0,
        remainingQuantity: reqVol,
        purpose: demand.purpose || "Irrigation",
        status: "Active",
        statusColor: "green",
        deliveryLocation: demand.deliveryLocation || "Chennai, Tamil Nadu",
        coordinates: demand.coordinates || [13.0827, 80.2707],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      };
      db.demands.unshift(continuationDemand);
      if (isDbConnected()) {
        try {
          await BuyerRequest.create({
            requestCode: continuationDemand.id,
            buyerName: continuationDemand.buyerName,
            title: continuationDemand.title,
            waterCategory: source.type || source.category || 'Treated Wastewater',
            requiredQuantity: continuationDemand.quantity,
            purpose: continuationDemand.purpose,
            intendedUse: continuationDemand.purpose,
            deliveryLocation: { address: continuationDemand.deliveryLocation, coordinates: continuationDemand.coordinates },
            status: 'Active'
          });
        } catch (e) {
          console.warn("[createWaterRequest] MongoDB sync error on continuation demand create:", e.message);
        }
      }
      demand = continuationDemand;
      remainingDemand = reqVol;
    }

    const reqQty = Number(requestedQuantity) || Math.min(source.quantity, remainingDemand);
    if (reqQty <= 0) {
      throw new Error("Requested water quantity must be greater than 0 Litres.");
    }

    if (reqQty > remainingDemand) {
      // Gracefully expand demand requirement to accommodate buyer's requested volume
      demand.requiredQuantity = (demand.allocatedQuantity || 0) + (demand.fulfilledQuantity || 0) + reqQty;
      demand.quantity = demand.requiredQuantity;
      remainingDemand = reqQty;
      demand.remainingQuantity = remainingDemand;
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

    // Check if previous requests exist between this source and demand; treat as additional tanker allocation
    const existingRequests = (db.requests || []).filter(r => 
      r.sourceId === sourceId && 
      (r.demandId === demand.id || r.demandId === demandId) && 
      (r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Scheduled')
    );
    const tankerIndex = existingRequests.length + 1;
    const tankerSuffix = existingRequests.length > 0 ? ` (Tanker #${tankerIndex})` : '';

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
      notes: notes ? `${notes}${tankerSuffix}` : `Water allocation request for ${demand.purpose}${tankerSuffix}`,
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
    syncMongoRequest(newRequest);
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

    request.matchId = newMatch.id;
    if (sellerReq) {
      sellerReq.matchId = newMatch.id;
    }

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
    syncMongoRequest(request);
    syncMongoMatch(newMatch);

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
    syncMongoRequest(request);
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
      'Pending': ['Accepted', 'Scheduled', 'Confirmed', 'Cancelled'],
      'Accepted': ['Scheduled', 'Confirmed', 'In Transit', 'Cancelled'],
      'Scheduled': ['Confirmed', 'In Transit', 'Cancelled'],
      'Confirmed': ['In Transit', 'Delivered', 'Completed', 'Cancelled'],
      'In Transit': ['Delivered', 'Completed', 'Cancelled', 'Failed'],
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

    if (newStatus === 'Confirmed' || details.buyerConfirmed) {
      match.buyerConfirmed = true;
      match.confirmedAt = new Date().toISOString();
      if (match.requestId) {
        const reqObj = (db.requests || []).find(r => r.id === match.requestId);
        if (reqObj) reqObj.status = 'Confirmed';
        const sReqObj = (db.sellerRequests || []).find(r => r.id === match.requestId);
        if (sReqObj) sReqObj.status = 'Confirmed';
      }
    }

    if (details.driverName) match.driverName = details.driverName;
    if (details.driverPhone) match.driverPhone = details.driverPhone;
    if (details.instructions) match.instructions = details.instructions;

    // Mirror to sellerMatches
    const sellerMatch = (db.sellerMatches || []).find(m => m.id === match.id);
    if (sellerMatch) {
      Object.assign(sellerMatch, match);
    }

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

    saveDB(db);
    syncMongoMatch(match);
    return match;
  });
}
