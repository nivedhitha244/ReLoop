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
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'create_demand' } }));
          localStorage.setItem('reloop_last_mutation', String(Date.now()));
        }
        return data;
      }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action: 'request_water' } }));
        localStorage.setItem('reloop_last_mutation', String(Date.now()));
      }
      return data;
    } catch (e) {
      console.error("[buyerApi] Error requesting water:", e.message);
      throw e;
    }
  },

  async requestMatch(sourceId, demandId, quantity, notes, extraFields = {}) {
    return this.requestWater({
      sourceId,
      demandId,
      quantity,
      requestedQuantity: quantity,
      notes,
      ...extraFields
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

  async confirmMatchAgreement(matchId, details = {}) {
    try {
      const res = await fetch(`${API_BASE}/buyer/matches/${matchId}/confirm-agreement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      });
      const data = await res.json();
      if (!res.ok) {
        // Fallback to patch if dedicated endpoint returns 404
        const fallbackRes = await fetch(`${API_BASE}/buyer/matches/${matchId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Confirmed', buyerConfirmed: true, ...details })
        });
        const fallbackData = await fallbackRes.json();
        if (!fallbackRes.ok) throw new Error(fallbackData.error || data.error || 'Failed to confirm match');
        return fallbackData;
      }
      return data;
    } catch (e) {
      console.error("[buyerApi] Error confirming match agreement:", e);
      throw e;
    }
  },

  async patchMatchStatus(matchId, status, details = {}) {
    try {
      const res = await fetch(`${API_BASE}/buyer/matches/${matchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...details })
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

