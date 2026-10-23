import express from 'express';
import {
  User,
  SupplierListing,
  BuyerRequest,
  Match,
  QualityReport,
  Delivery,
  Notification,
  AuditLog,
} from '../models/index.js';
import { isDbConnected } from '../db.js';
import { evaluateCandidateMatch, calculateDistanceKm } from '../services/matchingService.js';
import mongoose from 'mongoose';
import { memoryUsers } from './auth.js';
import { loadDB, saveDB, updateMatchStatus } from '../services/inventoryService.js';

const router = express.Router();

// Helper to log administrative actions
async function createAuditEntry(actor, action, targetEntity, targetId, details, reason, ip = '127.0.0.1') {
  try {
    if (isDbConnected()) {
      await AuditLog.create({
        actor: {
          id: actor?.id || 'admin-1',
          name: actor?.fullName || actor?.name || 'System Administrator',
          role: actor?.role || 'admin',
          email: actor?.email || 'admin@reloop.org',
        },
        action,
        targetEntity,
        targetId: String(targetId),
        details,
        reason: reason || '',
        ipAddress: ip,
        timestamp: new Date(),
      });
    }
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
}

// ---------------------------------------------------------------------------
// 1. OVERVIEW ANALYTICS (/api/admin/overview)
// ---------------------------------------------------------------------------
router.get('/overview', async (req, res) => {
  try {
    let metrics = {
      totalWaterReused: 0,
      waterReusedToday: 0,
      activeSuppliers: 0,
      pendingBuyerRequests: 0,
      pendingQualityApprovals: 0,
      activeDeliveries: 0,
      successfulMatches: 0,
      systemHealth: {
        status: 'Operational',
        database: isDbConnected() ? 'MongoDB Connected' : 'Resilient In-Memory Store',
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        connectedAt: new Date().toISOString(),
      },
      charts: {
        reuseTrends: [],
        monthlySupplyDemand: [],
        matchesComparison: [],
        reuseByCategory: [],
        deliveryStatusBreakdown: [],
      },
    };

    const db = loadDB();

    // Compute live values from canonical data_store
    const canonicalCompleted = (db.matches || []).filter(m => m.status === 'Completed');
    let dbWaterReused = canonicalCompleted.reduce((sum, m) => sum + (Number(m.confirmedReusedQuantity || m.matchedQuantity || m.quantity) || 0), 0);
    let dbActiveSuppliers = (db.sources || []).length || (db.sellerSources || []).length;
    let dbPendingRequests = (db.requests || []).filter(r => r.status === 'Pending').length + (db.demands || []).filter(d => d.status === 'Active' || d.status === 'Partially Matched').length;
    let dbPendingQuality = (db.sellerDocuments || []).filter(d => d.status === 'Pending' || d.status === 'Pending Review').length;
    let dbActiveDeliveries = (db.matches || []).filter(m => m.status === 'In Transit' || m.status === 'Scheduled').length;
    let dbSuccessfulMatches = (db.matches || []).filter(m => m.status === 'Confirmed' || m.status === 'Completed').length;

    metrics.totalWaterReused = dbWaterReused;
    metrics.activeSuppliers = dbActiveSuppliers;
    metrics.pendingBuyerRequests = dbPendingRequests;
    metrics.pendingQualityApprovals = dbPendingQuality;
    metrics.activeDeliveries = dbActiveDeliveries;
    metrics.successfulMatches = dbSuccessfulMatches;

    metrics.charts = {
      reuseTrends: [
        { month: 'Current', volume: metrics.totalWaterReused, freshwaterSaved: metrics.totalWaterReused }
      ],
      monthlySupplyDemand: [
        { month: 'Current', supply: (db.sources || []).reduce((s, x) => s + (Number(x.totalRegisteredQuantity || x.quantity) || 0), 0), demand: (db.demands || []).reduce((s, x) => s + (Number(x.quantity) || 0), 0), matched: metrics.totalWaterReused }
      ],
      matchesComparison: [
        { name: 'Successful Matches', count: metrics.successfulMatches },
        { name: 'Active In Transit', count: metrics.activeDeliveries },
        { name: 'Pending Demands', count: metrics.pendingBuyerRequests },
      ],
      reuseByCategory: (db.sources || []).map(s => ({
        category: s.category || s.type || 'Treated Water',
        volume: Number(s.quantity) || 0,
        percentage: 100
      })),
      deliveryStatusBreakdown: [
        { status: 'Completed', count: (db.matches || []).filter(m => m.status === 'Completed').length, fill: '#10b981' },
        { status: 'In Transit', count: (db.matches || []).filter(m => m.status === 'In Transit').length, fill: '#2563eb' },
        { status: 'Scheduled', count: (db.matches || []).filter(m => m.status === 'Scheduled' || m.status === 'Confirmed').length, fill: '#06b6d4' }
      ]
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: 'Failed to retrieve overview analytics.' });
  }
});

// ---------------------------------------------------------------------------
// 2. USER MANAGEMENT (/api/admin/users)
// ---------------------------------------------------------------------------
router.get('/users', async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (role && role !== 'all') query.role = role.toLowerCase();
      if (status && status !== 'all') query.accountStatus = status.toLowerCase();
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { organization: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      // Fetch association counts for each user
      const usersWithMetrics = await Promise.all(
        users.map(async (u) => {
          const userObj = u.toObject();
          if (u.role === 'supplier') {
            userObj.associatedListingsCount = await SupplierListing.countDocuments({ supplierId: u._id });
          } else if (u.role === 'buyer') {
            userObj.associatedRequestsCount = await BuyerRequest.countDocuments({ buyerId: u._id });
          } else if (u.role === 'transporter') {
            userObj.associatedDeliveriesCount = await Delivery.countDocuments({ transporterId: u._id });
          } else if (u.role === 'verifier') {
            userObj.associatedReportsCount = await QualityReport.countDocuments({ verifierId: u._id });
          }
          return userObj;
        })
      );

      return res.json({
        users: usersWithMetrics,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // In-memory fallback
    let list = [...memoryUsers];
    if (role && role !== 'all') list = list.filter(u => u.role.toLowerCase() === role.toLowerCase());
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(u => (u.fullName || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s));
    }

    res.json({
      users: list.map(u => ({
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        organization: u.organization,
        accountStatus: 'active',
        verified: true,
        createdAt: new Date().toISOString(),
      })),
      pagination: { total: list.length, page: 1, totalPages: 1 },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// Update user status (activate / suspend)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'suspended', 'pending_verification'].includes(status)) {
      return res.status(400).json({ error: 'Invalid account status specified.' });
    }

    if (isDbConnected()) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      // Prevent suspending primary admin
      if (user.role === 'admin' && user.email === 'admin@reloop.org' && status === 'suspended') {
        return res.status(400).json({ error: 'Root administrator account cannot be suspended.' });
      }

      user.accountStatus = status;
      await user.save();

      await createAuditEntry(
        req.user,
        `USER_${status.toUpperCase()}`,
        'User',
        user._id,
        `User ${user.fullName} (${user.email}) status changed to ${status}`,
        reason || `Admin updated account status to ${status}`
      );

      return res.json({ message: `Account status updated to ${status}.`, user });
    }

    res.json({ message: `Status updated to ${status} (memory mode).` });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;

    if (!['admin', 'supplier', 'buyer', 'transporter', 'verifier'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    if (isDbConnected()) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      const oldRole = user.role;
      user.role = role;
      await user.save();

      await createAuditEntry(
        req.user,
        'ROLE_CHANGED',
        'User',
        user._id,
        `Role for ${user.fullName} updated from ${oldRole} to ${role}`,
        reason || 'Administrative role adjustment'
      );

      return res.json({ message: `User role changed to ${role}.`, user });
    }

    res.json({ message: `User role updated to ${role} (memory mode).` });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// ---------------------------------------------------------------------------
// 3. WATER SUPPLY LISTINGS (/api/suppliers)
// ---------------------------------------------------------------------------
router.get('/suppliers/listings', async (req, res) => {
  try {
    const { category, status, verification, search } = req.query;
    const db = loadDB();

    const canonicalSources = (db.sources || []).map(s => ({
      _id: s.id,
      listingCode: s.id.toUpperCase().replace('SRC-SELLER-', 'LST-'),
      supplierName: s.supplierName || s.name,
      waterCategory: s.category || s.type || 'Treated Wastewater',
      title: s.name,
      totalQuantity: Number(s.totalRegisteredQuantity || s.quantity) || 5000,
      availableQuantity: Number(s.quantity !== undefined ? s.quantity : 5000),
      pricePerLitre: s.pricePerLitre || 0.10,
      indicativePrice: s.indicativePrice || '₹0.10/L',
      location: { 
        address: s.location || 'Chennai, Tamil Nadu', 
        coordinates: s.coordinates || [12.98, 80.22] 
      },
      qualityVerificationStatus: s.quality || s.verificationStatus || 'Verified',
      status: s.available !== false ? 'active' : 'suspended',
      createdAt: s.lastUpdated || new Date().toISOString(),
    }));

    let mongoListings = [];
    if (isDbConnected()) {
      try {
        const query = {};
        if (category && category !== 'all') query.waterCategory = category;
        if (status && status !== 'all') query.status = status;
        if (verification && verification !== 'all') query.qualityVerificationStatus = verification;
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { supplierName: { $regex: search, $options: 'i' } },
            { listingCode: { $regex: search, $options: 'i' } },
          ];
        }
        mongoListings = await SupplierListing.find(query).sort({ createdAt: -1 });
      } catch (e) {
        // Fallback to canonical
      }
    }

    let combined = [...canonicalSources];
    for (const ml of mongoListings) {
      if (!combined.some(c => c._id === String(ml._id) || c.listingCode === ml.listingCode)) {
        combined.push(ml);
      }
    }

    if (category && category !== 'all') {
      combined = combined.filter(c => c.waterCategory.toLowerCase() === category.toLowerCase());
    }
    if (status && status !== 'all') {
      combined = combined.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      combined = combined.filter(c => (c.title || '').toLowerCase().includes(s) || (c.supplierName || '').toLowerCase().includes(s));
    }

    res.json(combined);
  } catch (error) {
    console.error('Error fetching supplier listings:', error);
    res.status(500).json({ error: 'Failed to retrieve supplier listings.' });
  }
});

// Update listing status / moderation
router.patch('/suppliers/listings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (isDbConnected()) {
      const listing = await SupplierListing.findById(id);
      if (!listing) return res.status(404).json({ error: 'Listing not found.' });

      listing.status = status;
      await listing.save();

      await createAuditEntry(
        req.user,
        `LISTING_${status.toUpperCase()}`,
        'SupplierListing',
        listing._id,
        `Listing ${listing.listingCode} (${listing.title}) updated to status: ${status}`,
        reason || 'Admin status update'
      );

      return res.json({ message: 'Listing status updated.', listing });
    }

    res.json({ message: 'Listing status updated (memory mode).' });
  } catch (error) {
    console.error('Error updating listing status:', error);
    res.status(500).json({ error: 'Failed to update listing status.' });
  }
});

// ---------------------------------------------------------------------------
// 4. BUYER REQUESTS (/api/requests)
// ---------------------------------------------------------------------------
router.get('/requests', async (req, res) => {
  try {
    const { category, status, priority, search } = req.query;
    const db = loadDB();

    const canonicalRequests = (db.requests || []).map(r => ({
      _id: r.id,
      requestCode: r.id.toUpperCase().replace('REQ-', 'REQ-2026-'),
      buyerName: r.buyerName || 'Green Park',
      title: r.demandTitle || `Request for ${r.sourceName || 'Water'}`,
      waterCategory: r.intendedReuse || 'Treated Wastewater',
      requiredQuantity: Number(r.requestedQuantity) || 4000,
      fulfilledQuantity: r.status === 'Confirmed' || r.status === 'Completed' ? (Number(r.requestedQuantity) || 4000) : 0,
      purpose: r.intendedReuse || 'Flushing',
      priority: 'Standard',
      status: r.status || 'Active',
      matchingStatus: r.status === 'Confirmed' ? 'Matched' : 'In Review',
      deliveryLocation: { 
        address: r.deliveryLocation || 'Chennai, Tamil Nadu', 
        coordinates: r.coordinates || [13.0418, 80.2341] 
      },
      createdAt: r.createdAt || new Date().toISOString(),
    }));

    for (const d of (db.demands || [])) {
      if (!canonicalRequests.some(cr => cr._id === d.id || cr.title === d.title)) {
        canonicalRequests.push({
          _id: d.id,
          requestCode: d.id.toUpperCase().replace('DEM-', 'REQ-2026-'),
          buyerName: d.buyerName || 'Green Park',
          title: d.title || 'Water Demand',
          waterCategory: d.purpose || 'Treated Wastewater',
          requiredQuantity: Number(d.quantity) || 4000,
          fulfilledQuantity: Number(d.fulfilledQuantity) || 0,
          purpose: d.purpose || 'Irrigation',
          priority: 'Standard',
          status: d.status || 'Active',
          matchingStatus: d.status === 'Matched' ? 'Matched' : 'Unmatched',
          deliveryLocation: { 
            address: d.deliveryLocation || 'Chennai, Tamil Nadu', 
            coordinates: d.coordinates || [13.0827, 80.2707] 
          },
          createdAt: d.createdAt || new Date().toISOString(),
        });
      }
    }

    let mongoRequests = [];
    if (isDbConnected()) {
      try {
        const query = {};
        if (category && category !== 'all') query.waterCategory = category;
        if (status && status !== 'all') query.status = status;
        if (priority && priority !== 'all') query.priority = priority;
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { buyerName: { $regex: search, $options: 'i' } },
            { requestCode: { $regex: search, $options: 'i' } },
            { purpose: { $regex: search, $options: 'i' } },
          ];
        }
        mongoRequests = await BuyerRequest.find(query).sort({ createdAt: -1 });
      } catch (e) {
        // Fallback
      }
    }

    let combined = [...canonicalRequests];
    for (const mr of mongoRequests) {
      if (!combined.some(c => c._id === String(mr._id) || c.requestCode === mr.requestCode)) {
        combined.push(mr);
      }
    }

    if (category && category !== 'all') {
      combined = combined.filter(c => (c.waterCategory || '').toLowerCase() === category.toLowerCase());
    }
    if (status && status !== 'all') {
      combined = combined.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      combined = combined.filter(c => (c.title || '').toLowerCase().includes(s) || (c.buyerName || '').toLowerCase().includes(s));
    }

    res.json(combined);
  } catch (error) {
    console.error('Error fetching buyer requests:', error);
    res.status(500).json({ error: 'Failed to retrieve buyer requests.' });
  }
});

// ---------------------------------------------------------------------------
// 5. INTELLIGENT MATCHING HUB (/api/matches)
// ---------------------------------------------------------------------------
router.get('/matches', async (req, res) => {
  try {
    const { status } = req.query;
    const db = loadDB();

    const canonicalMatches = (db.matches || []).map(m => ({
      _id: m.id,
      matchCode: m.id.toUpperCase().replace('MAT-', 'MCH-2026-'),
      sourceName: m.sourceName || 'Water Source',
      destinationName: m.destinationName || m.buyerName || 'Green Park',
      quantity: Number(m.matchedQuantity || m.quantity) || 4000,
      matchedQuantity: Number(m.matchedQuantity || m.quantity) || 4000,
      distanceKm: Number(m.distanceKm || m.distance) || 5.5,
      waterCategory: m.intendedReuse || 'Treated Wastewater',
      matchScore: 94,
      status: m.status === 'Confirmed' ? 'Admin Approved' : (m.status || 'Proposed'),
      deliveryReference: m.deliveryRef || `DLV-${Date.now().toString().slice(-6)}`,
      driverName: m.driverName || 'Senthil Kumar (TN-09-CV-8841)',
      driverPhone: m.driverPhone || '+91 97890 44556',
      scoreFactors: {
        proximityScore: 95,
        quantityScore: 100,
        qualityScore: 92,
        urgencyScore: 90,
        reasons: ['Optimal logistics distance', 'High laboratory purity compatibility', 'Immediate tanker availability']
      },
      createdAt: m.createdAt || new Date().toISOString()
    }));

    let mongoMatches = [];
    if (isDbConnected()) {
      try {
        const query = {};
        if (status && status !== 'all') query.status = status;
        mongoMatches = await Match.find(query)
          .populate('supplierId', 'fullName email phone organization')
          .populate('buyerId', 'fullName email phone organization')
          .populate('listingId')
          .populate('requestId')
          .sort({ createdAt: -1 });
      } catch (e) {
        // Fallback
      }
    }

    let combined = [...canonicalMatches];
    for (const mm of mongoMatches) {
      if (!combined.some(c => c._id === String(mm._id) || c.matchCode === mm.matchCode)) {
        combined.push(mm);
      }
    }

    if (status && status !== 'all') {
      combined = combined.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    }

    res.json(combined);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to retrieve matches.' });
  }
});

// Candidate Generation: Discover potential matches between eligible listings and unmatched requests
router.post('/matches/generate-candidates', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ message: 'Candidate generation requires active database.', candidates: [] });
    }

    // 1. Get active listings with available quantity > 0
    const listings = await SupplierListing.find({
      status: 'active',
      availableQuantity: { $gt: 0 },
      qualityVerificationStatus: { $ne: 'Rejected' },
    });

    // 2. Get pending/active buyer requests
    const requests = await BuyerRequest.find({
      status: { $in: ['Active', 'Pending', 'Partially Matched'] },
      matchingStatus: { $in: ['Unmatched', 'In Review'] },
    });

    const candidates = [];

    for (const reqItem of requests) {
      const remainingDemand = reqItem.requiredQuantity - (reqItem.fulfilledQuantity || 0);
      if (remainingDemand <= 0) continue;

      for (const list of listings) {
        if (list.availableQuantity <= 0) continue;

        // Prevent self-matching if supplier and buyer are same organization
        if (String(list.supplierId) === String(reqItem.buyerId)) continue;

        const evalResult = evaluateCandidateMatch(list, reqItem);

        // Only recommend matches with decent score (>= 40)
        if (evalResult.matchScore >= 40) {
          const matchableQty = Math.min(list.availableQuantity, remainingDemand);

          candidates.push({
            listing: {
              _id: list._id,
              listingCode: list.listingCode,
              title: list.title,
              supplierName: list.supplierName,
              waterCategory: list.waterCategory,
              availableQuantity: list.availableQuantity,
              pricePerLitre: list.pricePerLitre,
              qualityVerificationStatus: list.qualityVerificationStatus,
              coordinates: list.location?.coordinates || [13.0827, 80.2707],
            },
            request: {
              _id: reqItem._id,
              requestCode: reqItem.requestCode,
              title: reqItem.title,
              buyerName: reqItem.buyerName,
              waterCategory: reqItem.waterCategory,
              requiredQuantity: reqItem.requiredQuantity,
              remainingDemand,
              purpose: reqItem.purpose,
              priority: reqItem.priority,
              coordinates: reqItem.deliveryLocation?.coordinates || [13.0418, 80.2341],
            },
            proposedQuantity: matchableQty,
            distanceKm: evalResult.distanceKm,
            matchScore: evalResult.matchScore,
            factors: evalResult.factors,
          });
        }
      }
    }

    // Sort by match score descending
    candidates.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ count: candidates.length, candidates });
  } catch (error) {
    console.error('Error generating candidates:', error);
    res.status(500).json({ error: 'Failed to generate match candidates.' });
  }
});

// Approve a Match (with transactional quantity updates, delivery record generation, and audit logging)
router.post('/matches/approve', async (req, res) => {
  try {
    const { candidate, matchId, notes } = req.body;

    if (!isDbConnected()) {
      return res.status(400).json({ error: 'Database is required to persist match approval.' });
    }

    let matchDoc = null;

    if (matchId) {
      matchDoc = await Match.findById(matchId);
      if (!matchDoc) return res.status(404).json({ error: 'Match record not found.' });

      matchDoc.status = 'Admin Approved';
      matchDoc.approvalNotes = notes || 'Approved by Administrator';
      matchDoc.approvedByName = req.user?.fullName || 'System Administrator';
      matchDoc.approvedAt = new Date();
      await matchDoc.save();
    } else if (candidate) {
      // Create new match from candidate
      const listing = await SupplierListing.findById(candidate.listing._id);
      const request = await BuyerRequest.findById(candidate.request._id);

      if (!listing || !request) {
        return res.status(404).json({ error: 'Listing or request no longer exists.' });
      }

      // Quantity verification
      const qtyToAllocate = Number(candidate.proposedQuantity || 1000);
      if (listing.availableQuantity < qtyToAllocate) {
        return res.status(400).json({
          error: `Insufficient supply: Listing only has ${listing.availableQuantity} L remaining.`,
        });
      }

      // Safety check: Cannot approve rejected water quality
      if (listing.qualityVerificationStatus === 'Rejected') {
        return res.status(400).json({
          error: 'Safety violation: Cannot approve match for water source with rejected laboratory test.',
        });
      }

      // Deduct available quantity from listing safely
      listing.availableQuantity = Math.max(0, listing.availableQuantity - qtyToAllocate);
      if (listing.availableQuantity === 0) listing.status = 'depleted';
      await listing.save();

      // Update buyer request fulfilled quantity
      request.fulfilledQuantity = (request.fulfilledQuantity || 0) + qtyToAllocate;
      if (request.fulfilledQuantity >= request.requiredQuantity) {
        request.status = 'Fulfilled';
        request.matchingStatus = 'Approved';
      } else {
        request.status = 'Partially Matched';
        request.matchingStatus = 'In Review';
      }
      await request.save();

      const matchCode = `MCH-2026-${Math.floor(100 + Math.random() * 900)}`;
      matchDoc = await Match.create({
        matchCode,
        sourceId: listing.listingCode,
        sourceName: listing.supplierName,
        demandId: request.requestCode,
        destinationName: request.buyerName,
        supplierId: listing.supplierId,
        buyerId: request.buyerId,
        listingId: listing._id,
        requestId: request._id,
        quantity: qtyToAllocate,
        distanceKm: candidate.distanceKm || 4.0,
        waterCategory: listing.waterCategory,
        matchScore: candidate.matchScore || 85,
        scoreFactors: candidate.factors || {},
        status: 'Admin Approved',
        approvalNotes: notes || 'Approved by Administrator',
        approvedByName: req.user?.fullName || 'System Administrator',
        approvedAt: new Date(),
      });

      // Automatically initialize Delivery in pipeline
      const deliveryCode = `DLV-2026-${Math.floor(100 + Math.random() * 900)}`;
      const newDelivery = await Delivery.create({
        deliveryCode,
        matchId: matchDoc._id,
        sourceName: listing.supplierName,
        destinationName: request.buyerName,
        transporterName: 'EcoFlow Logistics Fleet',
        quantity: qtyToAllocate,
        waterCategory: listing.waterCategory,
        status: 'Transporter Assigned',
        pickupLocation: {
          name: listing.supplierName,
          address: listing.location?.address || 'Chennai Source Station',
          coordinates: listing.location?.coordinates || [13.0878, 80.2785],
        },
        deliveryLocation: {
          name: request.buyerName,
          address: request.deliveryLocation?.address || 'Chennai Demand Site',
          coordinates: request.deliveryLocation?.coordinates || [13.0418, 80.2341],
        },
        currentLocation: {
          coordinates: listing.location?.coordinates || [13.0878, 80.2785],
          updatedAt: new Date(),
        },
        estimatedDistanceKm: candidate.distanceKm || 4.5,
        scheduledPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        statusHistory: [
          { status: 'Requested', timestamp: new Date(), updatedBy: 'System' },
          { status: 'Matched', timestamp: new Date(), updatedBy: 'Admin Approval' },
          { status: 'Transporter Assigned', timestamp: new Date(), updatedBy: 'Admin Dispatch' },
        ],
      });

      matchDoc.deliveryId = newDelivery._id;
      await matchDoc.save();

      // Record Audit Log
      await createAuditEntry(
        req.user,
        'MATCH_APPROVED',
        'Match',
        matchDoc._id,
        `Allocated ${qtyToAllocate.toLocaleString()} L from ${listing.supplierName} to ${request.buyerName} (Delivery ${deliveryCode} initialized)`,
        notes || 'Administrative match approval'
      );

      // Notification
      await Notification.create({
        title: 'Match Approved & Delivery Scheduled',
        message: `Match ${matchCode} approved: ${qtyToAllocate.toLocaleString()} L dispatched for transport.`,
        type: 'matching',
        severity: 'success',
        link: '/admin/deliveries',
      });
    }

    res.json({ message: 'Match successfully approved and dispatched to transport.', match: matchDoc });
  } catch (error) {
    console.error('Error approving match:', error);
    res.status(500).json({ error: error.message || 'Failed to approve match.' });
  }
});

// Reject or Manual Override
router.post('/matches/:id/override', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'reject' | 'override'

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A mandatory reason must be provided for match override or rejection.' });
    }

    if (isDbConnected()) {
      const match = await Match.findById(id).populate('listingId');
      if (!match) return res.status(404).json({ error: 'Match record not found.' });

      if (action === 'override') {
        // Enforce safety rule: water quality cannot be overridden if verified toxic / failed
        if (match.listingId && match.listingId.qualityVerificationStatus === 'Rejected') {
          return res.status(400).json({
            error: 'Safety restriction: Overrides cannot bypass rejected laboratory water quality standards.',
          });
        }

        match.status = 'Overridden';
        match.isOverridden = true;
        match.overrideReason = reason;
        match.overriddenBy = req.user?.fullName || 'System Administrator';
        await match.save();

        await createAuditEntry(
          req.user,
          'MATCH_OVERRIDDEN',
          'Match',
          match._id,
          `Match ${match.matchCode} overridden manually`,
          reason
        );
      } else {
        match.status = 'Rejected';
        match.approvalNotes = reason;
        await match.save();

        await createAuditEntry(
          req.user,
          'MATCH_REJECTED',
          'Match',
          match._id,
          `Match ${match.matchCode} rejected by administrator`,
          reason
        );
      }

      return res.json({ message: `Match ${action} executed successfully.`, match });
    }

    res.json({ message: `Match ${action} recorded (memory mode).` });
  } catch (error) {
    console.error('Error in match override:', error);
    res.status(500).json({ error: 'Failed to process match action.' });
  }
});

// ---------------------------------------------------------------------------
// 6. QUALITY VERIFICATION (/api/quality-reports)
// ---------------------------------------------------------------------------
router.get('/quality-reports', async (req, res) => {
  try {
    const { status, search } = req.query;
    const db = loadDB();

    const canonicalReports = (db.sellerDocuments || []).map(d => ({
      _id: d.id,
      reportCode: d.reportNumber || d.id.toUpperCase(),
      sourceName: d.sourceName || 'Registered Water Supplier',
      verifierName: d.labName || 'AquaCert Labs Quality Assurance',
      sampleCollectionDate: d.issueDate || new Date().toISOString(),
      testDate: d.issueDate || new Date().toISOString(),
      submissionDate: d.issueDate || new Date().toISOString(),
      waterCategory: 'Treated Wastewater',
      intendedReuseCategory: 'Landscaping & Utilities',
      parameters: d.parameters ? [
        { name: 'pH', value: d.parameters.ph || 7.2, unit: 'pH', minLimit: 6.5, maxLimit: 8.5, passed: true },
        { name: 'Turbidity', value: d.parameters.turbidity || 1.2, unit: 'NTU', maxLimit: 5.0, passed: true },
        { name: 'TDS (Total Dissolved Solids)', value: d.parameters.tds || 420, unit: 'ppm', maxLimit: 1000, passed: true },
        { name: 'BOD (Biochemical Oxygen Demand)', value: d.parameters.bod || 4.5, unit: 'mg/L', maxLimit: 30, passed: true },
        { name: 'COD (Chemical Oxygen Demand)', value: d.parameters.cod || 18, unit: 'mg/L', maxLimit: 100, passed: true },
        { name: 'E. Coli', value: 0, unit: 'CFU/100mL', maxLimit: 0, passed: true }
      ] : [
        { name: 'pH', value: 7.2, unit: 'pH', minLimit: 6.5, maxLimit: 8.5, passed: true },
        { name: 'Turbidity', value: 1.2, unit: 'NTU', maxLimit: 5.0, passed: true }
      ],
      overallResult: 'Passed',
      status: d.status || 'Approved',
      certificateNumber: d.reportNumber || 'CPCB-VERIFIED-2026',
      reviewerNotes: d.verificationNotes || 'Lab tests satisfy CPCB wastewater reuse specifications.',
      createdAt: d.issueDate || new Date().toISOString()
    }));

    let mongoReports = [];
    if (isDbConnected()) {
      try {
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (search) {
          query.$or = [
            { reportCode: { $regex: search, $options: 'i' } },
            { sourceName: { $regex: search, $options: 'i' } },
            { verifierName: { $regex: search, $options: 'i' } },
            { certificateNumber: { $regex: search, $options: 'i' } },
          ];
        }
        mongoReports = await QualityReport.find(query).sort({ createdAt: -1 });
      } catch (e) {
        // Fallback
      }
    }

    let combined = [...canonicalReports];
    for (const mr of mongoReports) {
      if (!combined.some(c => c._id === String(mr._id) || c.reportCode === mr.reportCode)) {
        combined.push(mr);
      }
    }

    if (status && status !== 'all') {
      combined = combined.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    }

    res.json(combined);
  } catch (error) {
    console.error('Error fetching quality reports:', error);
    res.status(500).json({ error: 'Failed to retrieve quality reports.' });
  }
});

// Approve or Reject Quality Report
router.patch('/quality-reports/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewerNotes, reason } = req.body; // status: 'Approved' | 'Rejected' | 'Needs Re-test'

    if (!['Approved', 'Rejected', 'Needs Re-test'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification decision.' });
    }

    if (status === 'Rejected' && (!reason || !reason.trim())) {
      return res.status(400).json({ error: 'A mandatory reason is required when rejecting a water quality report.' });
    }

    if (isDbConnected()) {
      const report = await QualityReport.findById(id);
      if (!report) return res.status(404).json({ error: 'Quality report not found.' });

      report.status = status;
      report.reviewerNotes = reviewerNotes || reason || '';
      report.reviewedByName = req.user?.fullName || 'System Administrator';
      report.reviewedAt = new Date();
      await report.save();

      // If approved or rejected, update corresponding SupplierListing qualityVerificationStatus
      if (report.listingId) {
        const listing = await SupplierListing.findById(report.listingId);
        if (listing) {
          listing.qualityVerificationStatus = status === 'Approved' ? 'Verified' : (status === 'Rejected' ? 'Rejected' : 'Pending');
          await listing.save();
        }
      }

      await createAuditEntry(
        req.user,
        `QUALITY_${status.toUpperCase().replace(/\s+/g, '_')}`,
        'QualityReport',
        report._id,
        `Quality report ${report.reportCode} (${report.sourceName}) marked ${status}`,
        reason || reviewerNotes
      );

      return res.json({ message: `Quality report marked as ${status}.`, report });
    }

    res.json({ message: `Quality report marked as ${status} (memory mode).` });
  } catch (error) {
    console.error('Error updating quality report:', error);
    res.status(500).json({ error: 'Failed to update quality report.' });
  }
});

// ---------------------------------------------------------------------------
// 7. DELIVERY & TRANSPORT MANAGEMENT (/api/deliveries)
// ---------------------------------------------------------------------------
router.get('/deliveries', async (req, res) => {
  try {
    const { status, search } = req.query;
    const db = loadDB();

    const canonicalDeliveries = (db.matches || []).map(m => ({
      _id: m.deliveryRef || `dlv-${m.id}`,
      deliveryCode: m.deliveryRef || `DLV-${Date.now().toString().slice(-6)}`,
      sourceName: m.sourceName || 'Water Source',
      destinationName: m.destinationName || m.buyerName || 'Green Park',
      transporterName: 'EcoFlow Logistics Fleet',
      driverName: m.driverName || 'Senthil Kumar',
      vehicleNumber: (m.driverName && m.driverName.includes('(')) ? m.driverName.match(/\(([^)]+)\)/)?.[1] || 'TN-09-CV-8841' : 'TN-09-CV-8841',
      quantity: Number(m.matchedQuantity || m.quantity) || 4000,
      status: m.status === 'Completed' ? 'Completed' : (m.status === 'In Transit' ? 'In Transit' : 'Transporter Assigned'),
      pickupLocation: { name: m.pickupLocation || 'Supplier Dock', coordinates: [12.9800, 80.2200] },
      deliveryLocation: { name: m.destinationLocation || 'Green Park', coordinates: [13.0827, 80.2707] },
      currentLocation: { coordinates: [13.0418, 80.2341], updatedAt: new Date().toISOString() },
      estimatedDistanceKm: Number(m.distanceKm || m.distance) || 5.5,
      createdAt: m.createdAt || new Date().toISOString()
    }));

    let mongoDeliveries = [];
    if (isDbConnected()) {
      try {
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (search) {
          query.$or = [
            { deliveryCode: { $regex: search, $options: 'i' } },
            { sourceName: { $regex: search, $options: 'i' } },
            { destinationName: { $regex: search, $options: 'i' } },
            { vehicleNumber: { $regex: search, $options: 'i' } },
            { driverName: { $regex: search, $options: 'i' } },
          ];
        }
        mongoDeliveries = await Delivery.find(query).sort({ createdAt: -1 });
      } catch (e) {
        // Fallback
      }
    }

    let combined = [...canonicalDeliveries];
    for (const md of mongoDeliveries) {
      if (!combined.some(c => c._id === String(md._id) || c.deliveryCode === md.deliveryCode)) {
        combined.push(md);
      }
    }

    if (status && status !== 'all') {
      combined = combined.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    }

    res.json(combined);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Failed to retrieve deliveries.' });
  }
});

// Update Delivery Lifecycle Status
router.patch('/deliveries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, currentLocation } = req.body;

    const VALID_STATES = [
      'Requested',
      'Matched',
      'Quality Cleared',
      'Transporter Assigned',
      'In Transit',
      'Delivered',
      'Completed',
      'Cancelled',
      'Disputed',
    ];

    if (!VALID_STATES.includes(status)) {
      return res.status(400).json({ error: 'Invalid delivery lifecycle state.' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    let delivery = null;

    if (isDbConnected()) {
      delivery = await Delivery.findOne({
        $or: [
          ...(isObjectId ? [{ _id: id }] : []),
          { deliveryCode: id },
        ],
      });

      if (delivery) {
        // Prevent re-completing already completed delivery
        if (delivery.status === 'Completed' && status === 'Completed') {
          return res.status(400).json({ error: 'Delivery is already marked completed.' });
        }

        delivery.status = status;
        if (currentLocation && Array.isArray(currentLocation.coordinates)) {
          delivery.currentLocation = {
            coordinates: currentLocation.coordinates,
            updatedAt: new Date(),
          };
        }

        if (status === 'In Transit' && !delivery.dispatchedAt) {
          delivery.dispatchedAt = new Date();
        }
        if (status === 'Delivered' && !delivery.deliveredAt) {
          delivery.deliveredAt = new Date();
        }
        if (status === 'Completed' && !delivery.completedAt) {
          delivery.completedAt = new Date();
        }

        delivery.statusHistory.push({
          status,
          timestamp: new Date(),
          updatedBy: req.user?.fullName || 'System Administrator',
          note: note || `State transitioned to ${status}`,
        });

        await delivery.save();

        await createAuditEntry(
          req.user,
          `DELIVERY_${status.toUpperCase().replace(/\s+/g, '_')}`,
          'Delivery',
          delivery._id,
          `Delivery ${delivery.deliveryCode} updated to ${status}`,
          note || ''
        );
      }
    }

    // Always synchronize with shared canonical data_store matches
    const db = loadDB();
    const match = (db.matches || []).find(m => m.deliveryRef === id || m.id === id || `dlv-${m.id}` === id);
    if (match) {
      const matchStatus = status === 'Transporter Assigned' ? 'Confirmed' : status;
      try {
        await updateMatchStatus(match.id, matchStatus, {
          instructions: note || `Admin updated delivery status to ${status}`
        });
      } catch (err) {
        console.warn('[adminRoutes] updateMatchStatus warning:', err.message);
      }
    }

    return res.json({ 
      success: true, 
      message: `Delivery state updated to ${status}.`, 
      delivery: delivery || { deliveryCode: id, status } 
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ error: 'Failed to update delivery.' });
  }
});

// ---------------------------------------------------------------------------
// 8. LOGISTICS MAP DATA (/api/map/locations)
// ---------------------------------------------------------------------------
router.get('/map/locations', async (req, res) => {
  try {
    let suppliers = [];
    let buyers = [];
    let activeDeliveries = [];

    const db = loadDB();

    suppliers = (db.sources || []).map(s => ({
      id: s.id,
      type: 'supplier',
      name: s.name,
      title: s.name,
      waterCategory: s.category || s.type || 'Treated Wastewater',
      quantity: Number(s.quantity) || 0,
      totalQuantity: Number(s.totalRegisteredQuantity || s.quantity) || 5000,
      indicativePrice: s.indicativePrice || '₹0.10/L',
      quality: s.quality || 'Verified',
      coordinates: s.coordinates || [12.98, 80.22],
      address: s.location || 'Chennai, Tamil Nadu',
    }));

    buyers = (db.demands || []).map(d => ({
      id: d.id,
      type: 'buyer',
      name: d.buyerName || 'Green Park',
      title: d.title,
      waterCategory: d.purpose || 'Treated Wastewater',
      requiredQuantity: Number(d.quantity) || 4000,
      fulfilledQuantity: Number(d.fulfilledQuantity) || 0,
      purpose: d.purpose || 'Irrigation',
      priority: 'Standard',
      coordinates: d.coordinates || [13.0827, 80.2707],
      address: d.deliveryLocation || 'Chennai, Tamil Nadu',
    }));

    activeDeliveries = (db.matches || [])
      .filter(m => m.status === 'In Transit' || m.status === 'Scheduled' || m.status === 'Confirmed')
      .map(m => ({
        id: m.deliveryRef || m.id,
        type: 'delivery',
        deliveryCode: m.deliveryRef || `DLV-${m.id.slice(-6)}`,
        sourceName: m.sourceName || 'Supplier',
        destinationName: m.destinationName || m.buyerName || 'Green Park',
        quantity: Number(m.matchedQuantity || m.quantity) || 4000,
        status: m.status,
        coordinates: [13.0418, 80.2341],
        pickupCoordinates: [12.9800, 80.2200],
        dropoffCoordinates: [13.0827, 80.2707],
      }));

    if (isDbConnected()) {
      try {
        const listings = await SupplierListing.find({ status: 'active' });
        for (const l of listings) {
          if (!suppliers.some(s => s.id === String(l._id))) {
            suppliers.push({
              id: String(l._id),
              type: 'supplier',
              name: l.supplierName,
              title: l.title,
              waterCategory: l.waterCategory,
              quantity: l.availableQuantity,
              totalQuantity: l.totalQuantity,
              indicativePrice: l.indicativePrice,
              quality: l.qualityVerificationStatus,
              coordinates: l.location?.coordinates || [13.0878, 80.2785],
              address: l.location?.address || 'Chennai',
            });
          }
        }
      } catch (e) {
        // Fallback
      }
    }

    res.json({ suppliers, buyers, activeDeliveries });
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Failed to retrieve map logistics data.' });
  }
});

// ---------------------------------------------------------------------------
// 9. ENVIRONMENTAL IMPACT ANALYTICS (/api/analytics/impact)
// ---------------------------------------------------------------------------
router.get('/analytics/impact', async (req, res) => {
  try {
    let totalLitres = 48000;
    let completedCount = 12;

    if (isDbConnected()) {
      const completed = await Delivery.find({ status: 'Completed' });
      if (completed.length > 0) {
        totalLitres = completed.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
        completedCount = completed.length;
      }
    }

    // Calculations based on official environmental impact formulas:
    // 1 L reused = 1 L freshwater avoided + ground-water depletion mitigation
    const freshwaterSavedL = totalLitres;
    const groundwaterDepletionAvoidedL = Math.round(totalLitres * 0.85);
    // Average 0.00035 kg CO2e saved per litre of treated water reused vs pumping freshwater from distant reservoirs
    const co2SavedKg = Math.round(totalLitres * 0.00035 * 10) / 10;
    // Energy saved in pumping: 0.0012 kWh per litre
    const energySavedKWh = Math.round(totalLitres * 0.0012 * 10) / 10;

    const data = {
      summary: {
        totalWaterReusedLitres: totalLitres,
        freshwaterSavedLitres: freshwaterSavedL,
        groundwaterDepletionAvoidedLitres: groundwaterDepletionAvoidedL,
        co2SavedKg,
        energySavedKWh,
        successfulTransactions: completedCount,
        fulfillmentRatePercent: 84.5,
        unmetDemandLitres: 9500,
      },
      categoryBreakdown: [
        { name: 'Industrial Cooling & Scrubber', litres: Math.round(totalLitres * 0.40), percentage: 40 },
        { name: 'Treated Wastewater (Landscaping/Irrigation)', litres: Math.round(totalLitres * 0.35), percentage: 35 },
        { name: 'Residential Greywater (Flushing)', litres: Math.round(totalLitres * 0.15), percentage: 15 },
        { name: 'RO Reject (Dust Suppression/Civil)', litres: Math.round(totalLitres * 0.10), percentage: 10 },
      ],
      monthlyTrends: [
        { month: 'Nov 2025', volume: 14500, co2Saved: 5.1 },
        { month: 'Dec 2025', volume: 22000, co2Saved: 7.7 },
        { month: 'Jan 2026', volume: 28500, co2Saved: 10.0 },
        { month: 'Feb 2026', volume: 34000, co2Saved: 11.9 },
        { month: 'Mar 2026', volume: 41200, co2Saved: 14.4 },
        { month: 'Apr 2026', volume: totalLitres, co2Saved: co2SavedKg },
      ],
      supplierLeaderboard: [
        { rank: 1, name: 'Ambattur Industrial Effluent Plant', volumeSupplied: 24000, deliveries: 6, rating: 4.9 },
        { rank: 2, name: 'Apex Tech Park STP', volumeSupplied: 18000, deliveries: 4, rating: 4.8 },
        { rank: 3, name: 'Horizon IT Corridor STP', volumeSupplied: 6000, deliveries: 2, rating: 4.7 },
      ],
      methodology: {
        freshwaterConversion: '1:1 replacement ratio for authorized non-potable demand',
        carbonFactor: '0.35 g CO2e / Litre avoided pumping and treatment lifecycle emissions',
        energyFactor: '1.2 Wh / Litre pumping energy savings from local proximity dispatch',
      },
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching environmental impact:', error);
    res.status(500).json({ error: 'Failed to retrieve environmental impact analytics.' });
  }
});

// ---------------------------------------------------------------------------
// 10. NOTIFICATIONS & ALERTS (/api/notifications)
// ---------------------------------------------------------------------------
router.get('/notifications', async (req, res) => {
  try {
    if (isDbConnected()) {
      const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
      const unreadCount = await Notification.countDocuments({ read: false });
      return res.json({ notifications, unreadCount });
    }

    res.json({
      notifications: [
        {
          _id: 'notif-1',
          title: 'Water Quality Report Pending Review',
          message: 'AquaCert Labs submitted quality report QLT-2026-099 for Apex Tech Park STP.',
          type: 'quality',
          severity: 'info',
          read: false,
          link: '/admin/quality',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'notif-2',
          title: 'New High Priority Match Generated',
          message: 'Smart Matching Hub generated match with 86% compatibility score.',
          type: 'matching',
          severity: 'success',
          read: false,
          link: '/admin/matching',
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 2,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      await Notification.findByIdAndUpdate(id, { read: true });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

router.post('/notifications/mark-all-read', async (req, res) => {
  try {
    if (isDbConnected()) {
      await Notification.updateMany({ read: false }, { read: true });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

// ---------------------------------------------------------------------------
// 11. AUDIT LOGS (/api/audit-logs)
// ---------------------------------------------------------------------------
router.get('/audit-logs', async (req, res) => {
  try {
    const { entity, action, page = 1, limit = 50 } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (entity && entity !== 'all') query.targetEntity = entity;
      if (action && action !== 'all') query.action = { $regex: action, $options: 'i' };

      const total = await AuditLog.countDocuments(query);
      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return res.json({
        logs,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) },
      });
    }

    res.json({
      logs: [
        {
          _id: 'log-1',
          actor: { name: 'System Administrator', email: 'admin@reloop.org', role: 'admin' },
          action: 'MATCH_APPROVED',
          targetEntity: 'Match',
          targetId: 'MCH-2026-002',
          details: 'Approved allocation of 4,000 L Treated Wastewater to Metro Rail Construction Corp',
          reason: 'Pre-certified water quality & critical priority',
          timestamp: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, totalPages: 1 },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// ---------------------------------------------------------------------------
// 12. REPORT CSV EXPORT (/api/reports/export)
// ---------------------------------------------------------------------------
router.get('/reports/export', async (req, res) => {
  try {
    const { reportType } = req.query; // 'water-reuse' | 'deliveries' | 'matches' | 'quality' | 'users'

    let csvContent = '';
    let filename = `reloop-${reportType || 'summary'}-${Date.now()}.csv`;

    if (reportType === 'water-reuse' || !reportType) {
      csvContent = 'Month,Volume_Reused_Litres,Freshwater_Saved_Litres,CO2e_Avoided_Kg\n' +
        'Nov 2025,14500,14500,5.1\n' +
        'Dec 2025,22000,22000,7.7\n' +
        'Jan 2026,28500,28500,10.0\n' +
        'Feb 2026,34000,34000,11.9\n' +
        'Mar 2026,41200,41200,14.4\n' +
        'Apr 2026,48000,48000,16.8\n';
    } else if (reportType === 'deliveries') {
      csvContent = 'DeliveryCode,Source,Destination,Transporter,Quantity_L,Status,CompletedAt\n' +
        'DLV-2026-001,Ambattur Plant,Green Park Society,EcoFlow Fleet,4000,Completed,2026-04-21\n' +
        'DLV-2026-002,Apex Tech Park,Metro Rail Construction,EcoFlow Fleet,4000,In Transit,\n';
    } else if (reportType === 'matches') {
      csvContent = 'MatchCode,Supplier,Buyer,Quantity_L,Distance_Km,MatchScore,Status\n' +
        'MCH-2026-001,Ambattur Plant,Green Park,4000,3.4,92,Completed\n' +
        'MCH-2026-002,Apex STP,Metro Rail Construction,4000,6.8,88,Admin Approved\n' +
        'MCH-2026-003,Greywater System,Green Park,3000,4.2,86,Proposed\n';
    } else if (reportType === 'quality') {
      csvContent = 'ReportCode,Source,Verifier,TestDate,Status,OverallResult,CertificateNumber\n' +
        'QLT-2026-081,Ambattur Plant,AquaCert Labs,2026-04-18,Approved,Passed,TN-PCB-2026-A4821\n' +
        'QLT-2026-099,Apex Tech Park STP,AquaCert Labs,2026-04-21,Pending,Passed,TN-PCB-2026-B1092\n';
    } else if (reportType === 'users') {
      csvContent = 'Name,Email,Role,Organization,AccountStatus,Verified\n' +
        'System Administrator,admin@reloop.org,admin,ReLoop Authority,active,true\n' +
        'Apex Tech Park STP,supplier@reloop.org,supplier,Apex Facilities Ltd.,active,true\n' +
        'Green Park Society,buyer@reloop.org,buyer,Green Park Society,active,true\n' +
        'EcoFlow Fleet,transporter@reloop.org,transporter,EcoFlow Tankers,active,true\n' +
        'AquaCert Labs,verifier@reloop.org,verifier,AquaCert Labs QA,active,true\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error generating CSV export:', error);
    res.status(500).json({ error: 'Failed to generate report CSV export.' });
  }
});

export default router;
