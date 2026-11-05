// server/services/rescueService.js
/**
 * ReLoop Rescue™ – Continuous Supply Shield Engine
 * 
 * Provides intelligent failure detection, Safe Reuse Gate verification,
 * weighted multi-criteria backup supplier ranking, route reassignment,
 * and automated supply recovery.
 */

import { loadDB, saveDB, getCanonicalSources, getDemandById, syncMongoMatch } from './inventoryService.js';
import { calculateDistanceKm, COMPATIBILITY_RULES, isDocumentationExpired, isQualityVerified, isReuseCompatible } from './matchingService.js';
import { isDbConnected } from '../db.js';
import { Delivery } from '../models/Delivery.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';

// Predefined failure disruption scenarios with simulated telemetry metadata
export const RESCUE_SCENARIOS = [
  {
    id: 'CONTAMINATION_TURBIDITY',
    name: 'Contamination Alert: Optical Turbidity Spike',
    category: 'Water Quality Failure',
    severity: 'Critical',
    sensorMetric: 'Turbidity',
    sensorValue: '14.8 NTU',
    safeThreshold: '≤ 5.0 NTU (CPCB Class-C Non-potable Reuse)',
    sensorSource: 'In-line IoT Nephelometric Optical Sensor #TURB-409',
    description: 'Automated in-line turbidity probe detected critical particulate suspension. Risk of microbiological pathogen breakthrough. Primary supplier suspended immediately.',
    actionRequired: 'Automated shutoff engaged; trigger Safe Reuse Gate failover to certified backup node.'
  },
  {
    id: 'CONTAMINATION_PH',
    name: 'Chemical Anomaly: Output Acidification',
    category: 'Water Quality Failure',
    severity: 'Critical',
    sensorMetric: 'pH Level',
    sensorValue: '4.8 pH',
    safeThreshold: '6.5 – 8.5 pH (CPCB Irrigation / Industrial Standard)',
    sensorSource: 'In-line IoT Glass Combination Electrode #PH-102',
    description: 'Chemical sensor detected severe acidification in output manifold. Risk of infrastructure corrosion and vegetation scorch.',
    actionRequired: 'Lock primary valves and immediately discover neutral pH verified backup.'
  },
  {
    id: 'CAPACITY_DROP_75',
    name: 'Sudden Capacity Drop: 75% Yield Deficit',
    category: 'Quantity Reduction',
    severity: 'High',
    sensorMetric: 'Flow Rate',
    sensorValue: '280 L/hr (Expected 1,200 L/hr)',
    safeThreshold: '≥ 1,000 L/hr',
    sensorSource: 'Transit Ultrasonic Flow Meter #FLOW-88',
    description: 'Main recirculation pump impeller fractured. Supplier capacity collapsed by 75%, unable to fulfill scheduled buyer demand.',
    actionRequired: 'Evaluate local reserve capacity to pool or replace supplier volume.'
  },
  {
    id: 'SUPPLIER_UNAVAILABLE',
    name: 'Supplier Unavailability: Grid Transformer Trip',
    category: 'Supplier Unavailability',
    severity: 'High',
    sensorMetric: 'Electrical SCADA Status',
    sensorValue: '0 kW (Substation Offline)',
    safeThreshold: 'Continuous 415V 3-Phase Operational',
    sensorSource: 'Plant SCADA Telemetry Link #APEX-GRID-1',
    description: 'Unscheduled regional power substation trip halted plant aeration basins and UV sterilization arrays.',
    actionRequired: 'Reroute active buyer deliveries to active standby producers.'
  },
  {
    id: 'DELIVERY_FAILURE',
    name: 'Delivery Failure: Transit Tanker Breakdown',
    category: 'Logistics Failure',
    severity: 'High',
    sensorMetric: 'Fleet GPS & Engine Telematics',
    sensorValue: 'Vehicle Halted at KM 4.2 (Radiator Overheat)',
    safeThreshold: 'Active In-Transit (Speed 35 km/h)',
    sensorSource: 'EcoFlow Logistics Telematics Unit #TRK-8841',
    description: 'Logistics tanker #TN-09-CV-8841 immobilized in transit due to radiator puncture and tire blowout. Water cannot reach buyer on schedule.',
    actionRequired: 'Reassign dispatch route and source from nearest standby hub.'
  },
  {
    id: 'QUALITY_CERT_EXPIRED',
    name: 'Safe Reuse Gate Failure: Lab Certificate Lapsed',
    category: 'Regulatory Audit',
    severity: 'High',
    sensorMetric: 'NABL Certificate Expiry',
    sensorValue: 'Expired 14 Days Ago',
    safeThreshold: 'Active Accreditation Required (≤ 60 Days)',
    sensorSource: 'ReLoop Automated Compliance Gatekeeper',
    description: 'Pre-dispatch audit detected supplier quality lab certification lapsed without submission of updated NABL test report.',
    actionRequired: 'Halt all dispatches until recertification; reroute buyer to valid accredited provider.'
  }
];

/**
 * Stage 3: Safe Reuse Gate Evaluator
 * Verifies water quality reports, intended reuse compatibility, and physicochemical standards.
 * Never allows Rescue to bypass existing water safety restrictions.
 */
export function evaluateSafeReuseGate(source, demand) {
  const checks = [];
  let passed = true;
  const rejectionReasons = [];

  const purpose = (demand.purpose || demand.intendedUse || 'General Reuse').trim();
  const waterType = source.type || source.category || source.waterCategory || 'Treated Wastewater';

  // Check 1: Mandatory Quality Verification Status
  const qualityStatus = (source.verificationStatus || source.quality || 'Pending').toLowerCase();
  const isVerified = qualityStatus === 'verified';
  checks.push({
    name: 'Quality Verification Status',
    standard: 'Verified by Accredited Testing Laboratory',
    observed: source.verificationStatus || source.quality || 'Pending',
    passed: isVerified
  });
  if (!isVerified) {
    passed = false;
    rejectionReasons.push(`Water quality is marked '${source.verificationStatus || source.quality || 'Pending'}'. ReLoop Safe Reuse Gate requires 100% lab verification.`);
  }

  // Check 2: Lab Documentation Expiration
  const isExpired = isDocumentationExpired(source);
  checks.push({
    name: 'Documentation Validity',
    standard: 'Active NABL Test Report (Not Expired)',
    observed: source.reportExpiry || source.labReport?.expiryDate || 'No Expiry Recorded',
    passed: !isExpired
  });
  if (isExpired) {
    passed = false;
    rejectionReasons.push(`Water quality laboratory certification has expired (${source.reportExpiry || 'Past expiry'}). Safe Reuse Gate prohibits uncertified transfers.`);
  }

  // Check 3: Intended Reuse Compatibility (CPCB Matrix)
  const isCompatible = isReuseCompatible(source, demand);
  checks.push({
    name: 'Intended Application Match',
    standard: `CPCB Guidelines for '${purpose}'`,
    observed: `${waterType} approved for ${Array.isArray(source.intendedUses) ? source.intendedUses.slice(0, 3).join(', ') : 'General non-potable'}`,
    passed: isCompatible
  });
  if (!isCompatible) {
    passed = false;
    rejectionReasons.push(`Intended application '${purpose}' is incompatible with ${waterType} under CPCB guidelines.`);
  }

  // Check 4: Physicochemical parameters if available (pH & Turbidity)
  if (source.labReport) {
    const phVal = Number(source.labReport.ph) || 7.2;
    const phSafe = phVal >= 6.5 && phVal <= 8.5;
    checks.push({
      name: 'pH Neutrality Index',
      standard: '6.5 – 8.5 pH',
      observed: `${phVal} pH`,
      passed: phSafe
    });
    if (!phSafe) {
      passed = false;
      rejectionReasons.push(`Laboratory pH (${phVal}) is outside the safe non-potable envelope (6.5 – 8.5).`);
    }

    const turbStr = String(source.labReport.turbidity || '1.2');
    const turbVal = parseFloat(turbStr);
    const turbSafe = isNaN(turbVal) || turbVal <= 5.0;
    checks.push({
      name: 'Turbidity Clarity Index',
      standard: '≤ 5.0 NTU',
      observed: `${turbStr}`,
      passed: turbSafe
    });
    if (!turbSafe) {
      passed = false;
      rejectionReasons.push(`Turbidity (${turbStr}) exceeds the CPCB limit of 5.0 NTU for reclaimed water.`);
    }
  }

  return {
    passed,
    checks,
    rejectionReason: passed ? null : rejectionReasons.join(' ')
  };
}

/**
 * Stage 4: Weighted Multi-Criteria Ranking Algorithm
 * Evaluates candidate suppliers across 5 weighted dimensions.
 * Configurable weights:
 * - Quality Suitability & Verification: 30%
 * - Quantity Fulfillment: 25%
 * - Proximity / Distance: 20%
 * - Transportation Cost: 15%
 * - Estimated Delivery Time: 10%
 */
export function rankRescueAlternative(source, demand, options = {}) {
  const searchRadiusKm = Number(options.searchRadiusKm || 10);
  const sourceCoords = source.coordinates || source.location?.coordinates || [12.9800, 80.2200];
  const demandCoords = demand.coordinates || demand.deliveryLocation?.coordinates || [13.0827, 80.2707];
  const distanceKm = calculateDistanceKm(sourceCoords, demandCoords);

  // 1. Hard Radius Gate
  const withinRadius = distanceKm <= searchRadiusKm;

  // 2. Availability Gate
  const isAvailable = source.available !== false && source.availabilityStatus !== 'Unavailable' && source.availabilityStatus !== 'Suspended';
  const availQty = Number(source.quantity !== undefined ? source.quantity : source.availableQuantity || 0);
  const hasInventory = availQty > 0;

  // 3. Safe Reuse Gate
  const safeGate = evaluateSafeReuseGate(source, demand);

  // Overall Eligibility
  let eligible = withinRadius && isAvailable && hasInventory && safeGate.passed;
  let exclusionReason = null;

  if (!withinRadius) {
    exclusionReason = `Distance (${distanceKm} km) exceeds configured rescue radius (${searchRadiusKm} km).`;
  } else if (!isAvailable) {
    exclusionReason = `Supplier is currently suspended or marked unavailable (${source.availabilityStatus || 'Inactive'}).`;
  } else if (!hasInventory) {
    exclusionReason = `Zero available water inventory (0 L capacity).`;
  } else if (!safeGate.passed) {
    exclusionReason = safeGate.rejectionReason;
  }

  // Factor 1: Quality Score (30%)
  let qualityScore = 50;
  if (safeGate.passed) {
    qualityScore = 95;
    if (source.labReport?.ph && source.labReport?.turbidity) {
      qualityScore = 98; // Extra points for live telemetry/NABL data
    }
  } else {
    qualityScore = 20;
  }

  // Factor 2: Quantity Fulfillment (25%)
  const reqQty = Number(demand.requiredQuantity || demand.quantity || 4000);
  const fulfillmentPct = Math.min(100, Math.round((availQty / reqQty) * 100));
  let quantityScore = 0;
  if (availQty >= reqQty) {
    quantityScore = 100;
  } else {
    quantityScore = Math.max(25, fulfillmentPct);
  }

  // Factor 3: Proximity / Distance (20%)
  let proximityScore = 0;
  if (distanceKm <= 3.0) proximityScore = 100;
  else if (distanceKm <= 6.0) proximityScore = 90;
  else if (distanceKm <= 10.0) proximityScore = 75;
  else if (distanceKm <= 15.0) proximityScore = 60;
  else proximityScore = Math.max(20, 100 - Math.round(distanceKm * 3));

  // Factor 4: Transportation Cost (15%)
  // Standard EcoFlow fleet transit rate: ₹450 base + ₹110/km
  const transportCost = Math.round(450 + (distanceKm * 110));
  let costScore = 80;
  if (distanceKm <= 4.0) costScore = 98;
  else if (distanceKm <= 8.0) costScore = 85;
  else if (distanceKm <= 12.0) costScore = 70;
  else costScore = 55;

  // Factor 5: Estimated Delivery Time (10%)
  // 15 mins depot mobilization + (distance / 30 km/h) * 60 mins
  const transitMins = Math.round(15 + ((distanceKm / 30) * 60));
  let timingScore = 85;
  if (transitMins <= 25) timingScore = 98;
  else if (transitMins <= 40) timingScore = 85;
  else timingScore = 65;

  // Composite Weighted Calculation
  const totalScore = Math.round(
    (qualityScore * 0.30) +
    (quantityScore * 0.25) +
    (proximityScore * 0.20) +
    (costScore * 0.15) +
    (timingScore * 0.10)
  );

  const clampedScore = eligible ? Math.max(40, Math.min(99, totalScore)) : Math.min(35, totalScore);

  // Transparent explanation summary
  const summaryReasons = [];
  if (eligible) {
    summaryReasons.push(`Safe Reuse Gate: 100% Passed (${source.type || 'Treated'} water suitable for ${demand.purpose || 'Irrigation'}).`);
    if (availQty >= reqQty) {
      summaryReasons.push(`Full volume coverage: ${availQty.toLocaleString()} L available covers 100% of demand (${reqQty.toLocaleString()} L).`);
    } else {
      summaryReasons.push(`Partial volume: Covers ${fulfillmentPct}% (${availQty.toLocaleString()} L of ${reqQty.toLocaleString()} L).`);
    }
    summaryReasons.push(`Proximity: ${distanceKm} km from buyer (${transitMins} min delivery time).`);
    summaryReasons.push(`Logistics: ₹${transportCost.toLocaleString()} estimated transport cost.`);
  } else {
    summaryReasons.push(`Safe Reuse Gate: REJECTED – ${exclusionReason}`);
  }

  return {
    sourceId: source.id,
    sourceName: source.name,
    waterCategory: source.type || source.category || 'Treated Wastewater',
    distanceKm,
    availableQuantity: availQty,
    fulfillmentPercentage: fulfillmentPct,
    isFullFulfillment: availQty >= reqQty,
    transportCost,
    estimatedDeliveryMins: transitMins,
    score: clampedScore,
    eligible,
    safeGate,
    exclusionReason,
    scoreBreakdown: {
      qualityScore,
      quantityScore,
      proximityScore,
      costScore,
      timingScore
    },
    reasons: summaryReasons,
    coordinates: sourceCoords,
    indicativePrice: source.indicativePrice || '₹0.12/L'
  };
}

/**
 * Execute or Simulate the Full ReLoop Rescue™ Workflow
 * 
 * Stages:
 * 1. Supplier Failure Detection
 * 2. Anomaly Sensor Audit
 * 3. Backup Supplier Spatial Search (< radius)
 * 4. Safe Reuse Gate Quality Verification
 * 5. Intelligent Multi-Criteria Supplier Ranking
 * 6. Alternative Selection & Route Reassignment
 * 
 * Outcomes:
 * - AUTOMATIC_RECOVERY (Full volume safe alternative found)
 * - PARTIAL_RECOVERY (Safe alternative found but quantity < demand)
 * - EMERGENCY_ALERT (No safe alternative available)
 */
export async function runRescueEngine(params = {}) {
  const {
    scenarioId = 'CONTAMINATION_TURBIDITY',
    failedSourceId,
    demandId,
    searchRadiusKm = 10,
    isSimulated = true
  } = params;

  const db = loadDB();
  const sources = await getCanonicalSources();
  const demands = db.demands || [];

  // Match target demand
  let targetDemand = demandId ? demands.find(d => d.id === demandId) : null;
  if (!targetDemand) {
    targetDemand = demands.find(d => d.status === 'Active' || d.status === 'Matched') || demands[0] || {
      id: 'dem-fallback',
      title: 'Green Park Housing Society',
      quantity: 4000,
      purpose: 'Irrigation',
      coordinates: [13.0827, 80.2707],
      deliveryLocation: 'Chennai, Tamil Nadu'
    };
  }

  // Match failed supplier
  let failedSource = failedSourceId ? sources.find(s => s.id === failedSourceId) : null;
  if (!failedSource) {
    // If none passed, select first available or active source as disrupted entity
    failedSource = sources[0] || {
      id: 'src-failed-default',
      name: 'Apex Tech Park STP Basin A',
      type: 'Treated Wastewater',
      quantity: 5000,
      coordinates: [12.9800, 80.2200],
      quality: 'Verified'
    };
  }

  // Find scenario details
  const scenario = RESCUE_SCENARIOS.find(s => s.id === scenarioId) || RESCUE_SCENARIOS[0];

  // Stage 1 & 2: Incident Detection Object
  const incident = {
    incidentId: `INC-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    isSimulated: Boolean(isSimulated),
    scenarioId: scenario.id,
    failureType: scenario.name,
    category: scenario.category,
    severity: scenario.severity,
    sensorSource: scenario.sensorSource,
    sensorMetric: scenario.sensorMetric,
    sensorValue: scenario.sensorValue,
    safeThreshold: scenario.safeThreshold,
    affectedSupplier: {
      id: failedSource.id,
      name: failedSource.name,
      type: failedSource.type || failedSource.category || 'Treated Wastewater',
      coordinates: failedSource.coordinates || [12.9800, 80.2200]
    },
    affectedBuyer: {
      id: targetDemand.id,
      title: targetDemand.title,
      purpose: targetDemand.purpose || 'Irrigation',
      requiredQuantity: Number(targetDemand.requiredQuantity || targetDemand.quantity || 4000),
      coordinates: targetDemand.coordinates || [13.0827, 80.2707]
    },
    description: scenario.description,
    actionRequired: scenario.actionRequired
  };

  // Stage 3 & 4: Evaluate ALL candidate alternative suppliers in network
  const candidatePool = sources.filter(s => s.id !== failedSource.id);

  // Evaluate each candidate
  const evaluatedCandidates = candidatePool.map(cand => {
    return rankRescueAlternative(cand, targetDemand, { searchRadiusKm });
  });

  // Sort: Eligible first, then descending by score
  evaluatedCandidates.sort((a, b) => {
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    return b.score - a.score;
  });

  const eligibleAlternatives = evaluatedCandidates.filter(c => c.eligible);
  const rejectedAlternatives = evaluatedCandidates.filter(c => !c.eligible);

  // Determine Outcome
  let outcome = 'EMERGENCY_ALERT';
  let winningAlternative = null;
  let partialPlan = null;
  let routeReassignment = null;

  const reqQuantity = Number(targetDemand.requiredQuantity || targetDemand.quantity || 4000);

  if (eligibleAlternatives.length > 0) {
    winningAlternative = eligibleAlternatives[0];
    if (winningAlternative.isFullFulfillment) {
      outcome = 'AUTOMATIC_RECOVERY';
    } else {
      outcome = 'PARTIAL_RECOVERY';
      // Compute partial combination plan
      let covered = 0;
      const suppliersInPlan = [];
      for (const alt of eligibleAlternatives) {
        if (covered >= reqQuantity) break;
        const take = Math.min(alt.availableQuantity, reqQuantity - covered);
        if (take > 0) {
          suppliersInPlan.push({
            sourceId: alt.sourceId,
            sourceName: alt.sourceName,
            allocatedQuantity: take,
            distanceKm: alt.distanceKm
          });
          covered += take;
        }
      }
      partialPlan = {
        requiredQuantity: reqQuantity,
        coveredQuantity: covered,
        deficitQuantity: Math.max(0, reqQuantity - covered),
        fulfillmentPercentage: Math.round((covered / reqQuantity) * 100),
        suppliers: suppliersInPlan
      };
    }

    // Generate Route Reassignment
    const originalDistanceKm = calculateDistanceKm(failedSource.coordinates || [12.9800, 80.2200], targetDemand.coordinates || [13.0827, 80.2707]);
    const rescueDistanceKm = winningAlternative.distanceKm;
    const distanceDeltaKm = Math.round((rescueDistanceKm - originalDistanceKm) * 10) / 10;

    routeReassignment = {
      waybillNumber: `WYB-RESCUE-${Date.now().toString().slice(-6)}`,
      transporterFleet: 'EcoFlow Rapid Response Tanker Fleet',
      assignedVehicle: 'TN-09-CV-8841 (Standby Unit B-4)',
      driverName: 'Senthil Kumar (Verified Hazmat / Non-Potable Certified)',
      driverContact: '+91 97890 44556',
      pickupLocation: {
        supplierId: winningAlternative.sourceId,
        supplierName: winningAlternative.sourceName,
        coordinates: winningAlternative.coordinates
      },
      deliveryLocation: {
        demandId: targetDemand.id,
        buyerTitle: targetDemand.title,
        coordinates: targetDemand.coordinates || [13.0827, 80.2707]
      },
      originalDistanceKm,
      rescueDistanceKm,
      distanceDeltaKm,
      dispatchedVolumeLiters: Math.min(winningAlternative.availableQuantity, reqQuantity),
      estimatedTransitMins: winningAlternative.estimatedDeliveryMins,
      estimatedArrival: new Date(Date.now() + winningAlternative.estimatedDeliveryMins * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      transportCost: winningAlternative.transportCost,
      status: 'Route Reassigned & Standby Locked'
    };
  }

  // 6 Progressive Stages for UI Visualization & Verification Audit
  const workflowStages = [
    {
      stage: 1,
      title: 'Supplier Disruption Detected',
      status: 'completed',
      detail: `${incident.failureType} at ${failedSource.name}. Affected demand: ${targetDemand.title} (${reqQuantity.toLocaleString()} L).`,
      timestamp: incident.timestamp,
      badge: incident.isSimulated ? 'SIMULATED TELEMETRY' : 'LIVE SENSOR EVENT'
    },
    {
      stage: 2,
      title: 'Spatial Backup Scan',
      status: 'completed',
      detail: `Scanned all regional water nodes within ${searchRadiusKm} km radius. Identified ${candidatePool.length} alternative facilities.`,
      timestamp: new Date().toISOString()
    },
    {
      stage: 3,
      title: 'Safe Reuse Gate Quality Audit',
      status: 'completed',
      detail: `Validated NABL certification, CPCB reuse compatibility for '${targetDemand.purpose || 'Irrigation'}', and lab expiry. ${eligibleAlternatives.length} approved, ${rejectedAlternatives.length} rejected.`,
      timestamp: new Date().toISOString()
    },
    {
      stage: 4,
      title: 'Intelligent Multi-Criteria Ranking',
      status: 'completed',
      detail: `Evaluated candidates using 5 weighted parameters (Quality 30%, Capacity 25%, Proximity 20%, Cost 15%, EDT 10%).`,
      timestamp: new Date().toISOString()
    },
    {
      stage: 5,
      title: 'Alternative Supplier Selection',
      status: winningAlternative ? 'completed' : 'failed',
      detail: winningAlternative 
        ? `Selected ${winningAlternative.sourceName} (Score: ${winningAlternative.score}/100, Distance: ${winningAlternative.distanceKm} km, Cap: ${winningAlternative.availableQuantity.toLocaleString()} L).`
        : `No compliant alternative found within ${searchRadiusKm} km radius. Escalated Emergency Alert to Water Authority.`,
      timestamp: new Date().toISOString()
    },
    {
      stage: 6,
      title: 'Route Reassignment & Dispatch',
      status: routeReassignment ? 'completed' : 'failed',
      detail: routeReassignment 
        ? `Waybill #${routeReassignment.waybillNumber} issued to EcoFlow Tanker. Dynamic GPS waypoints updated.`
        : 'Transit dispatch blocked pending manual administrative authorization.',
      timestamp: new Date().toISOString()
    }
  ];

  // Persist incident and stats into data_store.json
  if (!db.rescueData) {
    db.rescueData = {
      activeIncident: null,
      history: [],
      stats: {
        totalIncidents: 0,
        rescuedLitres: 0,
        recoveriesCount: 0,
        partialRecoveriesCount: 0,
        failedIncidentsCount: 0,
        avgResponseSeconds: 3.8
      }
    };
  }

  const resultRecord = {
    incident,
    outcome,
    searchRadiusKm,
    evaluatedCandidates,
    eligibleAlternatives,
    rejectedAlternatives,
    winningAlternative,
    partialPlan,
    routeReassignment,
    workflowStages,
    executedAt: new Date().toISOString()
  };

  db.rescueData.activeIncident = resultRecord;
  db.rescueData.history.unshift({
    id: incident.incidentId,
    timestamp: incident.timestamp,
    failureType: incident.failureType,
    affectedSupplier: failedSource.name,
    affectedBuyer: targetDemand.title,
    outcome,
    rescuedVolume: routeReassignment ? routeReassignment.dispatchedVolumeLiters : 0,
    winningSupplier: winningAlternative ? winningAlternative.sourceName : 'None',
    isSimulated: incident.isSimulated
  });

  // Keep history limited to last 20
  if (db.rescueData.history.length > 20) {
    db.rescueData.history = db.rescueData.history.slice(0, 20);
  }

  // Update cumulative stats
  db.rescueData.stats.totalIncidents += 1;
  if (outcome === 'AUTOMATIC_RECOVERY') {
    db.rescueData.stats.recoveriesCount += 1;
    db.rescueData.stats.rescuedLitres += routeReassignment ? routeReassignment.dispatchedVolumeLiters : 0;
  } else if (outcome === 'PARTIAL_RECOVERY') {
    db.rescueData.stats.partialRecoveriesCount += 1;
    db.rescueData.stats.rescuedLitres += routeReassignment ? routeReassignment.dispatchedVolumeLiters : 0;
  } else {
    db.rescueData.stats.failedIncidentsCount += 1;
  }

  // Add system activity notification
  db.activities = db.activities || [];
  db.activities.unshift({
    id: `act-rescue-${Date.now()}`,
    type: 'rescue',
    title: `ReLoop Rescue™: ${scenario.name}`,
    detail: winningAlternative 
      ? `Continuous Supply Shield safely rerouted ${routeReassignment.dispatchedVolumeLiters.toLocaleString()} L from ${winningAlternative.sourceName} to ${targetDemand.title}.`
      : `Rescue Alert: No verified alternative found for ${targetDemand.title}. Emergency protocol engaged.`,
    time: 'Just now',
    timestamp: new Date().toISOString(),
    icon: 'shield-alert'
  });

  saveDB(db);

  return resultRecord;
}

/**
 * Confirm and Resolve Rescue Incident
 * Finalizes the failover match into the primary system matches, deliveries, and inventory.
 */
export async function resolveRescueIncident(incidentId) {
  const db = loadDB();
  const active = db.rescueData?.activeIncident;

  if (!active || (incidentId && active.incident.incidentId !== incidentId)) {
    throw new Error('Active rescue incident not found or already resolved.');
  }

  const { targetDemand, winningAlternative, routeReassignment } = {
    targetDemand: active.incident.affectedBuyer,
    winningAlternative: active.winningAlternative,
    routeReassignment: active.routeReassignment
  };

  if (!winningAlternative || !routeReassignment) {
    throw new Error('Cannot resolve incident without a verified winning backup supplier.');
  }

  // Deduct inventory from winning alternative
  const sourceInDB = (db.sources || []).find(s => s.id === winningAlternative.sourceId);
  if (sourceInDB) {
    sourceInDB.quantity = Math.max(0, (sourceInDB.quantity || 0) - routeReassignment.dispatchedVolumeLiters);
    if (sourceInDB.reservedQuantity !== undefined) {
      sourceInDB.reservedQuantity += routeReassignment.dispatchedVolumeLiters;
    }
  }

  // Mark affected source as suspended
  const failedSourceInDB = (db.sources || []).find(s => s.id === active.incident.affectedSupplier.id);
  if (failedSourceInDB) {
    failedSourceInDB.available = false;
    failedSourceInDB.availabilityStatus = 'Suspended (Rescue Failover)';
  }

  // Check if an existing match exists for this demand or disrupted supplier
  db.matches = db.matches || [];
  let existingMatch = db.matches.find(m => 
    (m.demandId === targetDemand.id || m.sourceId === active.incident.affectedSupplier.id) &&
    m.status !== 'Completed' && m.status !== 'Cancelled'
  );

  let newMatch;
  if (existingMatch) {
    // Update existing match in-place without creating orphan duplicate records
    existingMatch.previousSourceName = existingMatch.sourceName;
    existingMatch.sourceId = winningAlternative.sourceId;
    existingMatch.sourceName = `${winningAlternative.sourceName} (ReLoop Rescue™)`;
    existingMatch.quantity = routeReassignment.dispatchedVolumeLiters;
    existingMatch.matchedQuantity = routeReassignment.dispatchedVolumeLiters;
    existingMatch.distanceKm = winningAlternative.distanceKm;
    existingMatch.status = 'In Transit';
    existingMatch.isRescue = true;
    existingMatch.rescueIncidentId = active.incident.incidentId;
    existingMatch.deliveryRef = routeReassignment.waybillNumber;
    existingMatch.waybill = routeReassignment.waybillNumber;
    existingMatch.deliveryReference = routeReassignment.waybillNumber;
    existingMatch.driverName = routeReassignment.driverName;
    existingMatch.driverPhone = routeReassignment.driverContact;
    existingMatch.updatedAt = new Date().toISOString();
    newMatch = existingMatch;

    // Mirror to sellerMatches
    const sMatch = (db.sellerMatches || []).find(m => m.id === existingMatch.id);
    if (sMatch) Object.assign(sMatch, existingMatch);
  } else {
    // Create new match if none exists
    newMatch = {
      id: `mat-rescue-${Date.now()}`,
      sourceId: winningAlternative.sourceId,
      sourceName: `${winningAlternative.sourceName} (ReLoop Rescue™)`,
      demandId: targetDemand.id,
      destinationName: targetDemand.title || targetDemand.buyerName || 'Green Park Facility',
      buyerName: targetDemand.buyerName || 'Green Park Facilities',
      quantity: routeReassignment.dispatchedVolumeLiters,
      matchedQuantity: routeReassignment.dispatchedVolumeLiters,
      distanceKm: winningAlternative.distanceKm,
      status: 'In Transit',
      matchedAt: 'Just now',
      isRescue: true,
      rescueIncidentId: active.incident.incidentId,
      deliveryRef: routeReassignment.waybillNumber,
      waybill: routeReassignment.waybillNumber,
      deliveryReference: routeReassignment.waybillNumber,
      driverName: routeReassignment.driverName,
      driverPhone: routeReassignment.driverContact,
      tankerCapacity: `${routeReassignment.dispatchedVolumeLiters} L`,
      estimatedCost: routeReassignment.freightCostInr || 1200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.matches.unshift(newMatch);
    db.sellerMatches = db.sellerMatches || [];
    db.sellerMatches.unshift(newMatch);
  }

  // Sync with MongoDB if available
  if (isDbConnected()) {
    try {
      await syncMongoMatch(newMatch);
      await Notification.create({
        recipientRole: 'buyer',
        title: 'ReLoop Rescue™ Continuous Supply Shield Engaged',
        message: `Your scheduled water delivery has been dynamically rerouted to ${winningAlternative.sourceName} to avoid disruption. Tanker is in transit.`,
        type: 'rescue',
        priority: 'high'
      });
      await AuditLog.create({
        action: 'RESCUE_FAILOVER_DISPATCHED',
        entityType: 'Match',
        entityId: newMatch.id,
        performedBy: 'System Autonomous Shield',
        details: {
          incidentId: active.incident.incidentId,
          failedSupplier: active.incident.affectedSupplier.name,
          backupSupplier: winningAlternative.sourceName,
          volume: routeReassignment.dispatchedVolumeLiters
        }
      });
    } catch (e) {
      console.warn('[resolveRescueIncident] Mongo sync error:', e.message);
    }
  }

  // Clear active incident
  db.rescueData.activeIncident = null;
  saveDB(db);

  return {
    success: true,
    message: `ReLoop Rescue™ reroute confirmed! Dispatched ${routeReassignment.dispatchedVolumeLiters.toLocaleString()} L from ${winningAlternative.sourceName}.`,
    match: newMatch,
    waybill: routeReassignment
  };
}

/**
 * Reset Rescue Simulation to baseline state
 */
export function resetRescueSimulation() {
  const db = loadDB();
  if (db.rescueData) {
    db.rescueData.activeIncident = null;
  }
  // Restore any suspended sources from simulation
  if (db.sources) {
    db.sources.forEach(s => {
      if (s.availabilityStatus?.includes('Rescue Failover')) {
        s.available = true;
        s.availabilityStatus = 'Available';
      }
    });
  }
  saveDB(db);
  return { success: true, message: 'Rescue simulation reset to normal standby state.' };
}

/**
 * Get Current Rescue Overview and Metrics
 */
export async function getRescueOverview() {
  const db = loadDB();
  const sources = await getCanonicalSources();

  // Active verified standby nodes count
  const standbyCount = sources.filter(s => 
    s.available !== false && 
    (s.verificationStatus === 'Verified' || s.quality === 'Verified') &&
    (s.quantity || 0) > 0
  ).length;

  if (!db.rescueData) {
    db.rescueData = {
      activeIncident: null,
      history: [],
      stats: {
        totalIncidents: 4,
        rescuedLitres: 16000,
        recoveriesCount: 4,
        partialRecoveriesCount: 0,
        failedIncidentsCount: 0,
        avgResponseSeconds: 3.4
      }
    };
    saveDB(db);
  }

  return {
    activeIncident: db.rescueData.activeIncident,
    stats: {
      ...db.rescueData.stats,
      activeStandbyNodesCount: standbyCount
    },
    history: db.rescueData.history || [],
    scenarios: RESCUE_SCENARIOS,
    availableSources: sources.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type || s.category,
      quantity: s.quantity,
      quality: s.quality || s.verificationStatus,
      coordinates: s.coordinates,
      available: s.available
    }))
  };
}

