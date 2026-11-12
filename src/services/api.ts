import { Company, NotificationLog, RegistrationStatus, UserProfile, TwoFactorSetupData } from '../types';

const API_BASE = '/api';
export const LOCAL_STORAGE_KEY_COMPANIES = 'innovista_vendorhub_companies_v2';
export const LOCAL_STORAGE_KEY_NOTIFICATIONS = 'innovista_vendorhub_notifications_v2';
export const LOCAL_STORAGE_KEY_AUTH_TOKEN = 'innovista_vendorhub_auth_token_v2';

class DatabaseApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH_TOKEN, token);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH_TOKEN);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN);
    }
    return this.token;
  }

  // Helper for requests
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`API request to ${endpoint} failed:`, err);
      throw err;
    }
  }

  // -----------------------------------------------------------
  // Authentication & 2FA
  // -----------------------------------------------------------
  async login(username: string, password: string, totpCode?: string): Promise<{
    success: boolean;
    token?: string;
    user?: UserProfile;
    requires2FA?: boolean;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, totpCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async loginWithGoogle(idToken: string): Promise<{
    success: boolean;
    token?: string;
    user?: UserProfile;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const token = this.getToken();
      if (!token) return null;
      const res = await this.request<{ success: boolean; user: UserProfile }>('/auth/me');
      return res.user || null;
    } catch {
      return null;
    }
  }

  logout() {
    this.setToken(null);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async generate2FASetup(): Promise<TwoFactorSetupData> {
    const res = await this.request<{ success: boolean; data: TwoFactorSetupData }>('/auth/2fa/generate', {
      method: 'POST',
    });
    return res.data;
  }

  async verifyAndEnable2FA(secret: string, code: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/2fa/verify-and-enable', {
      method: 'POST',
      body: JSON.stringify({ secret, code }),
    });
  }

  async disable2FA(): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/2fa/disable', {
      method: 'POST',
    });
  }

  // -----------------------------------------------------------
  // User Management (Admin Only)
  // -----------------------------------------------------------
  async getUsers(): Promise<UserProfile[]> {
    const res = await this.request<{ success: boolean; count: number; data: UserProfile[] }>('/users');
    return res.data || [];
  }

  async createUser(payload: { username: string; password?: string; email: string; role?: string; displayName?: string }): Promise<UserProfile> {
    const res = await this.request<{ success: boolean; data: UserProfile }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async changeUserPassword(userId: number, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  }

  async deleteUserPassword(userId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/users/${userId}/password`, {
      method: 'DELETE',
    });
  }

  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // -----------------------------------------------------------
  // Health & Stats
  // -----------------------------------------------------------
  async checkHealth(): Promise<{
    status: string;
    database: string;
    counts: { companies: number; notifications: number; industryTypes: number };
    uptime: number;
  }> {
    return this.request('/health');
  }

  // -----------------------------------------------------------
  // Companies
  // -----------------------------------------------------------
  async getCompanies(): Promise<Company[]> {
    try {
      const response = await this.request<{ success: boolean; count: number; data: Company[] }>('/companies');
      if (response && Array.isArray(response.data)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_COMPANIES, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn('Falling back to local storage cache for companies', err);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANIES);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return [];
  }

  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const response = await this.request<{ success: boolean; data: Company }>(`/companies/${encodeURIComponent(id)}`);
      return response.data || null;
    } catch (err) {
      console.warn(`Failed to fetch company ${id}`, err);
      return null;
    }
  }

  async createCompany(company: Partial<Company>): Promise<Company> {
    const response = await this.request<{ success: boolean; data: Company }>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
    return response.data;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const response = await this.request<{ success: boolean; data: Company }>(`/companies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const response = await this.request<{ success: boolean }>(`/companies/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  async bulkImport(companies: Company[], mode: 'merge' | 'append' = 'append'): Promise<Company[]> {
    const response = await this.request<{ success: boolean; count: number; data: Company[] }>('/companies/bulk', {
      method: 'POST',
      body: JSON.stringify({ companies, mode }),
    });
    return response.data;
  }

  async bulkUpdateStatus(companyIds: string[], status: RegistrationStatus): Promise<Company[]> {
    const response = await this.request<{ success: boolean; count: number; data: Company[] }>('/companies/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ companyIds, status }),
    });
    return response.data;
  }

  async bulkAssignOfficer(companyIds: string[], officerName: string): Promise<Company[]> {
    const response = await this.request<{ success: boolean; count: number; data: Company[] }>('/companies/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ companyIds, officerName }),
    });
    return response.data;
  }

  async bulkDelete(companyIds: string[]): Promise<boolean> {
    const response = await this.request<{ success: boolean; deletedCount: number }>('/companies/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ companyIds }),
    });
    return response.success;
  }

  // -----------------------------------------------------------
  // Notifications
  // -----------------------------------------------------------
  async getNotifications(): Promise<NotificationLog[]> {
    try {
      const response = await this.request<{ success: boolean; count: number; data: NotificationLog[] }>('/notifications');
      if (response && Array.isArray(response.data)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_NOTIFICATIONS, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn('Falling back to local storage cache for notifications', err);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIFICATIONS);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return [];
  }

  async createNotification(notif: Partial<NotificationLog>): Promise<NotificationLog> {
    const response = await this.request<{ success: boolean; data: NotificationLog }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notif),
    });
    return response.data;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const response = await this.request<{ success: boolean }>(`/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return response.success;
  }

  // -----------------------------------------------------------
  // Settings & Industry Types
  // -----------------------------------------------------------
  async getIndustryTypes(): Promise<string[]> {
    try {
      const response = await this.request<{ success: boolean; count: number; data: string[] }>('/settings/industries');
      if (response && Array.isArray(response.data)) {
        localStorage.setItem('innovista_vendorhub_industries_v2', JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn('Falling back to local storage cache for industries', err);
      const cached = localStorage.getItem('innovista_vendorhub_industries_v2');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return [];
  }

  async addIndustryType(name: string): Promise<string[]> {
    const response = await this.request<{ success: boolean; data: string[] }>('/settings/industries', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (response && Array.isArray(response.data)) {
      localStorage.setItem('innovista_vendorhub_industries_v2', JSON.stringify(response.data));
      return response.data;
    }
    return [];
  }

  async updateIndustryType(
    oldName: string,
    newName: string,
    cascadeCompanies: boolean = true
  ): Promise<{ industryTypes: string[]; affectedCompaniesCount: number }> {
    const response = await this.request<{
      success: boolean;
      data: string[];
      affectedCompaniesCount: number;
    }>(`/settings/industries/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ newName, cascadeCompanies }),
    });
    if (response && Array.isArray(response.data)) {
      localStorage.setItem('innovista_vendorhub_industries_v2', JSON.stringify(response.data));
    }
    return {
      industryTypes: response.data || [],
      affectedCompaniesCount: response.affectedCompaniesCount || 0,
    };
  }

  async deleteIndustryType(name: string): Promise<string[]> {
    const response = await this.request<{ success: boolean; data: string[] }>(
      `/settings/industries/${encodeURIComponent(name)}`,
      {
        method: 'DELETE',
      }
    );
    if (response && Array.isArray(response.data)) {
      localStorage.setItem('innovista_vendorhub_industries_v2', JSON.stringify(response.data));
      return response.data;
    }
    return [];
  }

  async resetIndustryTypes(): Promise<string[]> {
    const response = await this.request<{ success: boolean; data: string[] }>('/settings/industries/reset', {
      method: 'POST',
    });
    if (response && Array.isArray(response.data)) {
      localStorage.setItem('innovista_vendorhub_industries_v2', JSON.stringify(response.data));
      return response.data;
    }
    return [];
  }

  // -----------------------------------------------------------
  // Reset & Seed Utilities
  // -----------------------------------------------------------
  async clearDatabase(): Promise<boolean> {
    const response = await this.request<{ success: boolean }>('/database/clear', {
      method: 'DELETE',
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY_COMPANIES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_NOTIFICATIONS);
    return response.success;
  }

  async seedSampleData(): Promise<{ success: boolean; counts: { companies: number; notifications: number } }> {
    const response = await this.request<{
      success: boolean;
      counts: { companies: number; notifications: number };
    }>('/database/seed-sample', {
      method: 'POST',
    });
    return response;
  }
}

export const api = new DatabaseApiService();
