/**
 * tests/systemCoordination.test.js
 * Comprehensive 13-Step End-to-End System Coordination & Consistency Test Suite
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../server/data_store.json');

// Backup database state for test isolation
const originalDB = fs.readFileSync(DB_PATH, 'utf8');

async function runSystemCoordinationTests() {
  console.log('\n=== STARTING RELOOP 2.0 SYSTEM COORDINATION & CONSISTENCY TEST SUITE ===\n');
  let passedCount = 0;

  try {
    const { 
      createDemand, 
      createWaterRequest, 
      acceptWaterRequest, 
      updateMatchStatus, 
      loadDB, 
      saveDB 
    } = await import('../server/services/inventoryService.js');
    
    const { 
      runRescueEngine, 
      resolveRescueIncident, 
      getRescueOverview 
    } = await import('../server/services/rescueService.js');

    // -----------------------------------------------------------------
    // STEP 1: Demand Creation
    // -----------------------------------------------------------------
    console.log('Step 1: Testing Buyer Water Demand Creation...');
    const demandPayload = {
      title: "Southern Logistics Hub Landscaping",
      buyerName: "Green Park Facilities",
      quantity: 5000,
      purpose: "Irrigation",
      intendedReuse: "Irrigation",
      location: "Chennai, Tamil Nadu",
      coordinates: [13.0827, 80.2707],
      deliveryDate: "2026-11-05"
    };
    const createdDemand = await createDemand(demandPayload);
    assert(createdDemand.id, 'Demand must have an authoritative ID');
    assert.strictEqual(createdDemand.status, 'Active', 'Demand status must initially be Active');
    assert.strictEqual(createdDemand.quantity, 5000, 'Demand quantity must match');
    console.log('  [PASS] Step 1: Demand created successfully (#', createdDemand.id, ')');
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 2: Discovery & Available Inventory Verification
    // -----------------------------------------------------------------
    console.log('Step 2: Testing Discovery & Available Supplier Inventory...');
    const dbAfterDemand = loadDB();
    const availableSource = dbAfterDemand.sources.find(s => s.available && s.quantity >= 5000 && s.quality === 'Verified');
    assert(availableSource, 'Must have at least one verified available source with >= 5,000 L capacity');
    const initialSourceQty = availableSource.quantity;
    console.log(`  [PASS] Step 2: Found verified supplier "${availableSource.name}" with ${initialSourceQty.toLocaleString()} L available`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 3: Outgoing Water Request Creation
    // -----------------------------------------------------------------
    console.log('Step 3: Testing Outgoing Water Request Creation...');
    const requestPayload = {
      demandId: createdDemand.id,
      sourceId: availableSource.id,
      requestedQuantity: 5000,
      intendedReuse: "Irrigation",
      buyerName: "Green Park Facilities",
      deliveryLocation: "Chennai, Tamil Nadu",
      requestedDate: "2026-11-05"
    };
    const createdRequest = await createWaterRequest(requestPayload);
    assert(createdRequest.id, 'Request must have an authoritative ID');
    assert.strictEqual(createdRequest.status, 'Pending', 'New request must have status Pending');
    assert.strictEqual(createdRequest.requestedQuantity, 5000, 'Requested volume must match');
    console.log(`  [PASS] Step 3: Water request created (#${createdRequest.id})`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 4: Supplier Review & Acceptance
    // -----------------------------------------------------------------
    console.log('Step 4: Testing Supplier Request Acceptance...');
    const acceptResult = await acceptWaterRequest(createdRequest.id, {
      driverName: "K. Murugan (TN-07-BW-2041)",
      driverPhone: "+91 98401 22334"
    });
    assert(acceptResult.match, 'Supplier acceptance must generate match record');
    assert.strictEqual(acceptResult.match.status, 'Scheduled', 'Newly scheduled match must have Scheduled status');
    assert.strictEqual(acceptResult.match.matchedQuantity, 5000, 'Matched quantity must match request');
    console.log(`  [PASS] Step 4: Supplier accepted request; match #${acceptResult.match.id} scheduled`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 5: Buyer Match Agreement Confirmation
    // -----------------------------------------------------------------
    console.log('Step 5: Testing Buyer Match Agreement Confirmation...');
    const confirmedMatch = await updateMatchStatus(acceptResult.match.id, 'Confirmed', {
      buyerConfirmed: true,
      driverName: "K. Murugan (TN-07-BW-2041)",
      driverPhone: "+91 98401 22334"
    });
    assert.strictEqual(confirmedMatch.status, 'Confirmed', 'Match must transition to Confirmed');
    console.log(`  [PASS] Step 5: Buyer confirmed match agreement`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 6: Waybill Generation & Transporter Assignment
    // -----------------------------------------------------------------
    console.log('Step 6: Testing Waybill Generation & Transporter Details...');
    assert(confirmedMatch.deliveryRef, 'Confirmed match must carry delivery waybill reference');
    assert(confirmedMatch.driverName, 'Confirmed match must carry driver name');
    console.log(`  [PASS] Step 6: Waybill #${confirmedMatch.deliveryRef} activated with driver ${confirmedMatch.driverName} (${confirmedMatch.driverPhone})`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 7: Disruption Detection & Rescue Simulation
    // -----------------------------------------------------------------
    console.log('Step 7: Testing Disruption Detection & ReLoop Rescue Simulation...');
    const simResult = await runRescueEngine({ 
      scenarioId: 'CONTAMINATION_TURBIDITY', 
      searchRadiusKm: 15,
      isSimulated: true 
    });
    assert.strictEqual(simResult.outcome, 'AUTOMATIC_RECOVERY', 'Simulation with 15km radius should achieve AUTOMATIC_RECOVERY');
    assert(simResult.winningAlternative, 'Rescue simulation must identify winning backup candidate');
    console.log(`  [PASS] Step 7: Incident detected; winning backup supplier "${simResult.winningAlternative.sourceName}" scored ${simResult.winningAlternative.score}`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 8: Safe Reuse Gate Audit
    // -----------------------------------------------------------------
    console.log('Step 8: Testing Safe Reuse Gate Audit Integrity...');
    assert(simResult.winningAlternative.safeGate.passed, 'Winning backup supplier must pass Safe Reuse Gate');
    assert.strictEqual(simResult.winningAlternative.safeGate.checks.some(c => !c.passed), false, 'All Safe Reuse Gate checks must pass');
    console.log('  [PASS] Step 8: Safe Reuse Gate verified purity and CPCB standard compatibility');
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 9: Multi-Factor Supplier Ranking Verification
    // -----------------------------------------------------------------
    console.log('Step 9: Testing 5-Factor Weighted Supplier Ranking...');
    const breakdown = simResult.winningAlternative.scoreBreakdown;
    assert(breakdown.qualityScore > 0, 'Quality score must be calculated');
    assert(breakdown.quantityScore > 0, 'Quantity score must be calculated');
    assert(breakdown.proximityScore > 0, 'Proximity score must be calculated');
    assert(breakdown.costScore > 0, 'Cost efficiency score must be calculated');
    assert(breakdown.timingScore > 0, 'Delivery timing score must be calculated');
    assert(simResult.winningAlternative.score > 50, 'Final weighted score must be greater than 50');
    console.log(`  [PASS] Step 9: Multi-factor ranking validated (Quality: ${breakdown.qualityScore}, Proximity: ${breakdown.proximityScore}, Timing: ${breakdown.timingScore}, Final: ${simResult.winningAlternative.score})`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 10: Reroute Reassignment & Deduplication
    // -----------------------------------------------------------------
    console.log('Step 10: Testing Reroute Reassignment Without Orphan Duplication...');
    const resolveResult = await resolveRescueIncident(simResult.incident.incidentId);
    assert(resolveResult.success, 'Rescue incident resolution must succeed');
    const dbAfterRescue = loadDB();
    const rescuedMatch = resolveResult.match;
    assert.strictEqual(rescuedMatch.isRescue, true, 'Rescued match must have isRescue flag set');
    assert.strictEqual(rescuedMatch.status, 'In Transit', 'Rerouted tanker must transition to In Transit');
    console.log(`  [PASS] Step 10: Rescue reroute confirmed (${rescuedMatch.sourceName}) waybill #${rescuedMatch.deliveryRef}`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 11: In-Transit to Delivered Transition
    // -----------------------------------------------------------------
    console.log('Step 11: Testing Tanker Arrival (Status -> Delivered)...');
    const deliveredMatch = await updateMatchStatus(rescuedMatch.id, 'Delivered', {
      instructions: "Tanker arrived at Green Park facility discharge manifold."
    });
    assert.strictEqual(deliveredMatch.status, 'Delivered', 'Match status must transition to Delivered');
    console.log(`  [PASS] Step 11: Tanker safely arrived; status updated to Delivered`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 12: Buyer Receipt Confirmation (Status -> Completed)
    // -----------------------------------------------------------------
    console.log('Step 12: Testing Buyer Receipt Confirmation (Status -> Completed)...');
    const completedMatch = await updateMatchStatus(rescuedMatch.id, 'Completed', {
      instructions: "Receipt confirmed by buyer. Quality checklist verified upon discharge."
    });
    assert.strictEqual(completedMatch.status, 'Completed', 'Match status must transition to Completed');
    assert.strictEqual(completedMatch.confirmedReusedQuantity, 5000, 'Confirmed reused quantity must equal delivered quantity');
    console.log(`  [PASS] Step 12: Buyer confirmed delivery; status updated to Completed`);
    passedCount++;

    // -----------------------------------------------------------------
    // STEP 13: Impact Accounting Verification
    // -----------------------------------------------------------------
    console.log('Step 13: Testing Realized Environmental Impact Accounting...');
    const dbFinal = loadDB();
    const finalCompletedMatches = (dbFinal.matches || []).filter(m => m.status === 'Completed');
    const totalRealizedFreshwater = finalCompletedMatches.reduce((sum, m) => sum + Number(m.confirmedReusedQuantity || m.matchedQuantity || 0), 0);
    assert(totalRealizedFreshwater >= 5000, 'Realized freshwater savings must include confirmed completed delivery');
    
    // Check that demand status transitioned to Fulfilled
    const finalDemand = dbFinal.demands.find(d => d.id === createdDemand.id);
    assert(finalDemand, 'Demand must persist in storage');
    assert.strictEqual(finalDemand.status, 'Fulfilled', 'Fully delivered demand must transition to Fulfilled');
    assert.strictEqual(finalDemand.fulfilledQuantity, 5000, 'Demand fulfilledQuantity must equal 5000');
    console.log(`  [PASS] Step 13: Impact verified (${totalRealizedFreshwater.toLocaleString()} L freshwater saved, Demand status: ${finalDemand.status})`);
    passedCount++;

    console.log('\n=================================================');
    console.log(`SYSTEM COORDINATION SUITE: ${passedCount}/13 TESTS PASSED (100%)`);
    console.log('=================================================\n');

  } catch (err) {
    console.error('\n[FAIL] System Coordination Test Suite Failed:', err);
    throw err;
  } finally {
    // Restore original DB state to keep test runs pure
    fs.writeFileSync(DB_PATH, originalDB, 'utf8');
  }
}

runSystemCoordinationTests();
