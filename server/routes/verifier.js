// server/routes/verifier.js
import express from 'express';
import { loadDB, saveDB } from '../services/inventoryService.js';
import { isDbConnected } from '../db.js';
import { QualityReport } from '../models/QualityReport.js';
import { SupplierListing } from '../models/SupplierListing.js';

const router = express.Router();

// Helper to ensure verifier structures exist in data_store.json
function ensureVerifierData(db) {
  if (!db.verifierProfile) {
    db.verifierProfile = {
      id: "seed-verifier-1",
      name: "AquaCert Labs Quality Assurance",
      organization: "AquaCert Environmental Testing Services Ltd.",
      role: "verifier",
      initials: "AQ",
      email: "verifier@reloop.org",
      phone: "+91 98444 33221",
      labAddress: "Industrial Estate, Guindy, Chennai, Tamil Nadu 600032",
      nablAccreditation: "NABL-TC-8894 (ISO/IEC 17025:2017 Certified)",
      cpcbRegistration: "CPCB-LAB-REG-2024-512",
      headAuditor: "Dr. Saranya Krishnan, Ph.D. Environmental Engineering",
      standardFee: 2500,
      wallet: {
        availableBalance: 32500,
        escrowBalance: 5000,
        totalEarned: 97500,
        totalTestsConducted: 39,
        sourcesCertified: 34,
        sourcesBlocked: 5,
        currency: "INR (₹)"
      },
      payoutAccounts: {
        bank: {
          accountHolder: "AquaCert Environmental Testing Services Ltd.",
          accountNumber: "109384910283",
          bankName: "State Bank of India (SBI)",
          ifscCode: "SBIN0004521",
          branch: "Industrial Estate Branch, Guindy, Chennai",
          accountType: "Current Corporate"
        },
        upi: {
          upiId: "aquacertlabs@oksbi",
          provider: "SBI Corporate UPI"
        }
      }
    };
  }

  if (!db.verifierPayouts || db.verifierPayouts.length === 0) {
    db.verifierPayouts = [
      {
        id: "PAY-VER-9411",
        reportCode: "LAB-795217",
        date: "2026-10-24 14:20",
        sourceName: "Millifont water STP",
        testCategory: "Comprehensive CPCB Reuse Audit",
        standardFee: 2500,
        platformDeduction: 0,
        netPayout: 2500,
        method: "Direct Escrow Release",
        payoutChannel: "SBI Current (A/C ...0283)",
        status: "Settled",
        referenceNumber: "UTR-SBI-7729103841",
        invoiceNumber: "INV-AQ-2026-0819"
      },
      {
        id: "PAY-VER-9320",
        reportCode: "LAB-734273",
        date: "2026-10-23 16:50",
        sourceName: "Multimiton water STP",
        testCategory: "Comprehensive CPCB Reuse Audit",
        standardFee: 2500,
        platformDeduction: 0,
        netPayout: 2500,
        method: "Corporate UPI Settlement",
        payoutChannel: "aquacertlabs@oksbi",
        status: "Settled",
        referenceNumber: "UPI-AQ-88319201",
        invoiceNumber: "INV-AQ-2026-0818"
      },
      {
        id: "PAY-VER-8910",
        reportCode: "LAB-619203",
        date: "2026-10-20 10:30",
        sourceName: "Adyar Tech Park STP",
        testCategory: "Expedited Rescue Clearance",
        standardFee: 3500,
        platformDeduction: 0,
        netPayout: 3500,
        method: "Bank Transfer (NEFT/RTGS)",
        payoutChannel: "SBI Current (A/C ...0283)",
        status: "Settled",
        referenceNumber: "NEFT-SBI-49102834",
        invoiceNumber: "INV-AQ-2026-0815"
      }
    ];
  }

  // Ensure initial queue of pending sources to test
  if (!db.verifierQueue || db.verifierQueue.length === 0) {
    db.verifierQueue = [
      {
        id: "vqueue-1",
        sourceId: "src-new-101",
        sourceName: "Velachery IT Corridor Greywater Plant",
        supplierName: "Velachery Commercial Facilities Ltd.",
        waterCategory: "Commercial Greywater",
        quantityLitres: 8000,
        facilityAddress: "Velachery Main Road, Chennai",
        submissionDate: "2026-10-25",
        testUrgency: "High (Pending Buyer Match)",
        standardFee: 2500,
        status: "Pending Review",
        recommendedUse: "Toilet Flushing & Landscaping"
      },
      {
        id: "vqueue-2",
        sourceId: "src-new-102",
        sourceName: "Guindy Industrial Cooling Effluent",
        supplierName: "Guindy Engineering Hub",
        waterCategory: "Treated Wastewater",
        quantityLitres: 12000,
        facilityAddress: "Guindy Industrial Estate, Chennai",
        submissionDate: "2026-10-24",
        testUrgency: "Standard Audit",
        standardFee: 2500,
        status: "Sample In Lab",
        recommendedUse: "Construction & Dust Suppression"
      },
      {
        id: "vqueue-3",
        sourceId: "src-new-103",
        sourceName: "Ambattur Lake Rainwater Reservoir",
        supplierName: "Ambattur Water Reclamation Works",
        waterCategory: "Rainwater Harvesting",
        quantityLitres: 15000,
        facilityAddress: "Ambattur Industrial Area, Chennai",
        submissionDate: "2026-10-26",
        testUrgency: "Normal",
        standardFee: 1500,
        status: "Pending Collection",
        recommendedUse: "Landscaping & Cooling Towers"
      }
    ];
  }
}

// -------------------------------------------------------------
// 1. GET VERIFIER PROFILE & WALLET
// -------------------------------------------------------------
router.get('/profile', (req, res) => {
  try {
    const db = loadDB();
    ensureVerifierData(db);
    res.json({
      profile: db.verifierProfile,
      wallet: db.verifierProfile.wallet,
      payoutAccounts: db.verifierProfile.payoutAccounts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve verifier profile: ' + err.message });
  }
});

// Update Profile / Settings
router.put('/profile', (req, res) => {
  try {
    const db = loadDB();
    ensureVerifierData(db);
    const { phone, labAddress, headAuditor, standardFee, payoutAccounts } = req.body;

    if (phone) db.verifierProfile.phone = phone;
    if (labAddress) db.verifierProfile.labAddress = labAddress;
    if (headAuditor) db.verifierProfile.headAuditor = headAuditor;
    if (standardFee) db.verifierProfile.standardFee = Number(standardFee);
    if (payoutAccounts) {
      db.verifierProfile.payoutAccounts = {
        ...db.verifierProfile.payoutAccounts,
        ...payoutAccounts
      };
    }

    saveDB(db);
    res.json({ success: true, profile: db.verifierProfile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update verifier profile: ' + err.message });
  }
});

// -------------------------------------------------------------
// 2. GET VERIFIER STATS
// -------------------------------------------------------------
router.get('/stats', (req, res) => {
  try {
    const db = loadDB();
    ensureVerifierData(db);

    const queue = db.verifierQueue || [];
    const pendingAudits = queue.filter(q => q.status !== 'Approved' && q.status !== 'Rejected').length;
    const certificates = db.sellerDocuments || [];

    res.json({
      pendingAudits,
      totalTestsConducted: db.verifierProfile.wallet.totalTestsConducted,
      sourcesCertified: db.verifierProfile.wallet.sourcesCertified,
      sourcesBlocked: db.verifierProfile.wallet.sourcesBlocked,
      totalEarnings: db.verifierProfile.wallet.totalEarned,
      availableBalance: db.verifierProfile.wallet.availableBalance,
      escrowBalance: db.verifierProfile.wallet.escrowBalance,
      standardFee: db.verifierProfile.standardFee || 2500,
      activeCertificatesCount: certificates.length,
      compliancePassRate: "87.2%",
      nablStatus: "Accredited & Active"
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute verifier stats: ' + err.message });
  }
});

// -------------------------------------------------------------
// 3. GET VERIFICATION QUEUE
// -------------------------------------------------------------
router.get('/queue', (req, res) => {
  try {
    const db = loadDB();
    ensureVerifierData(db);
    res.json(db.verifierQueue || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve queue: ' + err.message });
  }
});

// -------------------------------------------------------------
// 4. SUBMIT LAB TEST & SAFETY GATE CERTIFICATION
// -------------------------------------------------------------
router.post('/audit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sourceName,
      waterCategory,
      decision, // 'Approved' | 'Rejected' | 'Needs Re-test'
      parameters, // { ph, turbidity, tds, bod, cod, eColi, chlorine, odor }
      intendedUses, // array
      notes,
      rejectionReason,
      fee = 2500
    } = req.body;

    if (!decision || !['Approved', 'Rejected', 'Needs Re-test'].includes(decision)) {
      return res.status(400).json({ error: 'Valid safety gate decision required (Approved, Rejected, Needs Re-test).' });
    }

    if (decision === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ error: 'A mandatory rejection reason is required to block an unsafe water source.' });
    }

    const db = loadDB();
    ensureVerifierData(db);

    const testFee = Number(fee) || db.verifierProfile.standardFee || 2500;
    const certNumber = `CPCB-AQ-${Date.now().toString().slice(-6)}`;
    const reportCode = `LAB-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date().toISOString().slice(0, 10);
    const expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const newDoc = {
      id: `doc-${Date.now()}`,
      sourceId: id,
      sourceName: sourceName || 'Verified Water Source',
      title: `${sourceName || 'Water'} Safety & Quality Report`,
      labName: db.verifierProfile.name,
      accreditation: db.verifierProfile.nablAccreditation,
      reportNumber: certNumber,
      certificateNumber: certNumber,
      issueDate,
      expiryDate,
      status: decision === 'Approved' ? 'Verified' : (decision === 'Rejected' ? 'Rejected' : 'Pending Review'),
      overallResult: decision === 'Approved' ? 'Passed' : 'Failed',
      parameters: parameters || {
        ph: 7.2,
        turbidity: "1.4 NTU",
        tds: "410 ppm",
        bod: "4.2 mg/L",
        cod: "16 mg/L",
        eColi: "0 CFU/100mL"
      },
      intendedUses: intendedUses || ['Landscaping', 'Construction', 'Toilet Flushing'],
      fileUrl: '/docs/sample_water_quality_report.pdf',
      fileSize: '1.4 MB',
      verificationNotes: notes || (decision === 'Approved' ? 'Full laboratory parameters meet CPCB water reuse norms.' : rejectionReason),
      rejectionReason: decision === 'Rejected' ? rejectionReason : null,
      reviewedBy: db.verifierProfile.headAuditor,
      reviewedAt: new Date().toISOString()
    };

    if (!db.sellerDocuments) db.sellerDocuments = [];
    db.sellerDocuments.unshift(newDoc);

    // Update queue status
    const queueItem = (db.verifierQueue || []).find(q => q.id === id || q.sourceId === id);
    if (queueItem) {
      queueItem.status = decision;
      queueItem.certificateNumber = certNumber;
      queueItem.testedAt = issueDate;
    }

    // Update source in db.sources and db.sellerSources
    const matchedSource = (db.sources || []).find(s => s.id === id || s.id === queueItem?.sourceId) ||
                          (db.sellerSources || []).find(s => s.id === id || s.id === queueItem?.sourceId);

    if (matchedSource) {
      if (decision === 'Approved') {
        matchedSource.quality = 'Verified';
        matchedSource.verificationStatus = 'Verified';
        matchedSource.available = true;
        matchedSource.reportExpiry = expiryDate;
        matchedSource.labReport = {
          certId: certNumber,
          labName: db.verifierProfile.name,
          testDate: issueDate,
          expiryDate,
          status: 'Verified',
          ph: parameters?.ph || 7.2,
          turbidity: parameters?.turbidity || '1.4 NTU',
          tds: parameters?.tds || '410 ppm',
          bod: parameters?.bod || '4.2 mg/L',
          cod: parameters?.cod || '16 mg/L',
          notes: notes || 'Lab tests verify safe industrial and urban reuse.'
        };
      } else if (decision === 'Rejected') {
        matchedSource.quality = 'Rejected / Unsafe';
        matchedSource.verificationStatus = 'Rejected';
        matchedSource.available = false; // BLOCKED from matching
        matchedSource.safetyGateBlocked = true;
        matchedSource.blockReason = rejectionReason;

        // Trigger ReLoop Rescue notification!
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift({
          id: `notif-rescue-${Date.now()}`,
          type: 'rescue_alert',
          title: '🚨 ReLoop Rescue Triggered: Unsafe Water Source Blocked',
          message: `Source "${matchedSource.name}" failed lab safety gate audit (${rejectionReason}). ReLoop Rescue has blocked this source and is re-routing active requests to alternative verified suppliers.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }

    // Payout logic: Verifier earns standard verification fee!
    db.verifierProfile.wallet.availableBalance += testFee;
    db.verifierProfile.wallet.totalEarned += testFee;
    db.verifierProfile.wallet.totalTestsConducted += 1;
    if (decision === 'Approved') {
      db.verifierProfile.wallet.sourcesCertified += 1;
    } else if (decision === 'Rejected') {
      db.verifierProfile.wallet.sourcesBlocked += 1;
    }

    // Add to Verifier Payout Ledger
    const payoutEntry = {
      id: `PAY-VER-${Date.now().toString().slice(-6)}`,
      reportCode: certNumber,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceName: sourceName || queueItem?.sourceName || 'Water Facility',
      testCategory: decision === 'Approved' ? 'CPCB Safety Gate Certification' : 'Unsafe Source Rejection Audit',
      standardFee: testFee,
      platformDeduction: 0,
      netPayout: testFee,
      method: 'Direct Platform Milestone Release',
      payoutChannel: 'AquaCert Verifier Wallet (Cleared)',
      status: 'Settled',
      referenceNumber: `UTR-AQ-${Date.now().toString().slice(-8)}`,
      invoiceNumber: `INV-AQ-${Date.now().toString().slice(-6)}`
    };

    if (!db.verifierPayouts) db.verifierPayouts = [];
    db.verifierPayouts.unshift(payoutEntry);

    saveDB(db);

    res.json({
      success: true,
      message: decision === 'Approved' 
        ? `Water source safety gate approved! Certificate ${certNumber} issued and ₹${testFee.toLocaleString('en-IN')} credited to your wallet.`
        : `Source marked unsafe & blocked! ReLoop Rescue notified. Fee of ₹${testFee.toLocaleString('en-IN')} credited for safety gate audit.`,
      certificate: newDoc,
      wallet: db.verifierProfile.wallet
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process lab audit: ' + err.message });
  }
});

// -------------------------------------------------------------
// 5. GET CERTIFICATES ARCHIVE
// -------------------------------------------------------------
router.get('/certificates', (req, res) => {
  try {
    const db = loadDB();
    ensureVerifierData(db);
    res.json(db.sellerDocuments || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve certificates: ' + err.message });
  }
});

// -------------------------------------------------------------
// 6. PAYOUTS & PAYMENT RECEIVED METHODS
// -------------------------------------------------------------
router.get('/payouts', (req, res) => {
  try {
    const db = loadDB();
    ensureVerifierData(db);
    res.json({
      wallet: db.verifierProfile.wallet,
      payoutAccounts: db.verifierProfile.payoutAccounts,
      payouts: db.verifierPayouts || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve verifier payouts: ' + err.message });
  }
});

// Withdraw Funds / Settlement Request
router.post('/payouts/withdraw', (req, res) => {
  try {
    const { amount, method, destinationAccount } = req.body;
    const db = loadDB();
    ensureVerifierData(db);

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
    }

    if (withdrawAmount > db.verifierProfile.wallet.availableBalance) {
      return res.status(400).json({ 
        error: `Insufficient available balance. Current available balance is ₹${db.verifierProfile.wallet.availableBalance.toLocaleString('en-IN')}.` 
      });
    }

    // Deduct balance
    db.verifierProfile.wallet.availableBalance -= withdrawAmount;

    let payoutChannelDesc = '';
    let refPrefix = '';

    if (method === 'upi') {
      payoutChannelDesc = destinationAccount || db.verifierProfile.payoutAccounts.upi.upiId;
      refPrefix = 'UPI-AQ-';
    } else if (method === 'bank') {
      const bank = db.verifierProfile.payoutAccounts.bank;
      payoutChannelDesc = `${bank.bankName} (A/C ...${bank.accountNumber.slice(-4)})`;
      refPrefix = 'RTGS-SBI-';
    } else {
      payoutChannelDesc = 'ReLoop Automated Milestone Escrow Transfer';
      refPrefix = 'ESCROW-AQ-';
    }

    const refNumber = `${refPrefix}${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newPayout = {
      id: `PAY-VER-WDR-${Date.now().toString().slice(-6)}`,
      reportCode: 'Lab Settlement Payout',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sourceName: 'AquaCert Revenue Account',
      testCategory: 'Bank Settlement Withdrawal',
      standardFee: withdrawAmount,
      platformDeduction: 0,
      netPayout: withdrawAmount,
      method: method === 'upi' ? 'Corporate UPI Transfer' : (method === 'bank' ? 'Corporate Bank RTGS/NEFT' : 'Milestone Escrow Direct Deposit'),
      payoutChannel: payoutChannelDesc,
      status: 'Settled',
      referenceNumber: refNumber,
      invoiceNumber: `INV-SETTLE-${Date.now().toString().slice(-6)}`
    };

    if (!db.verifierPayouts) db.verifierPayouts = [];
    db.verifierPayouts.unshift(newPayout);

    saveDB(db);

    res.json({
      success: true,
      message: `₹${withdrawAmount.toLocaleString('en-IN')} has been transferred to your corporate account via ${newPayout.method}.`,
      payout: newPayout,
      wallet: db.verifierProfile.wallet
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process verifier payout: ' + err.message });
  }
});

export default router;

