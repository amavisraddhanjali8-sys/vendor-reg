import { Company, NotificationLog, RegistrationStatus } from '../types';

const API_BASE = '/api';
export const LOCAL_STORAGE_KEY_COMPANIES = 'innovista_vendorhub_companies_v2';
export const LOCAL_STORAGE_KEY_NOTIFICATIONS = 'innovista_vendorhub_notifications_v2';

class DatabaseApiService {
  // Helper for requests
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
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
  // Health & Stats
  // -----------------------------------------------------------
  async checkHealth(): Promise<{
    status: string;
    counts: { companies: number; notifications: number };
    databasePath: string;
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
        // Cache to localStorage
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
