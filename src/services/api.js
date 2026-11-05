// src/services/api.js
const API_BASE = 'http://localhost:5000/api';

const initialMock = {
  sources: [],
  demands: [],
  matches: [],
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
    return {
      totalDemand: 0,
      matchedQuantity: 0,
      matchedPercent: 0,
      freshwaterSaved: 0,
      freshwaterSavedEq: 0,
      unmetDemand: 0,
      activeRequestsCount: 0,
      transportCost: 0,
      sourcesUsed: 0
    };
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

  async createSource(newSource) {
    try {
      const res = await fetch(`${API_BASE}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend create source error, saving locally", e);
    }
    return {
      id: `src-${Date.now()}`,
      ...newSource,
      available: true
    };
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

  async createDemand(newDemand) {
    try {
      const res = await fetch(`${API_BASE}/demands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDemand)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend demand creation error, saving locally", e);
    }
    return {
      id: `dem-${Date.now()}`,
      title: newDemand.title || "Facility Water Demand",
      quantity: Number(newDemand.quantity) || 4000,
      purpose: newDemand.purpose || "Irrigation",
      status: "Active",
      statusColor: "green",
      createdAt: new Date().toISOString().split('T')[0]
    };
  },

  async getMatches() {
    try {
      const res = await fetch(`${API_BASE}/matches`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend not reached, using local fallback", e);
    }
    return initialMock.matches;
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

  async triggerRescue(demandId, failedSourceId, reason, searchRadiusKm = 10) {
    try {
      const res = await fetch(`${API_BASE}/rescue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId, failedSourceId, reason, searchRadiusKm })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend rescue error", e);
    }
    return {
      message: "Rescue activated",
      rescuedSource: null
    };
  },

  async getRescueOverview() {
    try {
      const res = await fetch(`${API_BASE}/rescue/overview`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Error fetching rescue overview", e);
    }
    return {
      activeIncident: null,
      stats: { totalIncidents: 4, rescuedLitres: 16000, recoveriesCount: 4, activeStandbyNodesCount: 3, avgResponseSeconds: 3.4 },
      history: []
    };
  },

  async getRescueScenarios() {
    try {
      const res = await fetch(`${API_BASE}/rescue/scenarios`);
      if (res.ok) {
        const data = await res.json();
        return data.scenarios || [];
      }
    } catch (e) {
      console.warn("Error fetching scenarios", e);
    }
    return [];
  },

  async simulateRescue(params) {
    try {
      const res = await fetch(`${API_BASE}/rescue/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (e) {
      console.error("Simulation error", e);
      throw e;
    }
  },

  async resolveRescue(incidentId) {
    try {
      const res = await fetch(`${API_BASE}/rescue/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId })
      });
      return await res.json();
    } catch (e) {
      console.error("Resolve rescue error", e);
      throw e;
    }
  },

  async resetRescue() {
    try {
      const res = await fetch(`${API_BASE}/rescue/reset`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn("Reset error", e);
      return { success: true };
    }
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
