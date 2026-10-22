// tests/matchingScenarios.test.js
import assert from 'assert';
import { 
  getCanonicalSources, 
  getCanonicalDemands, 
  createDemand, 
  createWaterRequest, 
  acceptWaterRequest, 
  rejectWaterRequest, 
  updateMatchStatus,
  loadDB,
  saveDB
} from '../server/services/inventoryService.js';
import { 
  findMatchesForDemand, 
  checkEligibility, 
  rankCandidateMatch, 
  computePartialFulfillmentPlan 
} from '../server/services/matchingService.js';

console.log("=== STARTING RELOOP MATCHING ENGINE TEST SUITE ===");

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // SCENARIO A: Complete Successful End-to-End Match
  // -------------------------------------------------------------
  await testAsync("Scenario A: Full Successful Match Flow (8,000 L source, 5,000 L demand)", async () => {
    const db = loadDB();
    const testSourceId = `test-src-${Date.now()}`;
    const testDemandId = `test-dem-${Date.now()}`;

    // 1. Seller registers eligible source containing 8,000 L
    const sourceA = {
      id: testSourceId,
      name: "Scenario A Test STP Facility",
      supplierId: "seller-user-scenario-a",
      supplierName: "Apex Water Utilities",
      type: "Treated Wastewater",
      totalRegisteredQuantity: 8000,
      quantity: 8000,
      availableQuantity: 8000,
      reservedQuantity: 0,
      deliveredQuantity: 0,
      quality: "Verified",
      verificationStatus: "Verified",
      available: true,
      availabilityStatus: "Available",
      reportExpiry: "2027-12-31",
      coordinates: [13.0450, 80.2450],
      location: "Guindy Corridor, Chennai",
      intendedUses: ["Irrigation", "Construction", "Toilet Flushing"]
    };
    db.sources.unshift(sourceA);
    db.sellerSources.unshift(sourceA);
    saveDB(db);

    // 2. Buyer creates demand for 5,000 L of compatible water
    const demandA = await createDemand({
      id: testDemandId,
      title: "Scenario A Garden Demand",
      quantity: 5000,
      purpose: "Irrigation",
      coordinates: [13.0550, 80.2520]
    });
    assert.strictEqual(demandA.requiredQuantity, 5000, "Demand quantity must be 5000");
    assert.strictEqual(demandA.remainingQuantity, 5000, "Initial remaining must be 5000");

    // 3. Buyer sees source in eligible matching results
    const matchingResults = findMatchesForDemand(demandA, [sourceA]);
    assert.strictEqual(matchingResults.totalEligible, 1, "Source must be eligible");
    const topMatch = matchingResults.eligibleMatches[0];
    assert.strictEqual(topMatch.sourceId, testSourceId);
    assert(topMatch.matchScore > 80, "Match score should be high for optimal candidate");
    assert(topMatch.scoreFactors.reasons.length > 0, "Reasons should be present");

    // 4. Buyer requests 5,000 L
    const requestA = await createWaterRequest({
      sourceId: testSourceId,
      demandId: testDemandId,
      requestedQuantity: 5000,
      buyerName: "Scenario A Buyer Org"
    });
    assert.strictEqual(requestA.status, "Pending", "Request status must start as Pending");

    // 5 & 6. Seller accepts the request
    const acceptRes = await acceptWaterRequest(requestA.id);
    assert.strictEqual(acceptRes.request.status, "Accepted", "Request must be Accepted");
    assert.strictEqual(acceptRes.match.status, "Scheduled", "Match must be Scheduled");

    // 7 & 8. Check exact reservation: 5,000 L reserved, 3,000 L remaining available
    const updatedDb = loadDB();
    const updatedSource = updatedDb.sources.find(s => s.id === testSourceId);
    assert.strictEqual(updatedSource.quantity, 3000, "Available quantity must be 3,000 L (8000 - 5000)");
    assert.strictEqual(updatedSource.reservedQuantity, 5000, "Reserved quantity must be 5,000 L");

    // 9. Fulfillment is dispatched and recorded
    await updateMatchStatus(acceptRes.match.id, "In Transit");
    await updateMatchStatus(acceptRes.match.id, "Delivered");
    const completedMatch = await updateMatchStatus(acceptRes.match.id, "Completed");
    assert.strictEqual(completedMatch.status, "Completed");

    // 10. Exactly 5,000 L is confirmed fulfilled without double counting
    const finalDb = loadDB();
    const finalSource = finalDb.sources.find(s => s.id === testSourceId);
    assert.strictEqual(finalSource.reservedQuantity, 0, "Reserved quantity must return to 0");
    assert.strictEqual(finalSource.deliveredQuantity, 5000, "Delivered quantity must be exactly 5,000 L");
    assert.strictEqual(finalSource.quantity, 3000, "Available quantity remains exactly 3,000 L");

    const finalDemand = finalDb.demands.find(d => d.id === testDemandId);
    assert.strictEqual(finalDemand.fulfilledQuantity, 5000, "Demand fulfilled quantity must be 5000");
    assert.strictEqual(finalDemand.remainingQuantity, 0, "Demand remaining quantity must be 0");
    assert.strictEqual(finalDemand.status, "Fulfilled", "Demand status must be Fulfilled");
  });

  // -------------------------------------------------------------
  // SCENARIO B: Insufficient Quantity & Partial Fulfillment
  // -------------------------------------------------------------
  await testAsync("Scenario B: Insufficient Quantity / Excess Request Rejection & Partial Handling", async () => {
    const db = loadDB();
    const testSourceId = `test-src-b-${Date.now()}`;
    const testDemandId = `test-dem-b-${Date.now()}`;

    const sourceB = {
      id: testSourceId,
      name: "Limited Inventory Source",
      type: "Treated Wastewater",
      totalRegisteredQuantity: 4000,
      quantity: 4000,
      reservedQuantity: 0,
      deliveredQuantity: 0,
      quality: "Verified",
      verificationStatus: "Verified",
      available: true,
      availabilityStatus: "Available",
      coordinates: [13.0450, 80.2450],
      intendedUses: ["Irrigation"]
    };
    db.sources.unshift(sourceB);
    saveDB(db);

    const demandB = await createDemand({
      id: testDemandId,
      title: "Excess Volume Demand",
      quantity: 6000,
      purpose: "Irrigation"
    });

    // Requesting 6,000 L when only 4,000 L available should be rejected by backend reservation validator
    let errorThrown = false;
    try {
      await createWaterRequest({
        sourceId: testSourceId,
        demandId: testDemandId,
        requestedQuantity: 6000
      });
    } catch (err) {
      errorThrown = true;
      assert(err.message.includes("Insufficient") || err.message.includes("unreserved"), "Error must state insufficient inventory");
    }
    assert(errorThrown, "Must throw error when requested quantity exceeds available quantity");

    // Stage D partial fulfillment calculation: should propose 4,000 L coverage
    const partialPlan = computePartialFulfillmentPlan([
      { sourceId: testSourceId, sourceName: sourceB.name, availableQuantity: 4000, distanceKm: 4.2, matchScore: 82 }
    ], demandB);

    assert.strictEqual(partialPlan.coveredQuantity, 4000, "Partial plan covers 4,000 L");
    assert.strictEqual(partialPlan.unmetQuantity, 2000, "Unmet remaining is 2,000 L");
    assert.strictEqual(partialPlan.isFullyCovered, false, "Not fully covered");
  });

  // -------------------------------------------------------------
  // SCENARIO C: Unsuitable Water Quality (Expired Documentation)
  // -------------------------------------------------------------
  test("Scenario C: Unsuitable Water Quality (Expired Documentation)", () => {
    const expiredSource = {
      id: "src-expired-doc",
      name: "Expired Audit Treatment Facility",
      type: "Treated Wastewater",
      quantity: 10000,
      available: true,
      verificationStatus: "Expired Documentation",
      reportExpiry: "2025-01-01", // Past date!
      intendedUses: ["Irrigation"]
    };

    const targetDemand = {
      id: "dem-test-c",
      title: "Green Lawn Demand",
      quantity: 5000,
      purpose: "Irrigation"
    };

    // Stage A check must fail
    const eligibility = checkEligibility(expiredSource, targetDemand);
    assert.strictEqual(eligibility.eligible, false, "Source with expired documentation must be ineligible");
    assert(eligibility.reason.includes("expired"), "Reason must mention expired documentation");

    // Matching orchestrator must filter it out
    const matchResults = findMatchesForDemand(targetDemand, [expiredSource]);
    assert.strictEqual(matchResults.totalEligible, 0, "No eligible matches should be returned");
    assert.strictEqual(matchResults.ineligibleCount, 1, "Expired source must be in ineligible count");
  });

  // -------------------------------------------------------------
  // SCENARIO D: Concurrent Requests / Anti-Over-Allocation
  // -------------------------------------------------------------
  await testAsync("Scenario D: Concurrent Requests on Limited Inventory (7,000 L source, two 5,000 L demands)", async () => {
    const db = loadDB();
    const sharedSourceId = `test-src-d-shared-${Date.now()}`;

    const sourceD = {
      id: sharedSourceId,
      name: "Shared High Demand STP Basin",
      type: "Treated Wastewater",
      totalRegisteredQuantity: 7000,
      quantity: 7000,
      availableQuantity: 7000,
      reservedQuantity: 0,
      deliveredQuantity: 0,
      quality: "Verified",
      verificationStatus: "Verified",
      available: true,
      availabilityStatus: "Available",
      coordinates: [13.0450, 80.2450],
      intendedUses: ["Irrigation"]
    };
    db.sources.unshift(sourceD);
    db.sellerSources.unshift(sourceD);
    saveDB(db);

    const dem1 = await createDemand({ title: "Buyer 1 Demand", quantity: 5000, purpose: "Irrigation" });
    const dem2 = await createDemand({ title: "Buyer 2 Demand", quantity: 5000, purpose: "Irrigation" });

    // Buyer 1 requests 5000 L
    const req1 = await createWaterRequest({
      sourceId: sharedSourceId,
      demandId: dem1.id,
      requestedQuantity: 5000,
      buyerName: "Buyer 1"
    });

    // Seller accepts Buyer 1 request
    const accept1 = await acceptWaterRequest(req1.id);
    assert.strictEqual(accept1.request.status, "Accepted");

    // Source now only has 2,000 L available (7000 - 5000)
    const midDb = loadDB();
    const midSource = midDb.sources.find(s => s.id === sharedSourceId);
    assert.strictEqual(midSource.quantity, 2000, "Source must only have 2,000 L available after 1st reservation");

    // Buyer 2 attempting to request or accept 5,000 L must be rejected by atomic inventory check
    let secondAcceptFailed = false;
    try {
      await createWaterRequest({
        sourceId: sharedSourceId,
        demandId: dem2.id,
        requestedQuantity: 5000,
        buyerName: "Buyer 2"
      });
    } catch (err) {
      secondAcceptFailed = true;
      assert(err.message.includes("Insufficient"), "Error must state insufficient unreserved inventory");
    }

    assert(secondAcceptFailed, "Second request exceeding available inventory must fail without over-allocating");

    // Check inventory was not double-allocated
    const afterDb = loadDB();
    const finalSource = afterDb.sources.find(s => s.id === sharedSourceId);
    assert.strictEqual(finalSource.reservedQuantity, 5000, "Reserved must remain exactly 5,000 L");
    assert.strictEqual(finalSource.quantity, 2000, "Available must remain exactly 2,000 L");
  });

  // -------------------------------------------------------------
  // SCENARIO E: Seller Rejects Request with Reason
  // -------------------------------------------------------------
  await testAsync("Scenario E: Seller Rejects Request With Explicit Reason", async () => {
    const db = loadDB();
    const sourceId = `test-src-e-${Date.now()}`;
    const sourceE = {
      id: sourceId,
      name: "Reject Scenario STP",
      type: "Treated Wastewater",
      totalRegisteredQuantity: 10000,
      quantity: 10000,
      reservedQuantity: 0,
      deliveredQuantity: 0,
      quality: "Verified",
      verificationStatus: "Verified",
      available: true,
      availabilityStatus: "Available",
      coordinates: [13.0450, 80.2450],
      intendedUses: ["Irrigation"]
    };
    db.sources.unshift(sourceE);
    saveDB(db);

    const demandE = await createDemand({ title: "Reject Scenario Demand", quantity: 3000, purpose: "Irrigation" });
    const reqE = await createWaterRequest({ sourceId, demandId: demandE.id, requestedQuantity: 3000 });

    // Seller rejects with reason
    const rejectedReq = await rejectWaterRequest(reqE.id, "Scheduling conflict: Scheduled maintenance shutdown", "Tanker loading dock closed for pipe retrofit");
    assert.strictEqual(rejectedReq.status, "Rejected");
    assert.strictEqual(rejectedReq.rejectionReason, "Scheduling conflict: Scheduled maintenance shutdown");

    // Zero quantity deducted
    const checkDb = loadDB();
    const checkSource = checkDb.sources.find(s => s.id === sourceId);
    assert.strictEqual(checkSource.quantity, 10000, "Available inventory must remain intact (10,000 L)");
    assert.strictEqual(checkSource.reservedQuantity, 0, "No inventory reserved");

    // Buyer notification created
    const notif = checkDb.notifications.find(n => n.type === 'rescue');
    assert(notif, "Rejection notification with Rescue recommendation must be created");
  });

  // -------------------------------------------------------------
  // SCENARIO F: Demand Already Fulfilled Check
  // -------------------------------------------------------------
  await testAsync("Scenario F: Demand Already Fulfilled Cannot Accept Excess Allocations", async () => {
    const demandF = await createDemand({ title: "Already Fulfilled Demand", quantity: 4000, purpose: "Irrigation" });
    const db = loadDB();
    const storedDemand = db.demands.find(d => d.id === demandF.id);
    assert(storedDemand, "Demand must exist in db");
    storedDemand.fulfilledQuantity = 4000;
    storedDemand.remainingQuantity = 0;
    storedDemand.status = "Fulfilled";
    saveDB(db);

    const sourceF = db.sources[0];

    let errorThrown = false;
    try {
      await createWaterRequest({
        sourceId: sourceF.id,
        demandId: demandF.id,
        requestedQuantity: 2000
      });
    } catch (err) {
      errorThrown = true;
      if (!err.message.includes("fully allocated or fulfilled")) {
        console.error("DEBUG Scenario F error:", err.message);
      }
      assert(err.message.includes("fully allocated or fulfilled"), `Expected 'fully allocated or fulfilled', got: '${err.message}'`);
    }

    assert(errorThrown, "Cannot request water for an already fulfilled demand");
  });

  // -------------------------------------------------------------
  // SCENARIO G: Cancellation and Reservation Release
  // -------------------------------------------------------------
  await testAsync("Scenario G: Match Cancellation Correctly Releases Reserved Inventory", async () => {
    const db = loadDB();
    const sourceGId = `test-src-g-${Date.now()}`;
    const sourceG = {
      id: sourceGId,
      name: "Cancellation Test STP",
      type: "Treated Wastewater",
      totalRegisteredQuantity: 10000,
      quantity: 10000,
      reservedQuantity: 0,
      deliveredQuantity: 0,
      quality: "Verified",
      verificationStatus: "Verified",
      available: true,
      availabilityStatus: "Available",
      coordinates: [13.0450, 80.2450],
      intendedUses: ["Irrigation"]
    };
    db.sources.unshift(sourceG);
    saveDB(db);

    const demandG = await createDemand({ title: "Cancel Demand Test", quantity: 4000, purpose: "Irrigation" });
    const reqG = await createWaterRequest({ sourceId: sourceGId, demandId: demandG.id, requestedQuantity: 4000 });
    const acceptG = await acceptWaterRequest(reqG.id);

    // Verify 4,000 L reserved
    let midDb = loadDB();
    assert.strictEqual(midDb.sources.find(s => s.id === sourceGId).reservedQuantity, 4000);

    // Cancel match
    await updateMatchStatus(acceptG.match.id, "Cancelled");

    // Verify reservation released back to available inventory
    let afterDb = loadDB();
    const finalSourceG = afterDb.sources.find(s => s.id === sourceGId);
    assert.strictEqual(finalSourceG.reservedQuantity, 0, "Reserved quantity must reset to 0 upon cancellation");
    assert.strictEqual(finalSourceG.quantity, 10000, "Available quantity restored to 10,000 L");
  });

  // -------------------------------------------------------------
  // SCENARIO H: State Transition and Quality Constraints
  // -------------------------------------------------------------
  await testAsync("Scenario H: Disallow Invalid Match State Transitions (Completed -> Cancelled)", async () => {
    const db = loadDB();
    const testMatch = {
      id: `mat-test-h-${Date.now()}`,
      status: "Completed",
      matchedQuantity: 3000,
      sourceId: "dummy",
      demandId: "dummy"
    };
    db.matches.unshift(testMatch);
    saveDB(db);

    let errorThrown = false;
    try {
      await updateMatchStatus(testMatch.id, "Cancelled");
    } catch (err) {
      errorThrown = true;
      assert(err.message.includes("Invalid status transition"), "Must prevent transition out of Completed");
    }
    assert(errorThrown, "Completed match cannot be cancelled or altered");
  });

  // -------------------------------------------------------------
  // SCENARIO I: ReLoop Rescue Failover Alternative Discovery
  // -------------------------------------------------------------
  test("Scenario I: ReLoop Rescue Finds Eligible Standby Alternatives Without Auto-Allocating", () => {
    const demandI = {
      id: "dem-rescue-test",
      title: "Rescue Demand Test",
      requiredQuantity: 4000,
      purpose: "Irrigation",
      coordinates: [13.0500, 80.2400]
    };

    const failedSource = {
      id: "src-failed-1",
      name: "Contaminated Primary Source",
      type: "Treated Wastewater",
      quantity: 5000,
      quality: "Rejected",
      verificationStatus: "Rejected",
      available: false,
      intendedUses: ["Irrigation"]
    };

    const standbySource1 = {
      id: "src-standby-1",
      name: "Apex STP Basin Standby",
      type: "Treated Wastewater",
      quantity: 8000,
      quality: "Verified",
      verificationStatus: "Verified",
      available: true,
      availabilityStatus: "Available",
      coordinates: [13.0600, 80.2500],
      intendedUses: ["Irrigation"]
    };

    const standbySource2 = {
      id: "src-standby-2",
      name: "Apartment Greywater Unit",
      type: "Greywater",
      quantity: 3500,
      quality: "Verified",
      verificationStatus: "Verified",
      available: true,
      availabilityStatus: "Available",
      coordinates: [13.0700, 80.2600],
      intendedUses: ["Irrigation"]
    };

    // Filter out failed source and evaluate candidate alternatives
    const allCandidates = [failedSource, standbySource1, standbySource2];
    const healthyCandidates = allCandidates.filter(s => s.id !== failedSource.id);

    const rescueMatches = findMatchesForDemand(demandI, healthyCandidates);
    assert.strictEqual(rescueMatches.totalEligible, 2, "Must find 2 healthy standby alternatives");
    assert.strictEqual(rescueMatches.eligibleMatches[0].sourceId, "src-standby-1", "Best alternative must be top ranked");
    assert(rescueMatches.eligibleMatches[0].matchScore >= 80, "Alternative score should be high");
  });

  console.log("\n=================================================");
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
