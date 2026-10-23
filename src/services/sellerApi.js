const API_BASE = '/api/seller';

// Fallback seed data in case API server is unreachable
const fallbackSellerData = {
  profile: {
    id: "seed-supplier-1",
    name: "Apex Tech Park STP",
    organization: "Apex Commercial Facilities Ltd.",
    role: "Seller / Water Supplier",
    initials: "AT",
    email: "supplier@reloop.org",
    phone: "+91 98111 22334",
    facilityAddress: "Plot 14-B, OMR IT Expressway, Sholinganallur",
    city: "Chennai",
    region: "Tamil Nadu",
    postalCode: "600119",
    coordinates: [12.9800, 80.2200],
    operatingHours: "24/7 Continuous Treatment",
    contactPerson: "Dr. Rajesh Sundaram, Plant Operations Director"
  },
  stats: {
    totalWaterListed: 0,
    activeSourcesCount: 0,
    availableWater: 0,
    pendingRequests: 0,
    successfulMatches: 0,
    totalWaterReusedDelivered: 0,
    utilizationRate: 0,
    freshwaterSaved: 0,
    freshwaterSavedEq: 0,
    co2AvoidedKg: 0,
    revenueGenerated: 0
  }
};

const notifyMutation = (action) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reloop:data_updated', { detail: { action } }));
    localStorage.setItem('reloop_last_mutation', String(Date.now()));
  }
};

export const sellerApi = {
  async getProfile() {
    try {
      const res = await fetch(`${API_BASE}/profile`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching profile, using fallback", e);
    }
    return fallbackSellerData.profile;
  },

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error updating profile", e);
    }
    return { success: true, profile: profileData };
  },

  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching stats, using fallback", e);
    }
    return fallbackSellerData.stats;
  },

  async getSources() {
    try {
      const res = await fetch(`${API_BASE}/sources`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching sources", e);
    }
    return [];
  },

  async createSource(sourceData) {
    try {
      const res = await fetch(`${API_BASE}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create water source');
      notifyMutation('create_source');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error creating source", e);
      throw e;
    }
  },

  async updateSource(id, updateData) {
    try {
      const res = await fetch(`${API_BASE}/sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update water source');
      notifyMutation('update_source');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error updating source", e);
      throw e;
    }
  },

  async toggleAvailability(id, available) {
    try {
      const res = await fetch(`${API_BASE}/sources/${id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update availability');
      notifyMutation('toggle_availability');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error toggling availability", e);
      throw e;
    }
  },

  async updateQuantity(id, quantity) {
    try {
      const res = await fetch(`${API_BASE}/sources/${id}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quantity');
      notifyMutation('update_quantity');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error updating quantity", e);
      throw e;
    }
  },

  async deleteSource(id) {
    try {
      const res = await fetch(`${API_BASE}/sources/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete source');
      notifyMutation('delete_source');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error deleting source", e);
      throw e;
    }
  },

  async getRequests(status = 'All') {
    try {
      const url = status && status !== 'All' ? `${API_BASE}/requests?status=${status}` : `${API_BASE}/requests`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching requests", e);
    }
    return [];
  },

  async acceptRequest(id) {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/accept`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept request');
      notifyMutation('accept_request');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error accepting request", e);
      throw e;
    }
  },

  async rejectRequest(id, reason, notes = '') {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject request');
      notifyMutation('reject_request');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error rejecting request", e);
      throw e;
    }
  },

  async getMatches() {
    try {
      const res = await fetch(`${API_BASE}/matches`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching matches", e);
    }
    return [];
  },

  async updateMatchStatus(id, updateData) {
    try {
      const res = await fetch(`${API_BASE}/matches/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update match status');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error updating match status", e);
      throw e;
    }
  },

  async getDocuments() {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching documents", e);
    }
    return [];
  },

  async uploadDocument(docData) {
    try {
      const res = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error uploading document", e);
      throw e;
    }
  },

  async getImpact() {
    try {
      const res = await fetch(`${API_BASE}/impact`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching impact reports", e);
    }
    return null;
  },

  async getNotifications() {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("[sellerApi] Error fetching notifications", e);
    }
    return [];
  },

  async markNotificationRead(id) {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      console.warn("[sellerApi] Error marking notification read", e);
    }
  },

  async markAllNotificationsRead() {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
    } catch (e) {
      console.warn("[sellerApi] Error marking all notifications read", e);
    }
  },

  async triggerRescue(sourceId, reason) {
    try {
      const res = await fetch(`${API_BASE}/rescue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger ReLoop Rescue');
      return data;
    } catch (e) {
      console.error("[sellerApi] Error triggering rescue", e);
      throw e;
    }
  }
};
