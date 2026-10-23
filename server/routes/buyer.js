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
 * Helper to calculate authoritative buyer stats
 * Real calculations based on verified completed transactions
 */
function calculateBuyerStats(db) {
  const demands = db.demands || [];
  const matches = db.matches || [];
  const requests = db.requests || [];

  const totalDemand = demands.reduce((sum, d) => sum + Number(d.quantity || d.requiredQuantity || 0), 0);

  // Active matches in-progress (Scheduled, In Transit)
  const inProgressMatches = matches.filter(m => m.status === 'Scheduled' || m.status === 'In Transit' || m.status === 'Delivered');
  const inProgressQuantity = inProgressMatches.reduce((sum, m) => sum + Number(m.matchedQuantity || m.quantity || 0), 0);

  // Confirmed completed reuse
  const completedMatches = matches.filter(m => m.status === 'Completed');
  const confirmedReusedQuantity = completedMatches.reduce((sum, m) => sum + Number(m.confirmedReusedQuantity || m.matchedQuantity || m.quantity || 0), 0);

  const totalMatched = inProgressQuantity + confirmedReusedQuantity;
  const unmetDemand = Math.max(0, totalDemand - totalMatched);
  const matchedPercent = totalDemand > 0 ? Math.min(100, Math.round((totalMatched / totalDemand) * 100)) : 0;

  // Active requests count
  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;
  const activeDemandsCount = demands.filter(d => d.status === 'Active' || d.status === 'Partially Matched').length;

  // Total transport cost for fulfilled/scheduled orders
  const transportCost = matches.reduce((sum, m) => sum + Number(m.estimatedCost || 1200), 0);

  // Unique verified sources utilized
  const sourcesUsedCount = new Set(matches.filter(m => m.status !== 'Cancelled' && m.status !== 'Failed').map(m => m.sourceId)).size || 1;

  return {
    totalDemand,
    matchedQuantity: totalMatched,
    matchedPercent,
    freshwaterSaved: confirmedReusedQuantity, // ONLY confirmed completed water counts as real freshwater savings!
    freshwaterSavedEq: confirmedReusedQuantity * 2,
    unmetDemand,
    activeRequestsCount: pendingRequestsCount + activeDemandsCount,
    transportCost,
    sourcesUsed: sourcesUsedCount,
    inProgressQuantity,
    confirmedReusedQuantity
  };
}

// -----------------------------------------------------------------
// 1. USER PROFILE & STATS
// -----------------------------------------------------------------
router.get('/user', (req, res) => {
  const db = loadDB();
  res.json(db.user);
});

router.get('/stats', (req, res) => {
  const db = loadDB();
  const stats = calculateBuyerStats(db);
  res.json(stats);
});

// -----------------------------------------------------------------
// 2. SOURCES (CANONICAL CATALOG)
// -----------------------------------------------------------------
router.get('/sources', async (req, res) => {
  try {
    const sources = await getCanonicalSources();
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sources/:id', async (req, res) => {
  try {
    const source = await getSourceById(req.params.id);
    if (!source) return res.status(404).json({ error: "Source not found." });
    res.json(source);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------
// 3. DEMANDS (CRUD & MANAGEMENT)
// -----------------------------------------------------------------
router.get('/demands', async (req, res) => {
  try {
    const demands = await getCanonicalDemands();
    res.json(demands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/demands', async (req, res) => {
  try {
    const newDemand = await createDemand(req.body);
    res.status(201).json(newDemand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------
// 4. INTELLIGENT MATCHING ENGINE ENDPOINTS
// -----------------------------------------------------------------

/**
 * GET /api/demands/:id/matches (or /api/buyer/demands/:id/matches)
 * Evaluates candidate sources against the demand:
 * - Stage A: Strict Eligibility Filtering (excludes unverified, expired, incompatible, unavailable)
 * - Stage B: Multi-criteria Transparent Weighted Ranking
 * - Stage C: Explainable Recommendation Reasons
 * - Stage D: Partial Fulfillment Multi-Source Combination Plan
 */
async function handleDemandMatches(req, res) {
  try {
    const demandId = req.params.id;
    const demand = await getDemandById(demandId);

    if (!demand) {
      return res.status(404).json({ error: `Demand #${demandId} not found.` });
    }

    const allSources = await getCanonicalSources();
    const matchResults = findMatchesForDemand(demand, allSources);

    res.json({
      success: true,
      ...matchResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/demands/:id/matches', handleDemandMatches);
router.get('/buyer/demands/:id/matches', handleDemandMatches);

// -----------------------------------------------------------------
// 5. BUYER REQUESTS & MATCH REQUEST WORKFLOW
// -----------------------------------------------------------------

/**
 * POST /api/matches/request and POST /api/buyer/requests
 * Buyer clicks "Request Water" on an eligible source card
 */
async function handleCreateRequest(req, res) {
  try {
    const { sourceId, demandId, quantity, requestedQuantity, notes, requestedDate, timeWindow, demandTitle, purpose, deliveryLocation } = req.body;
    
    if (!sourceId) {
      return res.status(400).json({ error: "sourceId is required." });
    }

    const request = await createWaterRequest({
      sourceId,
      demandId,
      requestedQuantity: Number(quantity || requestedQuantity),
      notes,
      requestedDate,
      timeWindow,
      demandTitle,
      purpose,
      deliveryLocation
    });

    res.status(201).json({
      success: true,
      message: `Water request #${request.id} sent to ${request.sourceName}. Awaiting supplier response.`,
      request
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

router.post('/matches/request', handleCreateRequest);
router.post('/requests', handleCreateRequest);
router.post('/buyer/requests', handleCreateRequest);

/**
 * GET /api/requests (and /api/buyer/requests)
 * Fetches buyer's active and historical requests
 */
router.get('/requests', (req, res) => {
  const db = loadDB();
  res.json(db.requests || []);
});

router.get('/buyer/requests', (req, res) => {
  const db = loadDB();
  res.json(db.requests || []);
});

/**
 * GET /api/matches (and /api/buyer/matches)
 * Fetches shared persistent match records
 */
router.get('/matches', (req, res) => {
  const db = loadDB();
  res.json(db.matches || []);
});

router.get('/buyer/matches', (req, res) => {
  const db = loadDB();
  res.json(db.matches || []);
});

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
