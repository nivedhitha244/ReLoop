import express from 'express';
import { getCanonicalSources, loadDB, saveDB, createDemand } from '../services/inventoryService.js';

const router = express.Router();

// Fallback empty store
let store = {
  stats: {
    totalDemand: 0,
    matchedQuantity: 0,
    matchedPercent: 0,
    freshwaterSaved: 0,
    freshwaterSavedEq: 0,
    unmetDemand: 0,
    activeRequestsCount: 0,
    transportCost: 0,
    sourcesUsed: 0
  },
  sources: [],
  demands: [],
  matches: [],
  activities: []
};

router.get('/stats', (req, res) => {
  try {
    const db = loadDB();
    const demands = db.demands || [];
    const matches = db.matches || [];
    const total = demands.reduce((sum, d) => sum + Number(d.quantity || d.requiredQuantity || 0), 0);
    const matched = matches.reduce((sum, m) => sum + Number(m.quantity || m.matchedQuantity || 0), 0);
    const unmet = Math.max(0, total - matched);
    const percent = total > 0 ? Math.round((matched / total) * 100) : 0;

    return res.json({
      totalDemand: total,
      matchedQuantity: matched,
      matchedPercent: percent,
      freshwaterSaved: matched,
      freshwaterSavedEq: matched * 2,
      unmetDemand: unmet,
      activeRequestsCount: demands.filter(d => d.status === 'Active' || d.status === 'Partially Matched').length,
      transportCost: Math.round(matched * 0.35),
      sourcesUsed: new Set(matches.map(m => m.sourceId)).size || 0
    });
  } catch (err) {
    console.warn("[dashboardRoutes] Error computing stats from DB:", err.message);
    res.json(store.stats);
  }
});

router.get('/sources', async (req, res) => {
  try {
    const sources = await getCanonicalSources();
    return res.json(sources || []);
  } catch (err) {
    console.warn("[dashboardRoutes] Error loading canonical sources:", err.message);
    res.json([]);
  }
});

router.get('/demands', (req, res) => {
  try {
    const db = loadDB();
    return res.json(db.demands || []);
  } catch (err) {
    console.warn("[dashboardRoutes] Error loading demands from DB:", err.message);
    res.json([]);
  }
});

router.post('/demands', async (req, res) => {
  try {
    const created = await createDemand(req.body);
    return res.status(201).json(created);
  } catch (err) {
    console.error("[dashboardRoutes] Error creating demand:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get('/matches', (req, res) => {
  try {
    const db = loadDB();
    return res.json(db.matches || []);
  } catch (err) {
    console.warn("[dashboardRoutes] Error loading matches from DB:", err.message);
    res.json([]);
  }
});

router.get('/activities', (req, res) => {
  try {
    const db = loadDB();
    return res.json(db.activities || []);
  } catch (err) {
    console.warn("[dashboardRoutes] Error loading activities from DB:", err.message);
    res.json([]);
  }
});

router.post('/rescue', (req, res) => {
  try {
    const db = loadDB();
    const { demandId, failedSourceId } = req.body;
    const targetDemand = (db.demands || []).find(d => d.id === demandId) || (db.demands || [])[0];
    const alternatives = (db.sources || []).filter(s => s.id !== failedSourceId && s.available);

    if (!targetDemand) {
      return res.status(404).json({ message: "No demand found to rescue. Please create a demand first." });
    }

    if (alternatives.length === 0) {
      return res.status(404).json({ message: "No alternative backup sources currently available." });
    }

    alternatives.sort((a, b) => {
      if (a.quality === 'Verified' && b.quality !== 'Verified') return -1;
      if (b.quality === 'Verified' && a.quality !== 'Verified') return 1;
      return (a.distance || 0) - (b.distance || 0);
    });

    const bestRescue = alternatives[0];
    const rescueQty = Math.min(bestRescue.quantity, targetDemand.quantity);

    const newMatch = {
      id: `rescue-${Date.now()}`,
      sourceId: bestRescue.id,
      sourceName: bestRescue.name + " (Rescue Alt)",
      demandId: targetDemand.id,
      destinationName: targetDemand.title,
      quantity: rescueQty,
      distance: bestRescue.distance || 3.5,
      status: "Rescued",
      matchedAt: "Just now",
      isRescue: true
    };

    db.matches = db.matches || [];
    db.matches.unshift(newMatch);

    db.activities = db.activities || [];
    db.activities.unshift({
      id: `act-${Date.now()}`,
      type: "rescue",
      title: "Emergency Rescue Matched",
      detail: `Rerouted ${rescueQty.toLocaleString()} L from ${bestRescue.name} to ${targetDemand.title}`,
      time: "Just now",
      icon: "shield-alert"
    });

    saveDB(db);
    res.status(201).json(newMatch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
