const API_BASE = 'http://localhost:5000/api';

// Fallback initial data in case backend is starting or offline
const initialMock = {
  user: {
    name: "Green Park",
    role: "Buyer",
    initials: "GP",
    location: "Chennai, Tamil Nadu",
    weather: {
      temp: "32°C",
      condition: "Partly cloudy",
      date: "Tue, 22 Apr 2025"
    }
  },
  stats: {
    totalDemand: 6000,
    matchedQuantity: 4000,
    matchedPercent: 67,
    freshwaterSaved: 3000,
    freshwaterSavedEq: 6000,
    unmetDemand: 2000,
    activeRequestsCount: 2,
    transportCost: 2150,
    sourcesUsed: 2
  },
  sources: [
    {
      id: "src-seller-1",
      name: "Apex Tech Park STP",
      type: "Treated Wastewater",
      iconType: "leaf-water",
      quantity: 9000,
      distance: 3.5,
      quality: "Verified",
      coordinates: [12.98, 80.22],
      available: true,
      indicativePrice: "₹0.12/L",
      intendedUses: ["Irrigation", "Landscaping", "Construction", "Toilet Flushing"],
      description: "Tertiary treated STP water, ultrafiltered and UV disinfected, verified for safe non-potable reuse.",
      labReport: {
        id: "LAB-2026-098",
        tester: "AquaCert Labs",
        status: "Verified",
        ph: 7.2,
        turbidity: "1.1 NTU",
        tds: "410 ppm",
        expiryDate: "2027-04-15"
      },
      dataSource: "Verified Live Water Source"
    },
    {
      id: "src-seller-2",
      name: "Nivi Apartment",
      type: "Rainwater",
      iconType: "apartment",
      quantity: 8000,
      distance: 4.8,
      quality: "Verified",
      coordinates: [13.0067, 80.205],
      available: true,
      indicativePrice: "₹0.10/L",
      intendedUses: ["Landscaping", "Construction", "Toilet Flushing", "Irrigation"],
      description: "High-capacity harvested rainwater reservoir treated with multi-stage sand & carbon filtration.",
      labReport: {
        id: "LAB-2026-112",
        tester: "AquaCert Labs",
        status: "Verified",
        ph: 7.1,
        turbidity: "1.0 NTU",
        tds: "220 ppm",
        expiryDate: "2027-04-30"
      },
      dataSource: "Verified Live Water Source"
    }
  ],
  demands: [
    {
      id: "dem-1",
      title: "Green Park Housing Society",
      quantity: 4000,
      purpose: "Irrigation",
      status: "Matched",
      statusColor: "green",
      coordinates: [13.0418, 80.2341],
      indicativeBudget: "₹0.15/L",
      requiredQuality: "Verified",
      createdAt: "2026-10-22",
      dataSource: "Live Buyer Demand"
    },
    {
      id: "dem-2",
      title: "Metro Rail Construction Corp",
      quantity: 2000,
      purpose: "Construction",
      status: "Active",
      statusColor: "blue",
      coordinates: [13.0694, 80.1948],
      indicativeBudget: "₹0.12/L",
      requiredQuality: "Standard",
      createdAt: "2026-10-23",
      dataSource: "Live Buyer Demand"
    }
  ],
  activities: [
    {
      id: "act-1",
      type: "match",
      title: "Match Confirmed & Scheduled",
      detail: "Apex Tech Park STP → Green Park Housing Society (4,000 L)",
      time: "2h ago",
      icon: "link"
    },
    {
      id: "act-2",
      type: "complete",
      title: "Delivery Completed",
      detail: "Nivi Apartment → Metro Rail Construction Corp (2,000 L)",
      time: "1d ago",
      icon: "check-circle"
    }
  ]
};

export const api = {
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend not reached, using local fallback", e);
    }
    return initialMock.stats;
  },

  async getSources() {
    try {
      const res = await fetch(`${API_BASE}/sources`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend not reached, using local fallback", e);
    }
    return initialMock.sources;
  },

  async getDemands() {
    try {
      const res = await fetch(`${API_BASE}/demands`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend not reached, using local fallback", e);
    }
    return initialMock.demands;
  },

  async createDemand(demand) {
    try {
      const res = await fetch(`${API_BASE}/demands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demand)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend not reached, using local fallback", e);
    }
    return {
      id: `dem-${Date.now()}`,
      ...demand,
      status: "Active",
      statusColor: "green"
    };
  },

  async requestMatch(sourceId, demandId) {
    try {
      const res = await fetch(`${API_BASE}/matches/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, demandId })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend match request error", e);
    }
    return { success: true };
  },

  async triggerRescue(demandId, failedSourceId) {
    try {
      const res = await fetch(`${API_BASE}/rescue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId, failedSourceId })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend rescue error", e);
    }
    return {
      message: "Rescue activated locally",
      rescuedSource: initialMock.sources[3],
      demand: initialMock.demands[0]
    };
  },

  async getActivities() {
    try {
      const res = await fetch(`${API_BASE}/activities`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend not reached, using local fallback", e);
    }
    return initialMock.activities;
  }
};
