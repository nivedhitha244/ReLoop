// tests/rescueContinuousShield.test.js
import assert from 'assert';
import {
  RESCUE_SCENARIOS,
  evaluateSafeReuseGate,
  rankRescueAlternative,
  runRescueEngine,
  resolveRescueIncident,
  resetRescueSimulation,
  getRescueOverview
} from '../server/services/rescueService.js';
import { loadDB, saveDB } from '../server/services/inventoryService.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('=== STARTING RELOOP RESCUE™ CONTINUOUS SUPPLY SHIELD TEST SUITE ===');

// 1. Scenario Catalog Verification
test('Rescue Catalog has 6 Realistic Disruption Scenarios', () => {
  assert(RESCUE_SCENARIOS.length >= 6, 'Must define at least 6 disruption scenarios');
  const ids = RESCUE_SCENARIOS.map(s => s.id);
  assert(ids.includes('CONTAMINATION_TURBIDITY'), 'Missing CONTAMINATION_TURBIDITY');
  assert(ids.includes('CONTAMINATION_PH'), 'Missing CONTAMINATION_PH');
  assert(ids.includes('CAPACITY_DROP_75'), 'Missing CAPACITY_DROP_75');
  assert(ids.includes('SUPPLIER_UNAVAILABLE'), 'Missing SUPPLIER_UNAVAILABLE');
  assert(ids.includes('DELIVERY_FAILURE'), 'Missing DELIVERY_FAILURE');
  assert(ids.includes('QUALITY_CERT_EXPIRED'), 'Missing QUALITY_CERT_EXPIRED');

  // Verify telemetry fields
  for (const s of RESCUE_SCENARIOS) {
    assert(s.sensorMetric, `${s.id} missing sensorMetric`);
    assert(s.sensorValue, `${s.id} missing sensorValue`);
    assert(s.safeThreshold, `${s.id} missing safeThreshold`);
    assert(s.severity, `${s.id} missing severity`);
  }
});

// 2. Safe Reuse Gate Unit Tests
test('Safe Reuse Gate: Rejects Unverified Quality Sources', () => {
  const unverifiedSource = {
    id: 'src-unverified',
    name: 'Unverified Borewell Plant',
    type: 'Treated Wastewater',
    quality: 'Pending',
    verificationStatus: 'Pending',
    quantity: 10000,
    available: true
  };
  const demand = { purpose: 'Irrigation', requiredQuantity: 4000 };
  const gateResult = evaluateSafeReuseGate(unverifiedSource, demand);
  assert.strictEqual(gateResult.passed, false, 'Unverified source must fail Safe Reuse Gate');
  assert(gateResult.rejectionReason.includes('lab verification'), 'Expected rejection reason on verification');
});

test('Safe Reuse Gate: Rejects Expired Lab Documentation', () => {
  const expiredSource = {
    id: 'src-expired',
    name: 'Expired Lab Certificate Plant',
    type: 'Treated Wastewater',
    quality: 'Verified',
    verificationStatus: 'Verified',
    reportExpiry: '2025-01-15', // Past date
    quantity: 10000,
    available: true
  };
  const demand = { purpose: 'Irrigation', requiredQuantity: 4000 };
  const gateResult = evaluateSafeReuseGate(expiredSource, demand);
  assert.strictEqual(gateResult.passed, false, 'Expired documentation must fail Safe Reuse Gate');
  assert(gateResult.rejectionReason.includes('expired'), 'Expected rejection reason mentioning expiry');
});

test('Safe Reuse Gate: Rejects CPCB Incompatible Water Types (e.g. RO Reject for Turf)', () => {
  const roRejectSource = {
    id: 'src-ro',
    name: 'IT Park RO Reject Outlet',
    type: 'RO Reject Water',
    quality: 'Verified',
    verificationStatus: 'Verified',
    reportExpiry: '2027-10-15',
    quantity: 10000,
    available: true
  };
  const turfDemand = { purpose: 'Landscaping & Turf Irrigation', requiredQuantity: 4000 };
  const gateResult = evaluateSafeReuseGate(roRejectSource, turfDemand);
  assert.strictEqual(gateResult.passed, false, 'RO Reject water must not be approved for turf irrigation');
  assert(gateResult.rejectionReason.includes('incompatible'), 'Expected incompatible rejection reason');
});

test('Safe Reuse Gate: Passes Verified, Compatible Source within pH & Turbidity Standards', () => {
  const compliantSource = {
    id: 'src-compliant',
    name: 'Apex Tertiary Ultrafiltration STP',
    type: 'Treated Wastewater',
    quality: 'Verified',
    verificationStatus: 'Verified',
    reportExpiry: '2027-10-15',
    quantity: 10000,
    available: true,
    intendedUses: ['Irrigation', 'Construction', 'Toilet Flushing'],
    labReport: {
      ph: 7.2,
      turbidity: '1.4 NTU',
      expiryDate: '2027-10-15'
    }
  };
  const irrigationDemand = { purpose: 'Irrigation', requiredQuantity: 4000 };
  const gateResult = evaluateSafeReuseGate(compliantSource, irrigationDemand);
  assert.strictEqual(gateResult.passed, true, 'Compliant source must pass Safe Reuse Gate');
  assert.strictEqual(gateResult.rejectionReason, null);
  assert(gateResult.checks.every(c => c.passed), 'All 4 gate checks must pass');
});

// 3. Intelligent Weighted Ranking & Radius Enforcement Tests
test('Alternative Ranking: Disqualifies Suppliers Outside Configured Radius', () => {
  const farSource = {
    id: 'src-far',
    name: 'Distant Basin Plant',
    type: 'Treated Wastewater',
    quality: 'Verified',
    verificationStatus: 'Verified',
    reportExpiry: '2027-10-15',
    quantity: 10000,
    available: true,
    coordinates: [13.2500, 80.4500] // ~28 km away from Chennai center
  };
  const demand = {
    coordinates: [13.0827, 80.2707],
    purpose: 'Irrigation',
    requiredQuantity: 4000
  };
  const ranked = rankRescueAlternative(farSource, demand, { searchRadiusKm: 10 });
  assert.strictEqual(ranked.eligible, false, 'Must be marked ineligible outside 10 km radius');
  assert(ranked.exclusionReason.includes('exceeds configured rescue radius'), 'Exclusion reason must state radius');
});

test('Alternative Ranking: Computes 5-Factor Weighted Score', () => {
  const localSource = {
    id: 'src-local',
    name: 'Local STP Plant',
    type: 'Treated Wastewater',
    quality: 'Verified',
    verificationStatus: 'Verified',
    reportExpiry: '2027-10-15',
    quantity: 10000,
    available: true,
    coordinates: [13.0600, 80.2600], // ~3 km away
    intendedUses: ['Irrigation']
  };
  const demand = {
    coordinates: [13.0827, 80.2707],
    purpose: 'Irrigation',
    requiredQuantity: 4000
  };
  const ranked = rankRescueAlternative(localSource, demand, { searchRadiusKm: 10 });
  assert.strictEqual(ranked.eligible, true, 'Local verified source must be eligible');
  assert(ranked.score >= 80, `Expected high score, got ${ranked.score}`);
  assert(ranked.transportCost > 0, 'Transport cost must be computed');
  assert(ranked.estimatedDeliveryMins > 0, 'Estimated delivery time must be computed');
  assert(ranked.scoreBreakdown.qualityScore > 0);
  assert(ranked.scoreBreakdown.quantityScore === 100, 'Full fulfillment should yield 100 quantity score');
});

// 4. End-to-End Simulation Workflow Tests
(async () => {
  await testAsync('Simulation Engine: Produces AUTOMATIC_RECOVERY with Valid Alternatives', async () => {
    const res = await runRescueEngine({
      scenarioId: 'CONTAMINATION_TURBIDITY',
      searchRadiusKm: 15,
      isSimulated: true
    });

    assert.strictEqual(res.incident.isSimulated, true, 'Incident must be flagged as simulated');
    assert.strictEqual(res.incident.severity, 'Critical', 'Turbidity spike must have Critical severity');
    assert(res.evaluatedCandidates.length > 0, 'Must evaluate candidates in platform');
    assert.strictEqual(res.outcome, 'AUTOMATIC_RECOVERY', 'Outcome should be AUTOMATIC_RECOVERY');
    assert(res.winningAlternative, 'Must select winning alternative');
    assert(res.winningAlternative.safeGate.passed, 'Winning alternative must pass Safe Reuse Gate');
    assert(res.routeReassignment, 'Must generate route reassignment');
    assert(res.routeReassignment.waybillNumber.startsWith('WYB-RESCUE-'), 'Must issue rescue waybill');
    assert.strictEqual(res.workflowStages.length, 6, 'Must generate all 6 workflow stages');
  });

  await testAsync('Simulation Engine: Produces EMERGENCY_ALERT When Radius is Restricted to 0.1 km', async () => {
    const res = await runRescueEngine({
      scenarioId: 'DELIVERY_FAILURE',
      searchRadiusKm: 0.1, // Impossible radius
      isSimulated: true
    });

    assert.strictEqual(res.outcome, 'EMERGENCY_ALERT', 'Should trigger EMERGENCY_ALERT when no source is within radius');
    assert.strictEqual(res.eligibleAlternatives.length, 0, 'No source should be eligible');
    assert(res.rejectedAlternatives.length > 0, 'All candidates should be in rejected list');
    assert.strictEqual(res.winningAlternative, null, 'No winning alternative should be selected');
  });

  await testAsync('Resolution Engine: Dispatches Winning Reroute and Updates Store', async () => {
    // Run simulation first to set active incident
    const simRes = await runRescueEngine({
      scenarioId: 'CAPACITY_DROP_75',
      searchRadiusKm: 15,
      isSimulated: true
    });

    assert(simRes.winningAlternative, 'Need winning alternative for resolve test');

    const resolveRes = await resolveRescueIncident(simRes.incident.incidentId);
    assert(resolveRes.success, 'Resolution must succeed');
    assert(resolveRes.match, 'Must generate authoritative match record');
    assert.strictEqual(resolveRes.match.status, 'In Transit', 'Match status should be In Transit');
    assert.strictEqual(resolveRes.match.isRescue, true, 'Match must be flagged isRescue');

    // Verify DB store has cleared active incident and logged to history
    const ov = await getRescueOverview();
    assert.strictEqual(ov.activeIncident, null, 'Active incident must be cleared after resolution');
    assert(ov.history.length > 0, 'History must record resolved incident');
    assert(ov.stats.totalIncidents > 0, 'Total incidents stat must increment');
  });

  await testAsync('Reset Engine: Resets System to Standby Monitor', async () => {
    // Run simulation to set active
    await runRescueEngine({ scenarioId: 'CONTAMINATION_PH', searchRadiusKm: 10 });
    const resetRes = resetRescueSimulation();
    assert(resetRes.success, 'Reset must succeed');

    const ov = await getRescueOverview();
    assert.strictEqual(ov.activeIncident, null, 'Active incident must be null after reset');
  });

  console.log('\n=================================================');
  console.log(`RESCUE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================');

  if (failed > 0) process.exit(1);
})();

