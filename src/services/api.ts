// API Base URL - Matches ASP.NET Core port from launchSettings.json (http://localhost:5155 or https://localhost:7231)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5155/api/v1';

export interface UserDto {
  id: string;
  companyId: string;
  companyName: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthResponseDto {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: UserDto;
}

export interface RegisterCompanyPayload {
  companyName: string;
  contactEmail: string;
  industry?: string;
  website?: string;
  adminFullName: string;
  adminEmail: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ==========================================
// AUTH & TOKEN LOCAL STORAGE UTILITIES
// ==========================================
export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem('skillhub_jwt_token');
  },
  getUser(): UserDto | null {
    const raw = localStorage.getItem('skillhub_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setAuth(data: AuthResponseDto): void {
    localStorage.setItem('skillhub_jwt_token', data.token);
    localStorage.setItem('skillhub_user', JSON.stringify(data.user));
  },
  clearAuth(): void {
    localStorage.removeItem('skillhub_jwt_token');
    localStorage.removeItem('skillhub_user');
  },
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

// ==========================================
// HTTP REQUEST HELPER WITH JWT ATTACHMENT
// ==========================================
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData && errorData.errors) {
        errorMessage = Object.values(errorData.errors).flat().join(' ');
      }
    } catch {
      // Fallback to text status
    }
    throw new Error(errorMessage);
  }

  // If 204 No Content, return null
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ==========================================
// AUTHENTICATION API METHODS
// ==========================================
export const authApi = {
  async register(payload: RegisterCompanyPayload): Promise<AuthResponseDto> {
    const data = await request<AuthResponseDto>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authStorage.setAuth(data);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseDto> {
    const data = await request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authStorage.setAuth(data);
    return data;
  },

  logout(): void {
    authStorage.clearAuth();
  }
};

// ==========================================
// USER MANAGEMENT API METHODS
// ==========================================
export const usersApi = {
  async getUsersByCompany(companyId: string): Promise<UserDto[]> {
    return request<UserDto[]>(`/users/company/${companyId}`, {
      method: 'GET'
    });
  },

  async getUserById(userId: string): Promise<UserDto> {
    return request<UserDto>(`/users/${userId}`, {
      method: 'GET'
    });
  },

  /**
   * Completely and directly deletes the user from the database.
   * (No soft-disable or block flag is used).
   */
  async deleteUserDirectly(userId: string): Promise<void> {
    return request<void>(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
};
