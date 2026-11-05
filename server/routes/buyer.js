// server/routes/buyer.js
import express from 'express';
import { 
  loadDB, 
  saveDB, 
  getCanonicalSources, 
  getSourceById, 
  getCanonicalDemands, 
  getDemandById, 
  createDemand, 
  createWaterRequest, 
  updateMatchStatus 
} from '../services/inventoryService.js';
import { findMatchesForDemand, checkEligibility, rankCandidateMatch } from '../services/matchingService.js';

const router = express.Router();

/**
 * GET /api/requests (and /api/buyer/requests)
 * Fetches buyer's active and historical requests formatted canonically
 */
const handleGetRequests = (req, res) => {
  const db = loadDB();
  const { status, category } = req.query;
  let requests = (db.requests || []).map(r => ({
    ...r,
    id: r.id,
    _id: r.id,
    requestCode: r.requestCode || r.id.toUpperCase().replace('REQ-', 'REQ-2026-'),
    buyerName: r.buyerName || 'Green Park Facilities',
    title: r.demandTitle || `Request to ${r.sourceName || 'Supplier'}`,
    sourceName: r.sourceName || 'Water Source',
    waterCategory: r.intendedReuse || r.waterCategory || 'Treated Wastewater',
    intendedReuse: r.intendedReuse || r.waterCategory || 'Treated Wastewater',
    requiredQuantity: Number(r.requestedQuantity || r.quantity) || 4000,
    requestedQuantity: Number(r.requestedQuantity || r.quantity) || 4000,
    fulfilledQuantity: r.status === 'Confirmed' || r.status === 'Completed' ? (Number(r.requestedQuantity || r.quantity) || 4000) : 0,
    purpose: r.intendedReuse || 'Irrigation',
    priority: r.priority || 'Standard',
    status: r.status || 'Pending',
    requestedDate: r.requestedDate || 'ASAP',
    createdAt: r.createdAt || new Date().toISOString()
  }));

  if (status && status !== 'all') {
    requests = requests.filter(r => (r.status || '').toLowerCase() === status.toLowerCase());
  }
  if (category && category !== 'all') {
    requests = requests.filter(r => (r.waterCategory || '').toLowerCase() === category.toLowerCase());
  }
  res.json(requests);
};

router.get('/requests', handleGetRequests);
router.get('/buyer/requests', handleGetRequests);

/**
 * GET /api/matches (and /api/buyer/matches)
 * Fetches shared persistent match records with canonical shape
 */
const handleGetMatches = (req, res) => {
  const db = loadDB();
  const { status } = req.query;
  let matches = (db.matches || []).map(m => ({
    ...m,
    id: m.id,
    _id: m.id,
    matchCode: m.matchCode || m.id.toUpperCase().replace('MAT-', 'MCH-2026-'),
    sourceName: m.sourceName || m.source || 'Water Source',
    destinationName: m.destinationName || m.buyerName || m.destination || 'Green Park Facility',
    buyerName: m.buyerName || m.destinationName || 'Green Park Facilities',
    quantity: Number(m.matchedQuantity || m.quantity) || 4000,
    matchedQuantity: Number(m.matchedQuantity || m.quantity) || 4000,
    distanceKm: Number(m.distanceKm || m.distance) || 5.5,
    waterCategory: m.intendedReuse || m.waterCategory || 'Treated Wastewater',
    matchScore: m.matchScore || 94,
    status: m.status || 'Scheduled',
    deliveryRef: m.deliveryRef || m.waybill || `DLV-${(m.id || Date.now()).toString().slice(-6)}`,
    deliveryReference: m.deliveryRef || m.waybill || `DLV-${(m.id || Date.now()).toString().slice(-6)}`,
    driverName: m.driverName || 'Senthil Kumar (TN-09-CV-8841)',
    driverPhone: m.driverPhone || '+91 97890 44556',
    tankerCapacity: m.tankerCapacity || `${m.matchedQuantity || m.quantity || 4000} L`,
    estimatedCost: m.estimatedCost || Math.round((Number(m.matchedQuantity || m.quantity) || 4000) * 0.25),
    createdAt: m.createdAt || new Date().toISOString()
  }));

  if (status && status !== 'all') {
    matches = matches.filter(m => (m.status || '').toLowerCase() === status.toLowerCase());
  }
  res.json(matches);
};

router.get('/matches', handleGetMatches);
router.get('/buyer/matches', handleGetMatches);

/**
 * POST /api/matches/:id/confirm
 * Buyer confirms receipt of delivered water
 */
router.post('/matches/:id/confirm', async (req, res) => {
  try {
    const matchId = req.params.id;
    const match = await updateMatchStatus(matchId, 'Completed', {
      instructions: "Receipt confirmed by buyer. Quality checklist verified upon discharge."
    });

    res.json({
      success: true,
      message: `Delivery receipt confirmed for ${match.matchedQuantity.toLocaleString()} L. Fresh water savings recorded!`,
      match
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/buyer/matches/:id/confirm-agreement
 * Buyer accepts / confirms the match agreement (transitions to Confirmed)
 */
const handleConfirmMatchAgreement = async (req, res) => {
  try {
    const identifier = req.params.id;
    const db = loadDB();

    // Check if identifier is matchId or requestId
    let match = (db.matches || []).find(m => m.id === identifier);
    if (!match) {
      match = (db.matches || []).find(m => m.requestId === identifier);
    }

    if (!match) {
      // Check if identifier is a request that can be promoted to a confirmed match
      const reqObj = (db.requests || []).find(r => r.id === identifier);
      if (reqObj) {
        const source = (db.sources || []).find(s => s.id === reqObj.sourceId) || {};
        match = {
          id: `mat-${Date.now()}`,
          requestId: reqObj.id,
          demandId: reqObj.demandId,
          sourceId: reqObj.sourceId,
          sourceName: reqObj.sourceName || source.name || 'Water Source',
          buyerName: reqObj.buyerName || 'Buyer',
          matchedQuantity: reqObj.requestedQuantity || 4000,
          quantity: reqObj.requestedQuantity || 4000,
          intendedReuse: reqObj.intendedReuse || 'Reuse',
          distanceKm: reqObj.estimatedDistance || 4.5,
          distance: reqObj.estimatedDistance || 4.5,
          destinationLocation: reqObj.deliveryLocation,
          status: 'Confirmed',
          buyerConfirmed: true,
          deliveryRef: `DLV-${Date.now().toString().slice(-6)}`,
          driverName: "Senthil Kumar (TN-09-CV-8841)",
          driverPhone: "+91 97890 44556",
          tankerCapacity: `${reqObj.requestedQuantity || 4000} L`,
          matchDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.matches.unshift(match);
        db.sellerMatches = db.sellerMatches || [];
        db.sellerMatches.unshift(match);
        reqObj.status = 'Confirmed';
        reqObj.matchId = match.id;
        saveDB(db);
        return res.json({
          success: true,
          message: "Match Confirmed! Tanker dispatch is ready and waybill active.",
          match
        });
      }
      return res.status(404).json({ error: `Match for identifier ${identifier} not found.` });
    }

    const updated = await updateMatchStatus(match.id, 'Confirmed', {
      buyerConfirmed: true,
      instructions: "Match agreement accepted & confirmed by buyer. Tanker dispatch ready."
    });

    res.json({
      success: true,
      message: "Match Confirmed! Tanker dispatch is ready and waybill active.",
      match: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

router.post('/matches/:id/confirm-agreement', handleConfirmMatchAgreement);
router.post('/buyer/matches/:id/confirm-agreement', handleConfirmMatchAgreement);

const handlePatchMatchStatus = async (req, res) => {
  try {
    const identifier = req.params.id;
    const { status, instructions, driverName, driverPhone } = req.body;
    const db = loadDB();
    let match = (db.matches || []).find(m => m.id === identifier);
    if (!match) match = (db.matches || []).find(m => m.requestId === identifier);

    if (!match) {
      // Check if identifier is a request in db.requests or db.sellerRequests
      const reqObj = (db.requests || []).find(r => r.id === identifier) || (db.sellerRequests || []).find(r => r.id === identifier);
      if (reqObj) {
        if (reqObj.matchId) {
          match = (db.matches || []).find(m => m.id === reqObj.matchId);
        }
        if (!match) {
          const source = (db.sources || []).find(s => s.id === reqObj.sourceId) || {};
          match = {
            id: `mat-${Date.now()}`,
            requestId: reqObj.id,
            demandId: reqObj.demandId,
            sourceId: reqObj.sourceId,
            sourceName: reqObj.sourceName || source.name || 'Water Source',
            buyerName: reqObj.buyerName || 'Buyer',
            matchedQuantity: reqObj.requestedQuantity || 4000,
            quantity: reqObj.requestedQuantity || 4000,
            intendedReuse: reqObj.intendedReuse || 'Reuse',
            distanceKm: reqObj.estimatedDistance || 4.5,
            distance: reqObj.estimatedDistance || 4.5,
            destinationLocation: reqObj.deliveryLocation,
            status: status || 'In Transit',
            buyerConfirmed: true,
            deliveryRef: `DLV-${Date.now().toString().slice(-6)}`,
            driverName: driverName || "Senthil Kumar (TN-09-CV-8841)",
            driverPhone: driverPhone || "+91 97890 44556",
            instructions: instructions || "Tanker dispatched.",
            tankerCapacity: `${reqObj.requestedQuantity || 4000} L`,
            matchDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          db.matches.unshift(match);
          db.sellerMatches = db.sellerMatches || [];
          db.sellerMatches.unshift(match);
          reqObj.status = status === 'In Transit' ? 'In Transit' : 'Confirmed';
          reqObj.matchId = match.id;
          saveDB(db);
          return res.json({ success: true, message: `Match status updated to ${status || 'In Transit'}.`, match });
        }
      }
    }

    if (!match) {
      return res.status(404).json({ error: `Match #${identifier} not found.` });
    }

    const updated = await updateMatchStatus(match.id, status || 'Confirmed', {
      instructions,
      driverName,
      driverPhone,
      buyerConfirmed: status === 'Confirmed' ? true : undefined
    });

    res.json({ success: true, message: `Match status updated to ${status || 'Confirmed'}.`, match: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

router.patch('/matches/:id/status', handlePatchMatchStatus);
router.patch('/buyer/matches/:id/status', handlePatchMatchStatus);

// -----------------------------------------------------------------
// 6. RELOOP RESCUE™ RECOVERY WORKFLOW
// -----------------------------------------------------------------

/**
 * POST /api/rescue and POST /api/rescue/alternatives
 * Triggered when a source becomes unavailable, document expires, or request is rejected.
 * Locates verified alternative sources and provides failover routing plan without auto-transferring.
 */
router.post('/rescue', async (req, res) => {
  try {
    const { demandId, failedSourceId, reason } = req.body;
    const db = loadDB();

    const targetDemand = demandId ? await getDemandById(demandId) : (db.demands[0] || null);
    if (!targetDemand) {
      return res.status(404).json({ error: "No active demand found to apply ReLoop Rescue." });
    }

    const allSources = await getCanonicalSources();
    // Exclude the failed or rejected source from candidate pool
    const candidateSources = allSources.filter(s => s.id !== failedSourceId);

    // Run matching engine
    const matchingResult = findMatchesForDemand(targetDemand, candidateSources);

    // Record Rescue audit activity
    const rescueRecord = {
      id: `rescue-${Date.now()}`,
      type: "rescue",
      title: "ReLoop Rescue™ Failover Protocol Activated",
      detail: `Alternative scan for ${targetDemand.title} (${targetDemand.quantity.toLocaleString()} L). Found ${matchingResult.totalEligible} verified standby backup nodes.`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      icon: "shield-alert"
    };

    db.activities.unshift(rescueRecord);
    saveDB(db);

    res.json({
      success: true,
      message: `ReLoop Rescue activated! Found ${matchingResult.totalEligible} verified alternative source(s) in proximity.`,
      demand: targetDemand,
      failedSourceId: failedSourceId || null,
      disruptionReason: reason || "Source unavailable or request rejected",
      alternatives: matchingResult.eligibleMatches,
      partialFulfillmentPlan: matchingResult.partialFulfillmentPlan,
      recommendedBackup: matchingResult.eligibleMatches[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------
// 7. ACTIVITIES & AUDIT FEED
// -----------------------------------------------------------------
router.get('/activities', (req, res) => {
  const db = loadDB();
  res.json(db.activities || []);
});

export default router;
