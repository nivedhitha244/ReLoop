// src/services/verifierApi.js
const API_BASE = '/api/verifier';

const fallbackVerifier = {
  profile: {
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
  },
  stats: {
    pendingAudits: 3,
    totalTestsConducted: 39,
    sourcesCertified: 34,
    sourcesBlocked: 5,
    totalEarnings: 97500,
    availableBalance: 32500,
    escrowBalance: 5000,
    standardFee: 2500,
    activeCertificatesCount: 4,
    compliancePassRate: "87.2%",
    nablStatus: "Accredited & Active"
  }
};

const notifyMutation = (action) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action } }));
    localStorage.setItem('reloop_last_mutation', String(Date.now()));
  }
};

export const verifierApi = {
  async getProfile() {
    try {
      const res = await fetch(`${API_BASE}/profile`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[verifierApi] Using fallback profile:", e.message);
    }
    return {
      profile: fallbackVerifier.profile,
      wallet: fallbackVerifier.profile.wallet,
      payoutAccounts: fallbackVerifier.profile.payoutAccounts
    };
  },

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        notifyMutation('verifier_profile_updated');
        return await res.json();
      }
    } catch (e) {
      console.warn("[verifierApi] Error updating profile:", e.message);
    }
    return { success: true };
  },

  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[verifierApi] Using fallback stats:", e.message);
    }
    return fallbackVerifier.stats;
  },

  async getQueue() {
    try {
      const res = await fetch(`${API_BASE}/queue`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[verifierApi] Using fallback queue:", e.message);
    }
    return [
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
  },

  async submitAudit(sourceId, auditData) {
    try {
      const res = await fetch(`${API_BASE}/audit/${sourceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData)
      });
      if (res.ok) {
        notifyMutation('water_audit_submitted');
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit lab audit');
    } catch (e) {
      console.warn("[verifierApi] Audit submission error:", e.message);
      throw e;
    }
  },

  async getCertificates() {
    try {
      const res = await fetch(`${API_BASE}/certificates`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[verifierApi] Using fallback certificates:", e.message);
    }
    return [
      {
        id: "doc-1792821795230",
        sourceId: "src-seller-1792821795230",
        sourceName: "Millifont water",
        title: "Millifont water Safety & Quality Report",
        labName: "AquaCert Labs Quality Assurance",
        accreditation: "NABL Accredited",
        reportNumber: "LAB-795217",
        issueDate: "2026-10-24",
        expiryDate: "2027-04-30",
        status: "Verified",
        parameters: {
          ph: 7.2,
          turbidity: "1.2 NTU",
          tds: "420 ppm",
          bod: "4.5 mg/L",
          cod: "18 mg/L"
        },
        intendedUses: ["Landscaping", "Construction", "Toilet Flushing"],
        fileUrl: "/docs/sample_water_quality_report.pdf",
        verificationNotes: "Uploaded by seller and verified for safe industrial/non-potable reuse."
      },
      {
        id: "doc-1792772734290",
        sourceId: "src-seller-1792772734289",
        sourceName: "Multimiton water",
        title: "Multimiton water Safety & Quality Report",
        labName: "AquaCert Labs Quality Assurance",
        accreditation: "NABL Accredited",
        reportNumber: "LAB-734273",
        issueDate: "2026-10-23",
        expiryDate: "2027-04-30",
        status: "Verified",
        parameters: {
          ph: 7.2,
          turbidity: "1.2 NTU",
          tds: "420 ppm",
          bod: "4.5 mg/L",
          cod: "18 mg/L"
        },
        intendedUses: ["Landscaping", "Toilet Flushing"],
        fileUrl: "/docs/sample_water_quality_report.pdf",
        verificationNotes: "Uploaded by seller and verified for safe industrial/non-potable reuse."
      }
    ];
  },

  async getPayouts() {
    try {
      const res = await fetch(`${API_BASE}/payouts`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[verifierApi] Using fallback payouts:", e.message);
    }
    return {
      wallet: fallbackVerifier.profile.wallet,
      payoutAccounts: fallbackVerifier.profile.payoutAccounts,
      payouts: [
        {
          id: "PAY-VER-9411",
          reportCode: "LAB-795217",
          date: "2026-10-24 14:20",
          sourceName: "Millifont water STP",
          testCategory: "Comprehensive CPCB Reuse Audit",
          standardFee: 2500,
          method: "Direct Escrow Release",
          payoutChannel: "SBI Current (A/C ...0283)",
          status: "Settled",
          referenceNumber: "UTR-SBI-7729103841"
        },
        {
          id: "PAY-VER-9320",
          reportCode: "LAB-734273",
          date: "2026-10-23 16:50",
          sourceName: "Multimiton water STP",
          testCategory: "Comprehensive CPCB Reuse Audit",
          standardFee: 2500,
          method: "Corporate UPI Settlement",
          payoutChannel: "aquacertlabs@oksbi",
          status: "Settled",
          referenceNumber: "UPI-AQ-88319201"
        }
      ]
    };
  },

  async requestPayout({ amount, method, destinationAccount }) {
    try {
      const res = await fetch(`${API_BASE}/payouts/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, destinationAccount })
      });
      if (res.ok) {
        notifyMutation('verifier_payout_withdrawn');
        return await res.json();
      }
      const data = await res.json();
      throw new Error(data.error || 'Failed to process payout');
    } catch (e) {
      console.warn("[verifierApi] Payout request error:", e.message);
      throw e;
    }
  }
};

