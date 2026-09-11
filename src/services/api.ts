// API Base URL - Matches ASP.NET Core port from launchSettings.json (http://localhost:5155)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5155/api';

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
  companyEmail: string;
  password: string;
  industry?: string;
  website?: string;
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
  setUser(user: UserDto): void {
    localStorage.setItem('skillhub_user', JSON.stringify(user));
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
      console.error('Server Error Data:', errorData);
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
// COMPANY / EMPLOYER AUTHENTICATION API
// ==========================================
export const companyAuthApi = {
  /**
   * Registers a new Company and provisions the first HR Admin user account.
   * Calls: POST /api/company/register
   */
  async register(payload: RegisterCompanyPayload): Promise<AuthResponseDto> {
    const data = await request<AuthResponseDto>('/company/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authStorage.setAuth(data);
    return data;
  },

  /**
   * Authenticates a company user and returns JWT token + user details.
   * Calls: POST /api/company/login
   */
  async login(payload: LoginPayload): Promise<AuthResponseDto> {
    const data = await request<AuthResponseDto>('/company/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authStorage.setAuth(data);
    return data;
  },

  /**
   * Fetches the current logged in company profile.
   * Calls: GET /api/company/me
   */
  async getMe(): Promise<UserDto> {
    const data = await request<UserDto>('/company/me', {
      method: 'GET'
    });
    authStorage.setUser(data);
    return data;
  }
};

// Backward-compatible alias
export const authApi = companyAuthApi;

// ==========================================
// JOB VACANCIES API METHODS
// ==========================================
export interface JobDto {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  status: 'Active' | 'Draft' | 'Closed' | string;
  description: string;
  whatWeOffer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPayload {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  status: string;
  description: string;
  whatWeOffer?: string;
}

export interface UpdateJobPayload {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  status: string;
  description: string;
  whatWeOffer?: string;
}

export const jobsApi = {
  /**
   * Retrieves all job vacancies for the logged-in company.
   * Calls: GET /api/jobs
   */
  async getJobs(): Promise<JobDto[]> {
    return request<JobDto[]>('/jobs', {
      method: 'GET',
    });
  },

  /**
   * Retrieves single job vacancy details by ID.
   * Calls: GET /api/jobs/{id}
   */
  async getJobById(id: string): Promise<JobDto> {
    return request<JobDto>(`/jobs/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Creates a new job vacancy linked to the logged-in company.
   * Calls: POST /api/jobs
   */
  async createJob(payload: CreateJobPayload): Promise<JobDto> {
    return request<JobDto>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates an existing job vacancy.
   * Calls: PUT /api/jobs/{id}
   */
  async updateJob(id: string, payload: UpdateJobPayload): Promise<JobDto> {
    return request<JobDto>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Permanently hard-deletes a job vacancy from PostgreSQL.
   * Calls: DELETE /api/jobs/{id}
   */
  async deleteJob(id: string): Promise<void> {
    return request<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==========================================
// PUBLIC JOBS API (UNAUTHENTICATED)
// ==========================================
export interface PublicJobsFilterParams {
  search?: string;
  department?: string;
  employmentType?: string;
  experienceLevel?: string;
  limit?: number;
}

export const publicJobsApi = {
  /**
   * Retrieves active jobs publicly without requiring authentication.
   * Calls: GET /api/public/jobs
   */
  async getJobs(params: PublicJobsFilterParams = {}): Promise<JobDto[]> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department && params.department !== 'All' && params.department !== 'All Roles') {
      query.append('department', params.department);
    }
    if (params.employmentType && params.employmentType !== 'All') {
      query.append('employmentType', params.employmentType);
    }
    if (params.experienceLevel && params.experienceLevel !== 'All') {
      query.append('experienceLevel', params.experienceLevel);
    }
    if (params.limit) query.append('limit', params.limit.toString());

    const qs = query.toString();
    const endpoint = `/public/jobs${qs ? `?${qs}` : ''}`;
    return request<JobDto[]>(endpoint, {
      method: 'GET'
    });
  },

  /**
   * Retrieves a single active job publicly.
   * Calls: GET /api/public/jobs/{id}
   */
  async getJobById(id: string): Promise<JobDto> {
    return request<JobDto>(`/public/jobs/${id}`, {
      method: 'GET'
    });
  }
};

// ==========================================
// DASHBOARD METRICS API
// ==========================================
export interface DashboardStatsDto {
  activeVacanciesCount: number;
  draftVacanciesCount: number;
  closedVacanciesCount: number;
  totalVacanciesCount: number;
  totalDepartmentsCount: number;
  recentVacancies: JobDto[];
}

export const dashboardApi = {
  /**
   * Retrieves real-time aggregated metrics for the authenticated company.
   * Calls: GET /api/dashboard/stats
   */
  async getStats(): Promise<DashboardStatsDto> {
    return request<DashboardStatsDto>('/dashboard/stats', {
      method: 'GET'
    });
  }
};

// ==========================================
// USER MANAGEMENT API METHODS
// ==========================================
export const usersApi = {
  /**
   * Retrieves all users registered under a specific company.
   * Calls: GET /api/users/company/{companyId}
   */
  async getUsersByCompany(companyId: string): Promise<UserDto[]> {
    return request<UserDto[]>(`/users/company/${companyId}`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves single user details by ID.
   * Calls: GET /api/users/{id}
   */
  async getUserById(userId: string): Promise<UserDto> {
    return request<UserDto>(`/users/${userId}`, {
      method: 'GET'
    });
  },

  /**
   * Directly and permanently deletes a user from the database.
   * Calls: DELETE /api/users/{id}
   */
  async deleteUserDirectly(userId: string): Promise<void> {
    return request<void>(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
};
