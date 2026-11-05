// server/routes/rescue.js
import express from 'express';
import {
  RESCUE_SCENARIOS,
  runRescueEngine,
  resolveRescueIncident,
  resetRescueSimulation,
  getRescueOverview
} from '../services/rescueService.js';

const router = express.Router();

/**
 * GET /api/rescue/overview
 * Returns active incident, live rescue statistics, standby nodes, and recent history.
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await getRescueOverview();
    res.json(overview);
  } catch (err) {
    console.error('[rescueRoutes] Error fetching rescue overview:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/rescue/scenarios
 * Returns the catalog of realistic disruption and sensor failure scenarios.
 */
router.get('/scenarios', (req, res) => {
  res.json({ scenarios: RESCUE_SCENARIOS });
});

/**
 * POST /api/rescue/simulate
 * Run the intelligent multi-stage ReLoop Rescue simulation.
 * Evaluates candidate suppliers, enforces Safe Reuse Gate, computes weighted ranking,
 * and generates dynamic route reassignment.
 */
router.post('/simulate', async (req, res) => {
  try {
    const {
      scenarioId,
      failedSourceId,
      demandId,
      searchRadiusKm,
      isSimulated = true
    } = req.body;

    const result = await runRescueEngine({
      scenarioId,
      failedSourceId,
      demandId,
      searchRadiusKm: Number(searchRadiusKm) || 10,
      isSimulated
    });

    res.json(result);
  } catch (err) {
    console.error('[rescueRoutes] Simulation error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/rescue/resolve
 * Confirm and dispatch the winning rescue alternative.
 */
router.post('/resolve', async (req, res) => {
  try {
    const { incidentId } = req.body;
    const result = await resolveRescueIncident(incidentId);
    res.json(result);
  } catch (err) {
    console.error('[rescueRoutes] Resolution error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/rescue/reset
 * Reset active simulation and restore baseline standby state.
 */
router.post('/reset', (req, res) => {
  try {
    const result = resetRescueSimulation();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rescue (Backward Compatible Fallback)
 * Accepts calls from legacy or simple triggers and routes through the rescue engine.
 */
router.post('/', async (req, res) => {
  try {
    const { demandId, failedSourceId, reason, searchRadiusKm } = req.body;
    
    // Choose appropriate scenario based on reason if available
    let scenarioId = 'CONTAMINATION_TURBIDITY';
    if (reason && reason.toLowerCase().includes('quantity')) {
      scenarioId = 'CAPACITY_DROP_75';
    } else if (reason && reason.toLowerCase().includes('delivery')) {
      scenarioId = 'DELIVERY_FAILURE';
    } else if (reason && reason.toLowerCase().includes('expire')) {
      scenarioId = 'QUALITY_CERT_EXPIRED';
    }

    const result = await runRescueEngine({
      scenarioId,
      failedSourceId,
      demandId,
      searchRadiusKm: Number(searchRadiusKm) || 10,
      isSimulated: true
    });

    res.json({
      success: true,
      message: result.winningAlternative 
        ? `ReLoop Rescue™ safely engaged! Selected ${result.winningAlternative.sourceName} (${result.winningAlternative.score}/100 score).`
        : 'Emergency Alert: No verified alternative available within safety criteria.',
      incident: result.incident,
      outcome: result.outcome,
      match: result.routeReassignment ? {
        id: `rescue-${Date.now()}`,
        sourceId: result.winningAlternative?.sourceId,
        sourceName: result.winningAlternative?.sourceName,
        quantity: result.routeReassignment.dispatchedVolumeLiters,
        distance: result.winningAlternative?.distanceKm,
        status: "Rescued",
        isRescue: true
      } : null,
      rescuedSource: result.winningAlternative,
      routeReassignment: result.routeReassignment,
      workflowStages: result.workflowStages,
      alternatives: result.evaluatedCandidates
    });
  } catch (err) {
    console.error('[rescueRoutes] Backward-compatible handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

