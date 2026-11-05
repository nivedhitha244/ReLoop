// src/services/buyerApi.js
const API_BASE = 'http://localhost:5000/api';

const initialMock = {
  sources: [],
  demands: [],
  matches: [],
  activities: []
};

export const buyerApi = {
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Backend not reached, using local fallback", e);
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
      console.warn("[buyerApi] Backend not reached, using local fallback", e);
    }
    return initialMock.sources;
  },

  async getDemands() {
    try {
      const res = await fetch(`${API_BASE}/demands`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Backend not reached, using local fallback", e);
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
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'create_demand' } }));
          localStorage.setItem('reloop_last_mutation', String(Date.now()));
        }
        return data;
      }
    } catch (e) {
      console.warn("[buyerApi] Backend demand creation error, saving locally", e);
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
      console.warn("[buyerApi] Backend not reached, using local fallback", e);
    }
    return initialMock.matches;
  },

  async getRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Backend not reached for requests, using local fallback", e);
    }
    return [];
  },

  async requestWater(params) {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit water request');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'request_water', params } }));
        localStorage.setItem('reloop_last_mutation', String(Date.now()));
      }
      return data;
    } catch (e) {
      console.error("[buyerApi] Error requesting water:", e);
      throw e;
    }
  },

  async findMatchesForDemand(demandId) {
    try {
      const res = await fetch(`${API_BASE}/demands/${demandId}/matches`);
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to find matching sources');
    } catch (e) {
      console.error("[buyerApi] Error finding matches:", e);
      throw e;
    }
  },

  async confirmDelivery(matchId) {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm delivery');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'confirm_delivery', matchId } }));
        localStorage.setItem('reloop_last_mutation', String(Date.now()));
      }
      return data;
    } catch (e) {
      console.error("[buyerApi] Error confirming delivery:", e);
      throw e;
    }
  },

  async confirmMatchAgreement(identifier) {
    try {
      const res = await fetch(`${API_BASE}/matches/${identifier}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm match agreement');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'confirm_match', identifier } }));
        localStorage.setItem('reloop_last_mutation', String(Date.now()));
      }
      return data;
    } catch (e) {
      console.error("[buyerApi] Error confirming match agreement:", e);
      throw e;
    }
  },

  async updateMatchStatus(matchId, status) {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update match status');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'patch_match_status', matchId, status } }));
        localStorage.setItem('reloop_last_mutation', String(Date.now()));
      }
      return data;
    } catch (e) {
      console.error("[buyerApi] Error patching match status:", e);
      throw e;
    }
  },

  async triggerRescue(demandId, failedSourceId, reason, searchRadiusKm = 10) {
    try {
      const res = await fetch(`${API_BASE}/rescue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId, failedSourceId, reason, searchRadiusKm })
      });
      if (res.ok) return await res.json();
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Rescue operation failed');
    } catch (e) {
      console.warn("[buyerApi] Backend rescue error:", e);
      throw e;
    }
  },

  // Enhanced ReLoop Rescue API Methods
  async getRescueOverview() {
    try {
      const res = await fetch(`${API_BASE}/rescue/overview`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Error fetching rescue overview:", e);
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
      console.warn("[buyerApi] Error fetching rescue scenarios:", e);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');
      return data;
    } catch (e) {
      console.error("[buyerApi] Error executing rescue simulation:", e);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch rescue alternative');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'rescue_resolved' } }));
        localStorage.setItem('reloop_last_mutation', String(Date.now()));
      }
      return data;
    } catch (e) {
      console.error("[buyerApi] Error resolving rescue incident:", e);
      throw e;
    }
  },

  async resetRescue() {
    try {
      const res = await fetch(`${API_BASE}/rescue/reset`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn("[buyerApi] Error resetting rescue:", e);
      return { success: true };
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

export const api = buyerApi;
export default buyerApi;
