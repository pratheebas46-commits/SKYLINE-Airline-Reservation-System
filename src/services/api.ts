/**
 * Local Python Flask Backend API Client
 * Domestic Railway Reservation System
 * Communicates with http://127.0.0.1:5000 via local /api proxy.
 * Completely offline with graceful fallback.
 */

const API_BASE_URL = '/api';

export interface BackendResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export const apiService = {
  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getTrains(source?: string, destination?: string, date?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (source) params.append('source', source);
      if (destination) params.append('destination', destination);
      if (date) params.append('date', date);

      const res = await fetch(`${API_BASE_URL}/trains?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      if (json.offline || json.fallback) return [];
      return json.trains || json.flights || [];
    } catch {
      return [];
    }
  },

  async getTrainById(trainId: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/trains/${encodeURIComponent(trainId)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.train || json.flight || null;
    } catch {
      return null;
    }
  },

  async getSeats(trainId: string, classType?: string): Promise<any[]> {
    try {
      const url = classType
        ? `${API_BASE_URL}/seats/${encodeURIComponent(trainId)}?class=${encodeURIComponent(classType)}`
        : `${API_BASE_URL}/seats/${encodeURIComponent(trainId)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.seats || [];
    } catch {
      return [];
    }
  },

  async login(email: string, password: string): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection to local backend failed.' };
    }
  },

  async register(data: { name: string; email: string; phone?: string; password: string; role?: string }): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection to local backend failed.' };
    }
  },

  async createBooking(bookingData: any): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to submit booking to backend.' };
    }
  },

  async getTicket(pnr: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/ticket/${encodeURIComponent(pnr)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.ticket || json.booking || null;
    } catch {
      return null;
    }
  },

  async getUserBookings(userId?: string): Promise<any[]> {
    try {
      const url = userId ? `${API_BASE_URL}/bookings?user_id=${encodeURIComponent(userId)}` : `${API_BASE_URL}/bookings`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.bookings || [];
    } catch {
      return [];
    }
  },

  async cancelBooking(pnr: string, reason?: string): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/cancel-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnr, reason: reason || 'Customer requested cancellation' })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to cancel booking.' };
    }
  },

  async getRecommendations(source: string, destination: string, preference: string = 'ALL'): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        source,
        destination,
        preference
      });
      const res = await fetch(`${API_BASE_URL}/recommendations?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.recommendations || [];
    } catch {
      return [];
    }
  },

  async adminLogin(usernameOrEmail: string, password: string): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usernameOrEmail, password })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection to local backend failed.' };
    }
  },

  async getAdminUsers(userId?: string, email?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (email) params.append('email', email);
      const res = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.users || [];
    } catch {
      return [];
    }
  },

  async getSavedTravellers(userId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/travellers?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.travellers || [];
    } catch {
      return [];
    }
  },

  async saveTraveller(userId: string, data: any): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/travellers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...data })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to save traveller to backend.' };
    }
  },

  async deleteSavedTraveller(userId: string, travellerId: string): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/travellers/${encodeURIComponent(travellerId)}?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to remove traveller from backend.' };
    }
  },

  async updateAdminSettings(data: { userId?: string; id?: string; fullName?: string; name?: string; email?: string; phone?: string; department?: string; office?: string; password?: string; [key: string]: any }): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update admin settings in backend.' };
    }
  },

  async updateProfile(data: { userId?: string; id?: string; fullName?: string; name?: string; email?: string; phone?: string; password?: string; [key: string]: any }): Promise<BackendResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update profile in backend.' };
    }
  }
};
