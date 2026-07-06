const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, ...init } = config;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(init.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...init,
      headers,
      credentials: 'include', // Send cookies for refresh token
    });

    // Handle token refresh on 401
    if (response.status === 401 && this.accessToken) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, { ...init, headers, credentials: 'include' });
        if (!retryResponse.ok) {
          throw await this.parseError(retryResponse);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    // Handle non-JSON responses (PDF, CSV)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/pdf') || contentType?.includes('text/csv')) {
      return response.blob() as unknown as T;
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.data.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.data.accessToken);
        }
        return true;
      }
    } catch {
      // Refresh failed — user needs to re-login
    }

    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      window.location.href = '/admin/login';
    }
    return false;
  }

  private async parseError(response: Response): Promise<Error> {
    try {
      const data = await response.json();
      const error = new Error(data.error?.message || 'An error occurred');
      (error as any).code = data.error?.code;
      (error as any).status = response.status;
      (error as any).details = data.error?.details;
      return error;
    } catch {
      return new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // ─── Public API ──────────────────────────────────────────

  // Auth
  login(email: string, password: string) {
    return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  logout() {
    return this.request<any>('/auth/logout', { method: 'POST' });
  }
  getMe() {
    return this.request<any>('/auth/me');
  }
  changeCredentials(data: any) {
    return this.request<any>('/auth/credentials', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Settings
  getPublicSettings() {
    return this.request<any>('/settings/public');
  }
  getSettings() {
    return this.request<any>('/settings');
  }
  updateSettings(data: any) {
    return this.request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) });
  }
  uploadQrCode(formData: FormData) {
    return this.request<any>('/settings/upload-qr', { method: 'POST', body: formData });
  }

  // Donations
  initDonationSession(data: any) {
    return this.request<any>('/donations/session', { method: 'POST', body: JSON.stringify(data) });
  }
  submitDonation(formData: FormData) {
    return this.request<any>('/donations', { method: 'POST', body: formData });
  }
  getDonationStatus(id: string) {
    return this.request<any>(`/donations/${id}/status`);
  }
  getDonation(id: string) {
    return this.request<any>(`/donations/${id}`);
  }
  listDonations(params: Record<string, string>) {
    return this.request<any>('/donations', { params });
  }
  updateDonationStatus(id: string, status: string, reason: string) {
    return this.request<any>(`/donations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  // Stats
  getPublicStats() {
    return this.request<any>('/stats/public');
  }
  getDashboardStats() {
    return this.request<any>('/stats');
  }

  // Reports
  generateStatement(startDate: string, endDate: string) {
    return this.request<Blob>('/reports/statement', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  }
  exportCsv(params: Record<string, string>) {
    return this.request<Blob>('/reports/export', { params });
  }

  // Audit
  listAuditLogs(params: Record<string, string>) {
    return this.request<any>('/audit', { params });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Restore token from localStorage on client
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('accessToken');
  if (token) {
    api.setAccessToken(token);
  }
}
