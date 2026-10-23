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
    totalDemand: 0,
    matchedQuantity: 0,
    matchedPercent: 0,
    freshwaterSaved: 0,
    freshwaterSavedEq: 0,
    unmetDemand: 0,
    activeRequestsCount: 0,
    transportCost: 0,
    sourcesUsed: 0
  },
  sources: [],
  demands: [],
  activities: []
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
