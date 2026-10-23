import bcrypt from 'bcryptjs';
import {
  User,
  SupplierListing,
  BuyerRequest,
  Match,
  QualityReport,
  Delivery,
  Notification,
  AuditLog,
} from './models/index.js';
import { isDbConnected } from './db.js';

export async function seedInitialData() {
  if (!isDbConnected()) {
    console.log('[Seed] Database not connected yet, skipping MongoDB direct seed.');
    return;
  }

  try {
    const passwordHash = bcrypt.hashSync('Password123!', 10);

    // Upsert standard demo accounts
    const ensureUser = async (userData) => {
      let u = await User.findOne({ email: userData.email });
      if (!u) {
        u = await User.create({ ...userData, password: passwordHash });
      }
      return u;
    };

    const admin = await ensureUser({
      role: 'admin',
      fullName: 'System Administrator',
      email: 'admin@reloop.org',
      phone: '9900011223',
      organization: 'ReLoop Water Authority',
      accountStatus: 'active',
      verified: true,
      location: { address: 'Anna Salai, Chennai', coordinates: [13.0827, 80.2707] },
    });

    const supplier1 = await ensureUser({
      role: 'supplier',
      fullName: 'Apex Tech Park STP',
      email: 'supplier@reloop.org',
      phone: '9811122334',
      organization: 'Apex Commercial Facilities Ltd.',
      accountStatus: 'active',
      verified: true,
      location: { address: 'OMR IT Corridor, Chennai', coordinates: [12.9800, 80.2200] },
    });

    const supplier2 = await ensureUser({
      role: 'supplier',
      fullName: 'Ambattur Industrial Effluent Plant',
      email: 'ambattur.stp@reloop.org',
      phone: '9822233445',
      organization: 'Ambattur Industrial Estate Association',
      accountStatus: 'active',
      verified: true,
      location: { address: 'Ambattur Industrial Estate, Chennai', coordinates: [13.0878, 80.2785] },
    });

    const buyer1 = await ensureUser({
      role: 'buyer',
      fullName: 'Green Park Housing Society',
      email: 'buyer@reloop.org',
      phone: '9876543210',
      organization: 'Green Park Residential Society',
      accountStatus: 'active',
      verified: true,
      location: { address: 'T. Nagar, Chennai', coordinates: [13.0418, 80.2341] },
    });

    const buyer2 = await ensureUser({
      role: 'buyer',
      fullName: 'Metro Rail Construction Corp',
      email: 'cmrl.procure@reloop.org',
      phone: '9833344556',
      organization: 'Chennai Metro Rail Ltd.',
      accountStatus: 'active',
      verified: true,
      location: { address: 'Koyambedu Works, Chennai', coordinates: [13.0694, 80.1948] },
    });

    const transporter = await ensureUser({
      role: 'transporter',
      fullName: 'EcoFlow Logistics Fleet',
      email: 'transporter@reloop.org',
      phone: '9877766554',
      organization: 'EcoFlow Water Tanker Services',
      accountStatus: 'active',
      verified: true,
      location: { address: 'Guindy Depot, Chennai', coordinates: [13.0067, 80.2025] },
    });

    const verifier = await ensureUser({
      role: 'verifier',
      fullName: 'AquaCert Labs Quality Assurance',
      email: 'verifier@reloop.org',
      phone: '9844433221',
      organization: 'AquaCert Environmental Testing Services',
      accountStatus: 'active',
      verified: true,
      location: { address: 'IIT Madras Research Park, Chennai', coordinates: [12.9915, 80.2425] },
    });

    console.log('[Seed] Standard user accounts verified. Clean slate maintained (0 demo sources/demands/matches). User can create new.');
    return;

    // 2. Supplier Listings (Exactly 2 items)
    const listings = await SupplierListing.create([
      {
        listingCode: 'LST-2026-001',
        supplierId: supplier1._id,
        supplierName: 'Apex Tech Park STP',
        waterCategory: 'Treated Wastewater',
        title: 'Apex Tech Park STP',
        description: 'Tertiary treated STP water, ultrafiltered and UV disinfected, verified for safe non-potable reuse.',
        totalQuantity: 15000,
        availableQuantity: 9000,
        pricePerLitre: 0.12,
        indicativePrice: '₹0.12/L',
        intendedUses: ['Irrigation', 'Landscaping', 'Construction', 'Toilet Flushing'],
        location: { address: 'Sholinganallur, OMR, Chennai', coordinates: [12.9800, 80.2200] },
        qualityVerificationStatus: 'Verified',
        status: 'active',
      },
      {
        listingCode: 'LST-2026-002',
        supplierId: supplier1._id,
        supplierName: 'Apex Commercial Facilities Ltd.',
        waterCategory: 'Rainwater',
        title: 'Nivi Apartment',
        description: 'High-capacity harvested rainwater reservoir treated with multi-stage sand & carbon filtration.',
        totalQuantity: 10000,
        availableQuantity: 8000,
        pricePerLitre: 0.10,
        indicativePrice: '₹0.10/L',
        intendedUses: ['Landscaping', 'Construction', 'Toilet Flushing', 'Irrigation'],
        location: { address: 'Guindy Industrial Corridor, Chennai', coordinates: [13.0067, 80.2050] },
        qualityVerificationStatus: 'Verified',
        status: 'active',
      },
    ]);

    // 3. Buyer Requests (Exactly 2 items)
    const requests = await BuyerRequest.create([
      {
        requestCode: 'REQ-2026-001',
        buyerId: buyer1._id,
        buyerName: 'Green Park Housing Society',
        title: 'Green Park Housing Society',
        waterCategory: 'Treated Wastewater',
        requiredQuantity: 4000,
        fulfilledQuantity: 4000,
        purpose: 'Irrigation',
        intendedUse: 'Irrigation',
        indicativeBudget: '₹0.15/L',
        deliveryLocation: { address: 'T. Nagar, Chennai', coordinates: [13.0418, 80.2341] },
        priority: 'Standard',
        requiredQuality: 'Verified',
        status: 'Matched',
        matchingStatus: 'Dispatched',
      },
      {
        requestCode: 'REQ-2026-002',
        buyerId: buyer2._id,
        buyerName: 'Metro Rail Construction Corp',
        title: 'Metro Rail Construction Corp',
        waterCategory: 'Rainwater',
        requiredQuantity: 2000,
        fulfilledQuantity: 0,
        purpose: 'Construction',
        intendedUse: 'Construction',
        indicativeBudget: '₹0.12/L',
        deliveryLocation: { address: 'Koyambedu, Chennai', coordinates: [13.0694, 80.1948] },
        priority: 'High',
        requiredQuality: 'Standard',
        status: 'Active',
        matchingStatus: 'In Review',
      },
    ]);

    // 4. Quality Reports (Exactly 2 items)
    await QualityReport.create([
      {
        reportCode: 'QLT-2026-098',
        sourceId: 'src-seller-1',
        sourceName: 'Apex Tech Park STP',
        listingId: listings[0]._id,
        verifierId: verifier._id,
        verifierName: 'AquaCert Labs Quality Assurance',
        sampleCollectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        testDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        waterCategory: 'Treated Wastewater',
        intendedReuseCategory: 'Irrigation & Landscaping',
        parameters: [
          { name: 'pH', value: 7.2, unit: 'pH', minLimit: 6.5, maxLimit: 8.5, passed: true },
          { name: 'Turbidity', value: 1.1, unit: 'NTU', minLimit: 0, maxLimit: 5.0, passed: true },
          { name: 'TDS (Total Dissolved Solids)', value: 410, unit: 'ppm', minLimit: 0, maxLimit: 1000, passed: true },
          { name: 'BOD (Biochemical Oxygen Demand)', value: 4.2, unit: 'mg/L', minLimit: 0, maxLimit: 30, passed: true },
          { name: 'COD (Chemical Oxygen Demand)', value: 18, unit: 'mg/L', minLimit: 0, maxLimit: 100, passed: true },
        ],
        overallResult: 'Passed',
        status: 'Approved',
        certificateNumber: 'LAB-2026-098',
        reviewerNotes: 'Compliant with CPCB Class B Standards for non-contact reuse.',
        reviewedByName: 'System Administrator',
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        reportCode: 'QLT-2026-112',
        sourceId: 'src-seller-2',
        sourceName: 'Nivi Apartment',
        listingId: listings[1]._id,
        verifierId: verifier._id,
        verifierName: 'AquaCert Labs Quality Assurance',
        sampleCollectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        testDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        waterCategory: 'Rainwater',
        intendedReuseCategory: 'Irrigation & Construction',
        parameters: [
          { name: 'pH', value: 7.1, unit: 'pH', minLimit: 6.5, maxLimit: 8.5, passed: true },
          { name: 'Turbidity', value: 1.0, unit: 'NTU', minLimit: 0, maxLimit: 5.0, passed: true },
          { name: 'TDS (Total Dissolved Solids)', value: 220, unit: 'ppm', minLimit: 0, maxLimit: 1000, passed: true },
          { name: 'BOD (Biochemical Oxygen Demand)', value: 3.0, unit: 'mg/L', minLimit: 0, maxLimit: 30, passed: true },
          { name: 'COD (Chemical Oxygen Demand)', value: 12, unit: 'mg/L', minLimit: 0, maxLimit: 100, passed: true },
        ],
        overallResult: 'Passed',
        status: 'Approved',
        certificateNumber: 'LAB-2026-112',
        reviewerNotes: 'Verified compliance with CPCB Class B standards.',
        reviewedByName: 'System Administrator',
        reviewedAt: new Date(),
      },
    ]);

    // 5. Matches (Exactly 2 items)
    const matches = await Match.create([
      {
        matchCode: 'MCH-2026-001',
        sourceId: 'src-seller-1',
        sourceName: 'Apex Tech Park STP',
        demandId: 'dem-1',
        destinationName: 'Green Park Housing Society',
        supplierId: supplier1._id,
        buyerId: buyer1._id,
        listingId: listings[0]._id,
        requestId: requests[0]._id,
        quantity: 4000,
        distanceKm: 3.5,
        waterCategory: 'Treated Wastewater',
        matchScore: 94,
        status: 'Matched',
        approvedByName: 'System Administrator',
        approvedAt: new Date(),
      },
      {
        matchCode: 'MCH-2026-002',
        sourceId: 'src-seller-2',
        sourceName: 'Nivi Apartment',
        demandId: 'dem-2',
        destinationName: 'Metro Rail Construction Corp',
        supplierId: supplier1._id,
        buyerId: buyer2._id,
        listingId: listings[1]._id,
        requestId: requests[1]._id,
        quantity: 2000,
        distanceKm: 4.8,
        waterCategory: 'Rainwater',
        matchScore: 89,
        status: 'Completed',
        approvedByName: 'System Administrator',
        approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ]);

    // 6. Deliveries (Exactly 2 items)
    await Delivery.create([
      {
        deliveryCode: 'DLV-2026-001',
        matchId: matches[0]._id,
        sourceName: 'Apex Tech Park STP',
        destinationName: 'Green Park Housing Society',
        transporterName: 'EcoFlow Logistics Fleet',
        transporterId: transporter._id,
        driverName: 'K. Ramesh',
        driverPhone: '+91 98401 22334',
        vehicleNumber: 'TN-09-AX-4421',
        waterCategory: 'Treated Wastewater',
        quantity: 4000,
        status: 'In Transit',
        pickupLocation: {
          name: 'Apex Tech Park STP Dock',
          address: 'OMR Sholinganallur, Chennai',
          coordinates: [12.9800, 80.2200],
        },
        deliveryLocation: {
          name: 'Green Park Housing Society Tank #1',
          address: 'T. Nagar, Chennai',
          coordinates: [13.0418, 80.2341],
        },
        estimatedDistanceKm: 3.5,
      },
      {
        deliveryCode: 'DLV-2026-002',
        matchId: matches[1]._id,
        sourceName: 'Nivi Apartment',
        destinationName: 'Metro Rail Construction Corp',
        transporterName: 'EcoFlow Logistics Fleet',
        transporterId: transporter._id,
        driverName: 'P. Vignesh',
        driverPhone: '+91 98412 88712',
        vehicleNumber: 'TN-02-ZZ-8190',
        waterCategory: 'Rainwater',
        quantity: 2000,
        status: 'Completed',
        pickupLocation: {
          name: 'Nivi Apartment Rainwater Basin',
          address: 'Guindy Industrial Corridor, Chennai',
          coordinates: [13.0067, 80.2050],
        },
        deliveryLocation: {
          name: 'Metro Rail Viaduct Segment',
          address: 'Koyambedu, Chennai',
          coordinates: [13.0694, 80.1948],
        },
        estimatedDistanceKm: 4.8,
      },
    ]);

    // 7. Notifications
    await Notification.create([
      {
        title: 'Water Quality Report Pending Review',
        message: 'AquaCert Labs submitted quality report QLT-2026-099 for Apex Tech Park STP.',
        type: 'quality',
        severity: 'info',
        read: false,
        link: '/admin/quality',
        targetRole: 'admin',
      },
      {
        title: 'New High Priority Match Generated',
        message: 'Smart Matching Hub generated match MCH-2026-003 with 86% compatibility score.',
        type: 'matching',
        severity: 'success',
        read: false,
        link: '/admin/matching',
        targetRole: 'admin',
      },
      {
        title: 'Active Tanker In Transit',
        message: 'Delivery DLV-2026-002 dispatched by EcoFlow Fleet towards Koyambedu Metro Works.',
        type: 'delivery',
        severity: 'info',
        read: true,
        link: '/admin/deliveries',
        targetRole: 'admin',
      },
      {
        title: 'Unmatched Urgent Request',
        message: 'Request REQ-2026-003 (Green Park Housing Society, 3,500 L) is currently unmatched.',
        type: 'alert',
        severity: 'warning',
        read: false,
        link: '/admin/supply-requests',
        targetRole: 'admin',
      },
    ]);

    // 8. Audit Logs
    await AuditLog.create([
      {
        actor: { id: admin._id.toString(), name: 'System Administrator', role: 'admin', email: 'admin@reloop.org' },
        action: 'MATCH_APPROVED',
        targetEntity: 'Match',
        targetId: 'MCH-2026-002',
        details: 'Approved allocation of 4,000 L Treated Wastewater from Apex STP to Metro Rail Construction Corp',
        reason: 'Pre-certified water quality & critical municipal infrastructure priority',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        actor: { id: admin._id.toString(), name: 'System Administrator', role: 'admin', email: 'admin@reloop.org' },
        action: 'QUALITY_APPROVED',
        targetEntity: 'QualityReport',
        targetId: 'QLT-2026-081',
        details: 'Approved lab verification report for Ambattur Industrial Effluent Plant',
        reason: 'All tested parameters meet CPCB non-potable Class IV reuse limits',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        actor: { id: admin._id.toString(), name: 'System Administrator', role: 'admin', email: 'admin@reloop.org' },
        action: 'USER_VERIFIED',
        targetEntity: 'User',
        targetId: supplier1._id.toString(),
        details: 'Verified commercial credentials for Apex Tech Park STP',
        reason: 'Trade license and pollution control board consent order inspected',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('[Seed] Demo data successfully initialized in MongoDB!');
  } catch (error) {
    console.error('[Seed] Error initializing demo data:', error);
  }
}
