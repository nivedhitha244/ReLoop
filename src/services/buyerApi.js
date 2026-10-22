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
    totalDemand: 12000,
    matchedQuantity: 7500,
    matchedPercent: 62,
    freshwaterSaved: 7500,
    freshwaterSavedEq: 15000,
    unmetDemand: 4500,
    activeRequestsCount: 3,
    transportCost: 3750,
    sourcesUsed: 2
  },
  sources: [
    {
      id: "src-1",
      name: "Factory A",
      type: "Industrial",
      iconType: "factory",
      quantity: 5000,
      distance: 2.8,
      quality: "Verified",
      coordinates: [13.0878, 80.2785],
      available: true,
      description: "Treated cooling tower blowdown, suitable for industrial reuse and irrigation."
    },
    {
      id: "src-2",
      name: "STP Plant",
      type: "Treated Wastewater",
      iconType: "leaf-water",
      quantity: 7000,
      distance: 6.5,
      quality: "Pending",
      coordinates: [13.0450, 80.2400],
      available: true,
      description: "Tertiary treated municipal wastewater, lab analysis verification in progress."
    },
    {
      id: "src-3",
      name: "IT Park",
      type: "RO Reject Water",
      iconType: "building",
      quantity: 4000,
      distance: 8.1,
      quality: "Verified",
      coordinates: [12.9800, 80.2200],
      available: true,
      description: "High TDS reverse osmosis reject water, suitable for flushing & dust suppression."
    },
    {
      id: "src-4",
      name: "Apartment Complex",
      type: "Greywater",
      iconType: "apartment",
      quantity: 3000,
      distance: 4.2,
      quality: "Verified",
      coordinates: [13.0100, 80.2600],
      available: true,
      description: "Residential greywater system filtered through sand & carbon media."
    }
  ],
  demands: [
    {
      id: "dem-1",
      title: "Green Park",
      quantity: 4000,
      purpose: "Irrigation",
      status: "Active",
      statusColor: "green",
      coordinates: [13.0827, 80.2707],
      createdAt: "2025-04-20"
    },
    {
      id: "dem-2",
      title: "Sports Complex",
      quantity: 2000,
      purpose: "Construction",
      status: "Pending",
      statusColor: "blue",
      coordinates: [13.0600, 80.2500],
      createdAt: "2025-04-21"
    },
    {
      id: "dem-3",
      title: "Community Garden",
      quantity: 3000,
      purpose: "Irrigation",
      status: "Matching",
      statusColor: "amber",
      coordinates: [13.0300, 80.2300],
      createdAt: "2025-04-22"
    }
  ],
  activities: [
    {
      id: "act-1",
      type: "match",
      title: "New match found",
      detail: "Factory A → Green Park",
      time: "2h ago",
      icon: "link"
    },
    {
      id: "act-2",
      type: "approval",
      title: "Demand approved",
      detail: "Green Park - 4,000 L (Irrigation)",
      time: "4h ago",
      icon: "file-text"
    },
    {
      id: "act-3",
      type: "source",
      title: "New source added",
      detail: "STP Plant - 7,000 L",
      time: "5h ago",
      icon: "droplet"
    },
    {
      id: "act-4",
      type: "complete",
      title: "Match completed",
      detail: "Apartment Complex → Sports Center",
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

  async getDemandMatches(demandId) {
    try {
      const res = await fetch(`${API_BASE}/demands/${demandId}/matches`);
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch matches for this demand');
    } catch (e) {
      console.warn("[buyerApi] Error fetching demand matches:", e.message);
      throw e;
    }
  },

  async requestWater(payload) {
    try {
      const res = await fetch(`${API_BASE}/buyer/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request water allocation');
      return data;
    } catch (e) {
      console.error("[buyerApi] Error requesting water:", e.message);
      throw e;
    }
  },

  async requestMatch(sourceId, demandId, quantity, notes) {
    return this.requestWater({
      sourceId,
      demandId,
      quantity,
      notes
    });
  },

  async getMatches() {
    try {
      const res = await fetch(`${API_BASE}/buyer/matches`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Error fetching matches:", e);
    }
    return [];
  },

  async getRequests() {
    try {
      const res = await fetch(`${API_BASE}/buyer/requests`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Error fetching requests:", e);
    }
    return [];
  },

  async confirmDelivery(matchId) {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}/confirm`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm receipt');
      return data;
    } catch (e) {
      console.error("[buyerApi] Error confirming delivery:", e);
      throw e;
    }
  },

  async triggerRescue(demandId, failedSourceId, reason) {
    try {
      const res = await fetch(`${API_BASE}/rescue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId, failedSourceId, reason })
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Rescue operation failed');
    } catch (e) {
      console.warn("[buyerApi] Backend rescue error:", e);
      throw e;
    }
  },

  async getActivities() {
    try {
      const res = await fetch(`${API_BASE}/activities`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Backend not reached, using local fallback", e);
    }
    return initialMock.activities;
  }
};

