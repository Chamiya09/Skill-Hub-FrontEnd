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
  logoUrl?: string;
  website?: string;
  location?: string;
  industry?: string;
  about?: string;
  companySize?: string;
  foundedYear?: string;
  phone?: string;
  adminName?: string;
  contactEmail?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
}

export interface AuthResponseDto {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: UserDto;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skillhub_auth_change', { detail: data.user }));
    }
  },
  setUser(user: UserDto): void {
    localStorage.setItem('skillhub_user', JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skillhub_auth_change', { detail: user }));
    }
  },
  clearAuth(): void {
    localStorage.removeItem('skillhub_jwt_token');
    localStorage.removeItem('skillhub_user');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skillhub_auth_change', { detail: null }));
    }
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

  // Create an AbortController for 10-second timeout if none provided
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const config: RequestInit = {
    ...options,
    headers,
    signal: options.signal || controller.signal
  };

  try {
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
  } finally {
    clearTimeout(timeoutId);
  }
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
  },

  /**
   * Updates the authenticated company account password.
   * Calls: PUT /api/company/change-password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return request<{ message: string }>('/company/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
};

// Backward-compatible alias
export const authApi = companyAuthApi;

// ==========================================
// COMPANY PROFILE API METHODS
// ==========================================
export interface CompanyProfileDto {
  id: string;
  companyName: string;
  adminName?: string;
  contactEmail?: string;
  phone?: string;
  companySize?: string;
  foundedYear?: string;
  logoUrl?: string;
  website?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  location?: string;
  industry?: string;
  about?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCompanyProfilePayload {
  companyName?: string;
  adminName?: string;
  contactEmail?: string;
  phone?: string;
  companySize?: string;
  foundedYear?: string;
  logoUrl?: string;
  website?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  location?: string;
  industry?: string;
  about?: string;
}

export const companyProfileApi = {
  getProfileKey(companyId?: string): string {
    return `skillhub_company_profile_${companyId || 'current'}`;
  },

  async getProfile(): Promise<CompanyProfileDto> {
    const user = authStorage.getUser();
    const companyId = user?.companyId || user?.id || '';
    
    // Check local storage profile
    let localProfile: Partial<CompanyProfileDto> = {};
    try {
      const stored = localStorage.getItem(this.getProfileKey(companyId)) || localStorage.getItem(this.getProfileKey('current'));
      if (stored) localProfile = JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading local profile', e);
    }

    // Discover location from real posted company jobs if not set
    let discoveredLocation = '';
    try {
      const myJobs = await jobsApi.getJobs();
      if (myJobs && myJobs.length > 0) {
        discoveredLocation = myJobs[0].location || '';
      }
    } catch {
      // Ignore
    }

    // Attempt backend sync
    try {
      const me = await companyAuthApi.getMe();
      const combined: CompanyProfileDto = {
        id: me.companyId || me.id || companyId,
        companyName: me.companyName || user?.companyName || localProfile.companyName || '',
        adminName: (user as any)?.adminName || localProfile.adminName || user?.fullName || '',
        contactEmail: me.email || user?.contactEmail || user?.email || localProfile.contactEmail || '',
        phone: (user as any)?.phone || localProfile.phone || '',
        companySize: (user as any)?.companySize || localProfile.companySize || '51-200 Employees',
        foundedYear: (user as any)?.foundedYear || localProfile.foundedYear || '2020',
        logoUrl: localProfile.logoUrl || (user as any)?.logoUrl || '',
        website: (me as any)?.website || localProfile.website || (user as any)?.website || '',
        linkedinUrl: (user as any)?.linkedinUrl || localProfile.linkedinUrl || '',
        twitterUrl: (user as any)?.twitterUrl || localProfile.twitterUrl || '',
        githubUrl: (user as any)?.githubUrl || localProfile.githubUrl || '',
        location: localProfile.location || (user as any)?.location || discoveredLocation || '',
        industry: (me as any)?.industry || localProfile.industry || (user as any)?.industry || 'Technology & Software',
        about: localProfile.about || (user as any)?.about || '',
        createdAt: me.createdAt || user?.createdAt || new Date().toISOString(),
        updatedAt: localProfile.updatedAt || new Date().toISOString(),
      };
      return combined;
    } catch {
      // Fallback from cached user
      return {
        id: companyId,
        companyName: user?.companyName || localProfile.companyName || '',
        adminName: (user as any)?.adminName || localProfile.adminName || user?.fullName || '',
        contactEmail: user?.contactEmail || user?.email || localProfile.contactEmail || '',
        phone: (user as any)?.phone || localProfile.phone || '',
        companySize: (user as any)?.companySize || localProfile.companySize || '51-200 Employees',
        foundedYear: (user as any)?.foundedYear || localProfile.foundedYear || '2020',
        logoUrl: localProfile.logoUrl || (user as any)?.logoUrl || '',
        website: (user as any)?.website || localProfile.website || '',
        linkedinUrl: (user as any)?.linkedinUrl || localProfile.linkedinUrl || '',
        twitterUrl: (user as any)?.twitterUrl || localProfile.twitterUrl || '',
        githubUrl: (user as any)?.githubUrl || localProfile.githubUrl || '',
        location: localProfile.location || (user as any)?.location || discoveredLocation || '',
        industry: (user as any)?.industry || localProfile.industry || 'Technology & Software',
        about: localProfile.about || (user as any)?.about || '',
        createdAt: user?.createdAt || new Date().toISOString(),
        updatedAt: localProfile.updatedAt || new Date().toISOString(),
      };
    }
  },

  async updateProfile(payload: UpdateCompanyProfilePayload): Promise<CompanyProfileDto> {
    const current = await this.getProfile();
    const updated: CompanyProfileDto = {
      ...current,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    // Attempt backend update
    try {
      await request('/company/profile', {
        method: 'PUT',
        body: JSON.stringify({
          companyName: payload.companyName,
          industry: payload.industry,
          website: payload.website,
          contactEmail: payload.contactEmail,
        }),
      });
    } catch (e) {
      console.warn('Backend profile update notice:', e);
    }

    // Save to local storage for persistence under both ID and name
    const companyId = updated.id || 'current';
    localStorage.setItem(this.getProfileKey(companyId), JSON.stringify(updated));
    localStorage.setItem(this.getProfileKey('current'), JSON.stringify(updated));
    if (payload.companyName) {
      localStorage.setItem(this.getProfileKey(encodeURIComponent(payload.companyName)), JSON.stringify(updated));
    }

    // Overwrite and sync user object in auth storage
    const user = authStorage.getUser();
    if (user) {
      const updatedUser: UserDto = {
        ...user,
        companyName: payload.companyName || user.companyName,
        adminName: payload.adminName !== undefined ? payload.adminName : (user.adminName || user.fullName),
        fullName: payload.adminName !== undefined ? payload.adminName : user.fullName,
        email: payload.contactEmail || user.email,
        contactEmail: payload.contactEmail !== undefined ? payload.contactEmail : user.contactEmail,
        phone: payload.phone !== undefined ? payload.phone : user.phone,
        companySize: payload.companySize !== undefined ? payload.companySize : user.companySize,
        foundedYear: payload.foundedYear !== undefined ? payload.foundedYear : user.foundedYear,
        logoUrl: payload.logoUrl !== undefined ? payload.logoUrl : user.logoUrl,
        website: payload.website !== undefined ? payload.website : user.website,
        linkedinUrl: payload.linkedinUrl !== undefined ? payload.linkedinUrl : user.linkedinUrl,
        twitterUrl: payload.twitterUrl !== undefined ? payload.twitterUrl : user.twitterUrl,
        githubUrl: payload.githubUrl !== undefined ? payload.githubUrl : user.githubUrl,
        location: payload.location !== undefined ? payload.location : user.location,
        industry: payload.industry !== undefined ? payload.industry : user.industry,
        about: payload.about !== undefined ? payload.about : user.about,
      };
      authStorage.setUser(updatedUser);
    }

    // Dispatch global event so all components/queries immediately re-render/refetch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skillhub_company_profile_updated', { detail: updated }));
    }

    return updated;
  },

  async getPublicProfile(idOrName: string): Promise<{ company: CompanyProfileDto; jobs: JobDto[] }> {
    // Fetch all public jobs from PostgreSQL
    let allJobs: JobDto[] = [];
    try {
      allJobs = await publicJobsApi.getJobs();
    } catch {
      allJobs = [];
    }

    const decoded = decodeURIComponent(idOrName || '').toLowerCase().trim();

    // Match company jobs
    const matchedJobs = allJobs.filter((j) => {
      if (!decoded) return true;
      const jCompanyId = (j.companyId || '').toLowerCase();
      const jCompanyName = (j.companyName || '').toLowerCase();
      const jSlug = jCompanyName.replace(/\s+/g, '-');
      return jCompanyId === decoded || jCompanyName === decoded || jSlug === decoded || jCompanyName.includes(decoded);
    });

    // Check if we have local stored profile
    let profileData: Partial<CompanyProfileDto> = {};
    try {
      const stored =
        localStorage.getItem(this.getProfileKey(idOrName)) ||
        localStorage.getItem(this.getProfileKey('current'));
      if (stored) profileData = JSON.parse(stored);
    } catch {
      profileData = {};
    }

    const sampleJob = matchedJobs[0] || (allJobs.length > 0 ? allJobs[0] : null);
    const companyName = profileData.companyName || sampleJob?.companyName || decodeURIComponent(idOrName) || 'Company';
    const location = profileData.location || sampleJob?.location || '';

    const company: CompanyProfileDto = {
      id: idOrName || sampleJob?.companyId || '',
      companyName,
      adminName: profileData.adminName || '',
      contactEmail: profileData.contactEmail || '',
      phone: profileData.phone || '',
      companySize: profileData.companySize || '',
      foundedYear: profileData.foundedYear || '',
      logoUrl: profileData.logoUrl || '',
      website: profileData.website || '',
      linkedinUrl: profileData.linkedinUrl || '',
      twitterUrl: profileData.twitterUrl || '',
      githubUrl: profileData.githubUrl || '',
      location,
      industry: profileData.industry || '',
      about: profileData.about || '',
      createdAt: profileData.createdAt || sampleJob?.createdAt || new Date().toISOString(),
    };

    return {
      company,
      jobs: matchedJobs,
    };
  }
};

// ==========================================
// JOB VACANCIES API METHODS
// ==========================================
export interface JobDto {
  id: string;
  companyId: string;
  companyName: string;
  logoUrl?: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  status: 'Active' | 'Draft' | 'Closed' | string;
  description: string;
  whatWeOffer?: string;
  tags?: string[];
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
  tags?: string[];
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
  tags?: string[];
}

export const extractJobTags = (job: Partial<JobDto>): string[] => {
  if (job.tags && Array.isArray(job.tags) && job.tags.length > 0) {
    return job.tags;
  }
  if (job.id && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`skillhub_job_tags_${job.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  // Dynamic inference from title and department for backward compatibility
  const inferred: string[] = [];
  const text = `${job.title || ''} ${job.department || ''}`.toLowerCase();
  if (text.includes('react')) inferred.push('React');
  if (text.includes('net') || text.includes('.net') || text.includes('c#')) inferred.push('.NET Core');
  if (text.includes('node')) inferred.push('Node.js');
  if (text.includes('python')) inferred.push('Python');
  if (text.includes('java') && !text.includes('javascript')) inferred.push('Java');
  if (text.includes('spring')) inferred.push('Spring Boot');
  if (text.includes('type') || text.includes('ts')) inferred.push('TypeScript');
  if (text.includes('sql') || text.includes('postgres')) inferred.push('PostgreSQL');
  if (text.includes('aws') || text.includes('cloud')) inferred.push('AWS');
  if (text.includes('full stack') || text.includes('fullstack')) inferred.push('Full Stack');
  if (text.includes('frontend') || text.includes('front-end')) inferred.push('Frontend');
  if (text.includes('backend') || text.includes('back-end')) inferred.push('Backend');
  if (text.includes('ai') || text.includes('ml')) inferred.push('Machine Learning');
  if (inferred.length === 0) {
    inferred.push(job.department || 'Engineering');
  }
  return inferred;
};

export const jobsApi = {
  /**
   * Retrieves all job vacancies for the logged-in company.
   * Calls: GET /api/jobs
   */
  async getJobs(): Promise<JobDto[]> {
    const rawJobs = await request<JobDto[]>('/jobs', {
      method: 'GET',
    });
    return (rawJobs || []).map((j) => ({
      ...j,
      tags: extractJobTags(j),
    }));
  },

  /**
   * Retrieves single job vacancy details by ID.
   * Calls: GET /api/jobs/{id}
   */
  async getJobById(id: string): Promise<JobDto> {
    const j = await request<JobDto>(`/jobs/${id}`, {
      method: 'GET',
    });
    return {
      ...j,
      tags: extractJobTags(j),
    };
  },

  /**
   * Creates a new job vacancy linked to the logged-in company.
   * Calls: POST /api/jobs
   */
  async createJob(payload: CreateJobPayload): Promise<JobDto> {
    const created = await request<JobDto>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (payload.tags && created?.id && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`skillhub_job_tags_${created.id}`, JSON.stringify(payload.tags));
      } catch {}
    }
    return {
      ...created,
      tags: payload.tags || extractJobTags(created),
    };
  },

  /**
   * Updates an existing job vacancy.
   * Calls: PUT /api/jobs/{id}
   */
  async updateJob(id: string, payload: UpdateJobPayload): Promise<JobDto> {
    const updated = await request<JobDto>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (payload.tags && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`skillhub_job_tags_${id}`, JSON.stringify(payload.tags));
      } catch {}
    }
    return {
      ...updated,
      tags: payload.tags || extractJobTags(updated),
    };
  },

  /**
   * Permanently hard-deletes a job vacancy from PostgreSQL.
   * Calls: DELETE /api/jobs/{id}
   */
  async deleteJob(id: string): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`skillhub_job_tags_${id}`);
      } catch {}
    }
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
    const rawJobs = await request<JobDto[]>(endpoint, {
      method: 'GET'
    });
    return (rawJobs || []).map((j) => ({
      ...j,
      tags: extractJobTags(j),
    }));
  },

  /**
   * Retrieves single public job by ID.
   * Calls: GET /api/public/jobs/{id}
   */
  async getJobById(id: string): Promise<JobDto> {
    const j = await request<JobDto>(`/public/jobs/${id}`, {
      method: 'GET'
    });
    return {
      ...j,
      tags: extractJobTags(j),
    };
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
