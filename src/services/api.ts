// API Base URL - Matches ASP.NET Core port from launchSettings.json (http://localhost:5155)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5155/api';

export interface UserDto {
  id: string;
  companyId?: string | null;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  headline?: string;
  avatarUrl?: string;
  logoUrl?: string;
  website?: string;
  location?: string;
  experience?: string;
  availability?: string;
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
  updatedAt?: string;
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

export interface RegisterCandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  headline?: string;
  phone?: string;
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
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 30000,
): Promise<T> {
  const token = authStorage.getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Apply the default timeout only when the caller did not provide its own signal.
  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = options.signal
    ? undefined
    : setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, timeoutMs);

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
  } catch (error: unknown) {
    if (didTimeout && error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`, { cause: error });
    }
    throw error;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
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
// CANDIDATE AUTHENTICATION API
// ==========================================
export const candidateAuthApi = {
  /**
   * Registers a new Candidate (Job Seeker) user with role CANDIDATE.
   * Calls: POST /api/auth/candidate/register
   */
  async register(payload: RegisterCandidatePayload): Promise<AuthResponseDto> {
    const data = await request<AuthResponseDto>('/auth/candidate/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    authStorage.setAuth(data);
    return data;
  },

  /**
   * Authenticates a Candidate.
   * Calls: POST /api/auth/candidate/login
   */
  async login(payload: LoginPayload): Promise<AuthResponseDto> {
    const data = await request<AuthResponseDto>('/auth/candidate/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    authStorage.setAuth(data);
    return data;
  },

  /**
   * Fetches the current logged in candidate profile.
   * Calls: GET /api/candidate/me
   */
  async getMe(): Promise<UserDto> {
    const data = await request<UserDto>('/candidate/me', {
      method: 'GET',
    });
    authStorage.setUser(data);
    return data;
  },

  /**
   * Updates candidate profile information.
   * Calls: PUT /api/candidate/profile
   */
  async updateProfile(payload: Partial<UserDto>): Promise<UserDto> {
    const data = await request<UserDto>('/candidate/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    authStorage.setUser(data);
    return data;
  },
};

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
    const rawUser = authStorage.getUser();
    const user = rawUser as (Record<string, unknown> & { id?: string; companyId?: string; companyName?: string; fullName?: string; email?: string; createdAt?: string; updatedAt?: string }) | null;
    const companyId = user?.companyId || user?.id || '';

    // Attempt backend sync directly from PostgreSQL database
    try {
      const me = await companyAuthApi.getMe();
      const combined: CompanyProfileDto = {
        id: me.companyId || me.id || companyId,
        companyName: me.companyName || user?.companyName || '',
        adminName: me.adminName || me.fullName || (user?.adminName as string) || user?.fullName || '',
        contactEmail: me.contactEmail || me.email || (user?.contactEmail as string) || user?.email || '',
        phone: me.phone || (user?.phone as string) || '',
        companySize: me.companySize || (user?.companySize as string) || '',
        foundedYear: me.foundedYear || (user?.foundedYear as string) || '',
        logoUrl: me.logoUrl || (user?.logoUrl as string) || '',
        website: me.website || (user?.website as string) || '',
        linkedinUrl: me.linkedinUrl || (user?.linkedinUrl as string) || '',
        twitterUrl: me.twitterUrl || (user?.twitterUrl as string) || '',
        githubUrl: me.githubUrl || (user?.githubUrl as string) || '',
        location: me.location || (user?.location as string) || '',
        industry: me.industry || (user?.industry as string) || '',
        about: me.about || (user?.about as string) || '',
        createdAt: me.createdAt || user?.createdAt || new Date().toISOString(),
        updatedAt: me.updatedAt || user?.updatedAt || new Date().toISOString(),
      };
      return combined;
    } catch {
      // Fallback from cached authenticated user session
      return {
        id: companyId,
        companyName: user?.companyName || '',
        adminName: (user?.adminName as string) || user?.fullName || '',
        contactEmail: (user?.contactEmail as string) || user?.email || '',
        phone: (user?.phone as string) || '',
        companySize: (user?.companySize as string) || '',
        foundedYear: (user?.foundedYear as string) || '',
        logoUrl: (user?.logoUrl as string) || '',
        website: (user?.website as string) || '',
        linkedinUrl: (user?.linkedinUrl as string) || '',
        twitterUrl: (user?.twitterUrl as string) || '',
        githubUrl: (user?.githubUrl as string) || '',
        location: (user?.location as string) || '',
        industry: (user?.industry as string) || '',
        about: (user?.about as string) || '',
        createdAt: user?.createdAt || new Date().toISOString(),
        updatedAt: user?.updatedAt || new Date().toISOString(),
      };
    }
  },

  async updateProfile(payload: UpdateCompanyProfilePayload): Promise<CompanyProfileDto> {
    const current = await this.getProfile();
    let updated: CompanyProfileDto = {
      ...current,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    // Attempt backend update
    try {
      const backendResponse = await request<Partial<CompanyProfileDto> & { fullName?: string; email?: string }>('/company/profile', {
        method: 'PUT',
        body: JSON.stringify({
          companyName: payload.companyName,
          adminName: payload.adminName,
          contactEmail: payload.contactEmail,
          phone: payload.phone,
          companySize: payload.companySize,
          foundedYear: payload.foundedYear,
          logoUrl: payload.logoUrl,
          website: payload.website,
          linkedinUrl: payload.linkedinUrl,
          twitterUrl: payload.twitterUrl,
          githubUrl: payload.githubUrl,
          location: payload.location,
          industry: payload.industry,
          about: payload.about,
        }),
      });

      if (backendResponse) {
        updated = {
          ...updated,
          ...backendResponse,
          adminName: backendResponse.adminName || backendResponse.fullName || updated.adminName,
          contactEmail: backendResponse.contactEmail || backendResponse.email || updated.contactEmail,
        };
      }
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
    const rawIdentifier = (idOrName || '').trim();
    if (!rawIdentifier) {
      throw new Error('Company identifier is required.');
    }

    // 1. Fetch strictly from backend dedicated public company endpoint by ID or slug
    let result: { company?: CompanyProfileDto; jobs?: JobDto[]; id?: string } | null;
    try {
      result = await request<{ company: CompanyProfileDto; jobs: JobDto[] }>(
        `/companies/${encodeURIComponent(rawIdentifier)}`,
        { method: 'GET' }
      );
    } catch {
      // Fallback attempt to alternate public jobs company route
      result = await request<{ company: CompanyProfileDto; jobs: JobDto[] }>(
        `/public/jobs/company/${encodeURIComponent(rawIdentifier)}`,
        { method: 'GET' }
      );
    }

    if (result && (result.company || result.id)) {
      const companyData = (result.company || result) as CompanyProfileDto;
      return {
        company: {
          ...companyData,
          id: companyData.id || rawIdentifier,
        },
        jobs: (result.jobs || []).map((j: JobDto) => ({ ...j, tags: extractJobTags(j) })),
      };
    }

    throw new Error(`Company '${rawIdentifier}' was not found.`);
  },
};

// ==========================================
// JOB VACANCIES API METHODS
// ==========================================
export interface JobDto {
  id: string;
  matchPercentage?: number;
  companyId: string;
  companyName?: string;
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
  applicantsCount?: number;
  deadline?: string;
  createdAt: string;
  updatedAt?: string;
}



export interface CreateJobPayload {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  status?: string;
  description: string;
  whatWeOffer?: string;
  tags?: string[];
  deadline?: string;
}

export interface UpdateJobPayload {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  status?: string;
  description: string;
  whatWeOffer?: string;
  tags?: string[];
  deadline?: string;
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
    } catch {
      // Ignore localStorage read errors
    }
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
      } catch {
        // Ignore localStorage write errors
      }
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
      } catch {
        // Ignore localStorage write errors
      }
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
      } catch {
        // Ignore localStorage removal errors
      }
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
  companyId?: string;
  search?: string;
  department?: string;
  employmentType?: string;
  experienceLevel?: string;
  limit?: number;
}

export const publicJobsApi = {
  /**
   * Retrieves active jobs publicly without requiring authentication.
   * Supports filtering strictly by companyId: GET /api/public/jobs?companyId=...
   */
  async getJobs(params: PublicJobsFilterParams = {}): Promise<JobDto[]> {
    const query = new URLSearchParams();
    if (params.companyId) query.append('companyId', params.companyId);
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
  totalCandidatesCount?: number;
  candidatesThisWeekCount?: number;
  aiScreenedCount?: number;
  aiShortlistedCount?: number;
  shortlistedCount?: number;
  pendingInterviewsCount?: number;
  pendingAiEvaluationsCount?: number;
  topTalentMatches?: TopTalentMatchDto[];
  vacancyMetrics?: OverviewVacancyDto[];
  recentAiActivity?: RecentAiActivityDto | null;
  recentVacancies: JobDto[];
}

export interface TopTalentMatchDto {
  candidateId: string;
  candidateName: string;
  headline?: string | null;
  jobId: string;
  jobTitle: string;
  matchPercentage: number;
  evaluatedAt: string;
}

export interface OverviewVacancyDto {
  jobId: string;
  title: string;
  department: string;
  status: string;
  applicantsCount: number;
  aiScreenedCount: number;
}

export interface RecentAiActivityDto {
  jobId: string;
  jobTitle: string;
  matchPercentage: number;
  occurredAt: string;
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

// ==========================================
// CANDIDATE DIGITAL CV & PROFILE API METHODS
// ==========================================
export interface ExperienceDto {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  createdAt: string;
}

export interface CreateExperiencePayload {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface EducationDto {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear?: string;
  description?: string;
  createdAt: string;
}

export interface CreateEducationPayload {
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear?: string;
  description?: string;
}

export interface ProjectDto {
  id: string;
  projectName: string;
  role?: string;
  description?: string;
  link?: string;
  liveUrl?: string;
  createdAt: string;
}

export interface CreateProjectPayload {
  projectName: string;
  role?: string;
  description?: string;
  link?: string;
  liveUrl?: string;
}

export interface SkillDto {
  id: string;
  skillName: string;
  category?: string;
  createdAt: string;
}

export interface CreateSkillPayload {
  skillName: string;
  category?: string;
}

export interface CandidateHighlightDto {
  category: string;
  value: string;
  subtext?: string;
}

export interface CandidateAboutDto {
  summary?: string;
  keyHighlights: CandidateHighlightDto[];
}

export interface UpdateCandidateAboutPayload {
  summary?: string;
  keyHighlights?: CandidateHighlightDto[];
}

export interface CertificationDto {
  id: string;
  title: string;
  issuingOrganization: string;
  issueDate?: string;
  credentialUrl?: string;
  createdAt?: string;
}

export interface CreateCertificationPayload {
  title: string;
  issuingOrganization: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface CandidateCvDto {
  summary?: string;
  keyHighlights?: CandidateHighlightDto[];
  experiences: ExperienceDto[];
  educations: EducationDto[];
  projects: ProjectDto[];
  skills: SkillDto[];
  certifications: CertificationDto[];
}

export interface CandidateProfileResponseDto {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  headline?: string;
  phone?: string;
  location?: string;
  experience?: string;
  availability?: string;
  avatarUrl?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  summary?: string;
  keyHighlights: CandidateHighlightDto[];
  experiences: ExperienceDto[];
  educations: EducationDto[];
  projects: ProjectDto[];
  skills: SkillDto[];
  certifications: CertificationDto[];
}

export const candidateCvApi = {
  /**
   * Retrieves unified full profile and digital CV for the authenticated candidate.
   * Calls: GET /api/candidate/profile
   */
  async getProfile(): Promise<CandidateProfileResponseDto> {
    return request<CandidateProfileResponseDto>('/candidate/profile', {
      method: 'GET'
    });
  },

  /**
   * Retrieves full aggregated Digital CV for the authenticated candidate.
   * Calls: GET /api/candidate/cv
   */
  async getCv(): Promise<CandidateCvDto> {
    return request<CandidateCvDto>('/candidate/cv', {
      method: 'GET'
    });
  },

  /**
   * Retrieves the candidate's executive summary and key highlights.
   * Calls: GET /api/candidate/about
   */
  async getAbout(): Promise<CandidateAboutDto> {
    return request<CandidateAboutDto>('/candidate/about', {
      method: 'GET'
    });
  },

  /**
   * Updates the candidate's executive summary and key highlights.
   * Calls: PUT /api/candidate/about
   */
  async updateAbout(payload: UpdateCandidateAboutPayload): Promise<CandidateAboutDto> {
    return request<CandidateAboutDto>('/candidate/about', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Adds a new experience entry.
   * Calls: POST /api/candidate/experience
   */
  async addExperience(payload: CreateExperiencePayload): Promise<ExperienceDto> {
    return request<ExperienceDto>('/candidate/experience', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Updates an existing experience entry.
   * Calls: PUT /api/candidate/experience/{id}
   */
  async updateExperience(id: string, payload: CreateExperiencePayload): Promise<ExperienceDto> {
    return request<ExperienceDto>(`/candidate/experience/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Deletes an experience entry.
   * Calls: DELETE /api/candidate/experience/{id}
   */
  async deleteExperience(id: string): Promise<void> {
    return request<void>(`/candidate/experience/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Adds a new education entry.
   * Calls: POST /api/candidate/education
   */
  async addEducation(payload: CreateEducationPayload): Promise<EducationDto> {
    return request<EducationDto>('/candidate/education', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Updates an existing education entry.
   * Calls: PUT /api/candidate/education/{id}
   */
  async updateEducation(id: string, payload: CreateEducationPayload): Promise<EducationDto> {
    return request<EducationDto>(`/candidate/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Deletes an education entry.
   * Calls: DELETE /api/candidate/education/{id}
   */
  async deleteEducation(id: string): Promise<void> {
    return request<void>(`/candidate/education/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Adds a new project entry.
   * Calls: POST /api/candidate/project
   */
  async addProject(payload: CreateProjectPayload): Promise<ProjectDto> {
    return request<ProjectDto>('/candidate/project', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Updates an existing project entry.
   * Calls: PUT /api/candidate/project/{id}
   */
  async updateProject(id: string, payload: CreateProjectPayload): Promise<ProjectDto> {
    return request<ProjectDto>(`/candidate/project/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Deletes a project entry.
   * Calls: DELETE /api/candidate/project/{id}
   */
  async deleteProject(id: string): Promise<void> {
    return request<void>(`/candidate/project/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Adds a new skill entry.
   * Calls: POST /api/candidate/skill
   */
  async addSkill(payload: CreateSkillPayload): Promise<SkillDto> {
    return request<SkillDto>('/candidate/skill', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Deletes a skill entry.
   * Calls: DELETE /api/candidate/skill/{id}
   */
  async deleteSkill(id: string): Promise<void> {
    return request<void>(`/candidate/skill/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Retrieves all certification entries.
   * Calls: GET /api/candidate/certification
   */
  async getCertifications(): Promise<CertificationDto[]> {
    return request<CertificationDto[]>('/candidate/certification', {
      method: 'GET'
    });
  },

  /**
   * Adds a new certification entry.
   * Calls: POST /api/candidate/certification
   */
  async addCertification(payload: CreateCertificationPayload): Promise<CertificationDto> {
    return request<CertificationDto>('/candidate/certification', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Updates an existing certification entry.
   * Calls: PUT /api/candidate/certification/{id}
   */
  async updateCertification(id: string, payload: CreateCertificationPayload): Promise<CertificationDto> {
    return request<CertificationDto>(`/candidate/certification/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Deletes a certification entry.
   * Calls: DELETE /api/candidate/certification/{id}
   */
  async deleteCertification(id: string): Promise<void> {
    return request<void>(`/candidate/certification/${id}`, {
      method: 'DELETE'
    });
  }
};

// ==========================================
// JOB APPLICATIONS & EMPLOYER REVIEW API
// ==========================================

export interface JobApplicantDto {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateHeadline?: string;
  candidateAvatarUrl?: string;
  candidateLocation?: string;
  candidatePhone?: string;
  appliedDate: string;
  status: string;
  skills: string[];
  aiMatchScore?: number | null;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  projects: number;
  education: number;
  certifications: number;
}

export interface ScreenedApplicantDto {
  applicationId: string;
  candidateId: string;
  fullName: string;
  email: string;
  headline?: string;
  location?: string;
  phone?: string;
  skills: string[];
  appliedDate: string;
  status: string;
  aiMatchScore: number | null;
  /** Per-category score breakdown. Present only after AI screening has run. */
  scoreBreakdown?: ScoreBreakdown | null;
}

export interface ApplicationStatusDto {
  hasApplied: boolean;
  appliedDate?: string | null;
  status?: string | null;
  applicationId?: string | null;
}

export interface CandidateApplicationItemDto {
  id: string;
  applicationId?: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  employmentType: string;
  workplaceType: string;
  appliedDate: string;
  status: string;
}

export interface SavedJobDto {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string | null;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string | null;
  postedAt: string;
  savedAt: string;
}

export const savedJobsApi = {
  getAll(): Promise<SavedJobDto[]> {
    return request<SavedJobDto[]>('/candidate/saved-jobs', { method: 'GET' });
  },

  getIds(): Promise<string[]> {
    return request<string[]>('/candidate/saved-jobs/ids', { method: 'GET' });
  },

  save(jobId: string): Promise<{ message: string; jobId: string }> {
    return request(`/candidate/saved-jobs/${jobId}`, { method: 'PUT' });
  },

  remove(jobId: string): Promise<null> {
    return request<null>(`/candidate/saved-jobs/${jobId}`, { method: 'DELETE' });
  },
};



export const jobApplicationsApi = {
  /**
   * Submits a candidate's digital CV application for a job.
   * Calls: POST /api/jobs/{jobId}/apply
   */
  async apply(jobId: string): Promise<{ message: string; applicationId: string; appliedDate: string }> {
    return request<{ message: string; applicationId: string; appliedDate: string }>(`/jobs/${jobId}/apply`, {
      method: 'POST',
    });
  },

  /**
   * Checks whether the current candidate has already applied to a job.
   * Calls: GET /api/jobs/{jobId}/application-status
   */
  async getStatus(jobId: string): Promise<ApplicationStatusDto> {
    return request<ApplicationStatusDto>(`/jobs/${jobId}/application-status`, {
      method: 'GET',
    });
  },

  /**
   * Retrieves all applicants for a company's job vacancy.
   * Calls: GET /api/jobs/{jobId}/applications
   */
  async getJobApplicants(jobId: string): Promise<JobApplicantDto[]> {
    try {
      return await request<JobApplicantDto[]>(`/jobs/${jobId}/applications`, {
        method: 'GET',
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string } | undefined;
      if (errorObj?.message?.includes('404')) {
        return [];
      }
      throw err;
    }
  },

  async runAiScreen(
    jobId: string,
    options?: { forceRefresh?: boolean },
  ): Promise<ScreenedApplicantDto[]> {
    const qs = options?.forceRefresh ? '?forceRefresh=true' : '';
    return request<ScreenedApplicantDto[]>(`/jobs/${jobId}/run-ai-screen${qs}`, {
      method: 'POST',
    }, 120_000);
  },

  async getRankedApplicants(jobId: string): Promise<ScreenedApplicantDto[]> {
    return request<ScreenedApplicantDto[]>(`/jobs/${jobId}/applicants`, {
      method: 'GET',
    }, 120_000);
  },

  async moveToShortlist(jobId: string, candidateIds: string[]): Promise<{
    message: string;
    updatedCount: number;
  }> {
    return request(`/jobs/${jobId}/move-to-shortlist`, {
      method: 'POST',
      body: JSON.stringify(candidateIds),
    });
  },

  async removeFromShortlist(jobId: string, candidateIds: string[]): Promise<{
    message: string;
    updatedCount: number;
  }> {
    return request(`/jobs/${jobId}/remove-from-shortlist`, {
      method: 'POST',
      body: JSON.stringify(candidateIds),
    });
  },

  async rejectApplicant(jobId: string, candidateIds: string[]): Promise<{
    message: string;
    updatedCount: number;
  }> {
    return request(`/jobs/${jobId}/reject-applicant`, {
      method: 'POST',
      body: JSON.stringify(candidateIds),
    });
  },

  /**
   * Returns all shortlisted candidates for a job from the dedicated pipeline endpoint.
   * Calls: GET /api/jobs/{jobId}/shortlisted
   */
  async getShortlisted(jobId: string): Promise<ShortlistedApplicantDto[]> {
    try {
      return await request<ShortlistedApplicantDto[]>(`/jobs/${jobId}/shortlisted`, {
        method: 'GET',
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string } | undefined;
      if (errorObj?.message?.includes('404')) return [];
      throw err;
    }
  },

  /**
   * Retrieves all applications submitted by the logged-in candidate.
   * Calls: GET /api/candidate/applications
   */
  async getMyApplications(): Promise<CandidateApplicationItemDto[]> {
    return request<CandidateApplicationItemDto[]>('/candidate/applications', {
      method: 'GET',
    });
  },

  /**
   * Fetches complete read-only Digital CV profile of a candidate for an employer.
   * Calls: GET /api/employers/candidates/{candidateId}/profile
   */
  async getCandidateProfileForEmployer(candidateId: string): Promise<CandidateProfileResponseDto> {
    return request<CandidateProfileResponseDto>(`/employers/candidates/${candidateId}/profile`, {
      method: 'GET',
    });
  }
};



export interface ShortlistedApplicantDto {
  applicationId: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone?: string;
  headline?: string;
  location: string;
  avatarUrl?: string;
  skills: string[];
  appliedDate: string;
  shortlistedAt?: string;
  aiMatchScore?: number;
  assessmentStatus?: 'None' | 'Sent' | 'Completed';
}



// ==========================================
// TECHNICAL ASSESSMENT ENGINE (STUDENT 4)
// ==========================================

export interface TestCaseDto {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface CodingQuestionItemDto {
  id: string;
  title: string;
  problemStatement: string;
  language: string;
  difficulty: string;
  starterCode: string;
  solutionCode?: string;
  sampleTestCases: TestCaseDto[];
  hiddenTestCases?: TestCaseDto[];
  points: number;
  order: number;
}

export interface CandidateCodingQuestionDto {
  id: string;
  title: string;
  problemStatement: string;
  language: string;
  difficulty: string;
  starterCode: string;
  sampleTestCases: TestCaseDto[];
  points: number;
  order: number;
}

export interface AssessmentResponseDto {
  id: string;
  jobVacancyId: string;
  title: string;
  generatedQuestions: CodingQuestionItemDto[];
  finalQuestions: CodingQuestionItemDto[];
  passingThreshold: number;
  timeLimitMinutes: number;
  createdBy: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  totalSubmissions: number;
  hasActiveCandidateExam?: boolean;
  hasSuspendedCandidateExam?: boolean;
  canEdit?: boolean;
}

export interface AssessmentTrackSummaryDto {
  id: string;
  title: string;
  timeLimitMinutes: number;
  questionCount: number;
  passingThreshold: number;
  status: string;
  expiresAt?: string | null;
}

export interface CreateAssessmentManualPayload {
  jobVacancyId: string;
  title: string;
  passingThreshold?: number;
  timeLimitMinutes?: number;
  questions: CodingQuestionItemDto[];
  publishImmediately?: boolean;
  expiresAt?: string | null;
}

export interface UpdateAssessmentPayload {
  title: string;
  passingThreshold: number;
  timeLimitMinutes: number;
  finalQuestions: CodingQuestionItemDto[];
  expiresAt?: string | null;
}

export interface DispatchAssessmentPayload {
  assessmentId: string;
  candidateId: string;
  applicationId: string;
  jobVacancyId: string;
  cvMatchScore: number;
}

export interface DispatchAssessmentResponseDto {
  submissionId: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateId: string;
  candidateEmail: string;
  testLink: string;
  expiresInHours: number;
  status: string;
  message: string;
}

export interface StartExamResponseDto {
  submissionId: string;
  assessmentId: string;
  assessmentTitle: string;
  timeLimitMinutes: number;
  startedAt?: string | null;
  status?: string;
  remainingSeconds?: number | null;
  draftAnswers?: SubmittedAnswerItemDto[] | null;
  questions: CandidateCodingQuestionDto[];
}

export interface TestCaseEvaluationItemDto {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
  errorMessage?: string;
}

export interface SubmittedAnswerItemDto {
  questionId: string;
  submittedCode: string;
  language: string;
  testCasesPassed?: number;
  totalTestCases?: number;
  score?: number;
  testCaseResults?: TestCaseEvaluationItemDto[];
}

export interface RunCodePayload {
  questionId: string;
  code: string;
  language?: string;
  customInput?: string;
}

export interface RunCodeResponseDto {
  stdout: string;
  stderr: string;
  exitCode: number;
  compileOutput?: string;
  isRateLimited: boolean;
  isError: boolean;
  errorMessage?: string;
  executionTimeMs: number;
  sampleInputUsed?: string;
  expectedOutput?: string;
  samplePassed?: boolean;
}

export interface SubmitAnswersPayload {
  answers: SubmittedAnswerItemDto[];
}

export interface SaveDraftPayload {
  remainingSeconds?: number;
  answers: SubmittedAnswerItemDto[];
}

export interface ProctorEventPayload {
  eventType: string; // 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT'
  timestamp: string;
  details?: string;
}

export interface ProctorSummaryDto {
  tabSwitches: number;
  windowBlurs: number;
  events: ProctorEventPayload[];
}

export interface SubmissionDetailDto {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  applicationId: string;
  jobVacancyId: string;
  jobTitle?: string;
  department?: string;
  examScore: number;
  cvScore: number;
  finalWeightedScore: number;
  passingThreshold: number;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  gradedAt?: string;
  answers: SubmittedAnswerItemDto[];
  proctorSummary: ProctorSummaryDto;
  isSelectedForInterview?: boolean;
  reviewerFeedback?: string;
  scheduledEventId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledMeetingMode?: string;
  scheduledLocation?: string;
}

export interface LeaderboardEntryDto {
  rank: number;
  submissionId: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  cvScore: number;
  examScore: number;
  finalWeightedScore: number;
  submissionStatus: string;
  applicationStatus: string;
  proctorTabSwitches: number;
  isTop5: boolean;
  isPassed: boolean;
  isSelectedForInterview?: boolean;
  submittedAt?: string;
}

export interface Student3OutgoingCandidateDto {
  applicationId: string;
  candidateId: string;
  jobVacancyId: string;
  finalWeightedScore: number;
  hrManagerId: string;
}

export interface FinalizeTop5ResponseDto {
  jobVacancyId: string;
  totalSubmissions: number;
  passedCount: number;
  top5PromotedCount: number;
  rejectedCount: number;
  outgoingTop5Payload: Student3OutgoingCandidateDto[];
  message: string;
}

export interface QuestionReviewItemDto {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  notes?: string;
}

export interface ManualReviewSubmissionPayload {
  examScore: number;
  isSelectedForInterview: boolean;
  reviewerFeedback?: string;
  questionReviews?: QuestionReviewItemDto[];
}

export interface CandidateAssessmentListItemDto {
  submissionId: string;
  assessmentId: string;
  assessmentTitle: string;
  jobVacancyId: string;
  jobTitle: string;
  companyName: string;
  department: string;
  timeLimitMinutes: number;
  questionCount: number;
  passingThreshold: number;
  status: string;
  examScore: number;
  finalWeightedScore: number;
  isPassed: boolean;
  isSelectedForInterview?: boolean;
  reviewerFeedback?: string;
  assignedAt: string;
  startedAt?: string;
  submittedAt?: string;
  expiresAt?: string | null;
  isExpired?: boolean;
  isBlocked?: boolean;
}

export const assessmentsApi = {
  getMyAssessments: () =>
    request<CandidateAssessmentListItemDto[]>('/Assessments/candidate/my-assessments'),

  getCandidateAssessments: (candidateId: string) =>
    request<CandidateAssessmentListItemDto[]>(`/Assessments/candidate/${candidateId}`),

  getSubmissionsByJob: (jobVacancyId: string) =>
    request<SubmissionDetailDto[]>(`/Assessments/job/${jobVacancyId}/submissions`),

  getInterviewSelections: (jobVacancyId?: string) => {
    const params = jobVacancyId ? `?jobVacancyId=${encodeURIComponent(jobVacancyId)}` : '';
    return request<SubmissionDetailDto[]>(`/Assessments/interview-selections${params}`);
  },

  reviewSubmission: (submissionId: string, payload: ManualReviewSubmissionPayload) =>
    request<SubmissionDetailDto>(`/Assessments/submissions/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTracksByJob: (jobVacancyId: string) =>
    request<AssessmentTrackSummaryDto[]>(`/Assessments/job/${jobVacancyId}/tracks`),

  getAssessmentsByJob: (jobVacancyId: string) =>
    request<AssessmentResponseDto[]>(`/Assessments/job/${jobVacancyId}`),

  getById: (id: string) =>
    request<AssessmentResponseDto>(`/Assessments/${id}`),

  createManual: (payload: CreateAssessmentManualPayload) =>
    request<AssessmentResponseDto>('/Assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateAi: (jobVacancyId: string, payload?: { focusArea?: string; difficulty?: string }) =>
    request<AssessmentResponseDto>(`/Assessments/job/${jobVacancyId}/generate-ai`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }, 120_000 /* 2-min timeout — AI agent generates challenge, starter stub & test cases */),

  update: (id: string, payload: UpdateAssessmentPayload) =>
    request<AssessmentResponseDto>(`/Assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  publish: (id: string) =>
    request<AssessmentResponseDto>(`/Assessments/${id}/publish`, {
      method: 'POST',
    }),

  archive: (id: string) =>
    request<AssessmentResponseDto>(`/Assessments/${id}/archive`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    request<void>(`/Assessments/${id}`, {
      method: 'DELETE',
    }),

  dispatch: (payload: DispatchAssessmentPayload) =>
    request<DispatchAssessmentResponseDto>('/Assessments/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getExamPaper: (submissionId: string) =>
    request<StartExamResponseDto>(`/Assessments/take/${submissionId}`),

  startExam: (submissionId: string) =>
    request<StartExamResponseDto>(`/Assessments/take/${submissionId}/start`, {
      method: 'POST',
    }),

  logProctorEvent: (submissionId: string, event: ProctorEventPayload) =>
    request<{ success: boolean }>(`/Assessments/take/${submissionId}/proctor-event`, {
      method: 'POST',
      body: JSON.stringify(event),
    }),

  runCode: (submissionId: string, payload: RunCodePayload) =>
    request<RunCodeResponseDto>(`/Assessments/take/${submissionId}/run`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 45_000 /* 45s timeout for Judge0 remote sandbox compilation & execution */),

  submitExam: (submissionId: string, payload: SubmitAnswersPayload) =>
    request<SubmissionDetailDto>(`/Assessments/take/${submissionId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 60_000 /* 60s timeout for complete test suite grading */),

  saveDraft: (submissionId: string, payload: SaveDraftPayload) =>
    request<{ success: boolean }>(`/Assessments/take/${submissionId}/draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  blockAssessment: (submissionId: string) =>
    request<{ success: boolean; message?: string }>(`/Assessments/take/${submissionId}/block`, {
      method: 'POST',
    }),

  getSubmissionDetail: (submissionId: string) =>
    request<SubmissionDetailDto>(`/Assessments/submissions/${submissionId}`),

  deleteSubmission: (submissionId: string) =>
    request<void>(`/Assessments/submissions/${submissionId}`, {
      method: 'DELETE',
    }),

  getLeaderboard: (jobVacancyId: string) =>
    request<LeaderboardEntryDto[]>(`/Assessments/job/${jobVacancyId}/leaderboard`),

  finalizeTop5: (jobVacancyId: string) =>
    request<FinalizeTop5ResponseDto>(`/Assessments/job/${jobVacancyId}/finalize-top5`, {
      method: 'POST',
    }),
};

// ============================================================
// CV EVALUATION API — Agentic Multi-Agent Pipeline Integration
// ============================================================

// ── TypeScript interfaces matching C# DTOs exactly ──────────────────────────

/**
 * Request payload for POST /api/CVEvaluation/analyze
 * Triggers the three-agent pipeline: Extractor → Evaluator → Validator
 */
export interface AnalyzeCvRequestDto {
  /** The candidate's User ID whose CV will be evaluated */
  candidateId: string;
  /** The job vacancy ID to evaluate the CV against */
  jobId: string;
  /** The specific application ID linking candidate to this vacancy */
  applicationId?: string | null;
  /** When true, forces a fresh AI run even if a cached result exists within 24h */
  forceRefresh?: boolean;
}

/**
 * Response from POST /api/CVEvaluation/analyze
 * Binds directly to the Candidate Evaluation Dashboard Report UI.
 */
export interface CvEvaluationResultDto {
  /** Unique ID of the persisted evaluation record — used to call /{id}/approve */
  id: string;
  candidateId: string;
  jobId: string;
  /** Overall match score 0–100 from AgentEvaluator.EvaluateMatch() */
  matchScore: number;
  /** Candidate strengths for green chip list display */
  strengths: string[];
  /** Skill gaps for red chip list display */
  missingSkills: string[];
  /** Free-text AI recommendation for the report banner */
  recommendation: string | null;
  /** Validation warnings from AgentValidator.ValidateBusinessRules() */
  validationNotes: string[];
  /** Current approval status: "Pending" | "Approved" | "Rejected" */
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

/**
 * Request payload for POST /api/CVEvaluation/{id}/approve
 * Finalises the Human-in-the-Loop approval gate.
 */
export interface ApproveEvaluationRequestDto {
  /** "Approved" or "Rejected" */
  decision: 'Approved' | 'Rejected';
  /** Optional notes from the recruiter */
  reviewerNotes?: string;
}

/**
 * Response from POST /api/CVEvaluation/{id}/approve
 */
export interface ApproveEvaluationResponseDto {
  evaluationId: string;
  candidateId: string;
  approvalStatus: string;
  approvedAt: string;
  message: string;
}

// ── API Client ────────────────────────────────────────────────────────────────

export const cvEvaluationApi = {
  /**
   * POST /api/CVEvaluation/analyze
   *
   * Runs the three-agent pipeline on the given candidate/job pair.
   * Bind the onClick of the "Run AI CV Evaluation" button to this method.
   *
   * @example
   *   const result = await cvEvaluationApi.analyze({
   *     candidateId: candidate.candidateId,
   *     jobId: selectedJob.id,
   *     applicationId: candidate.id,
   *   });
   *   setEvaluationResult(result);
   */
  analyze: (payload: AnalyzeCvRequestDto) =>
    request<CvEvaluationResultDto>('/CVEvaluation/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 120_000 /* 2-min timeout — AI pipeline can take up to ~90s */),

  /**
   * POST /api/CVEvaluation/{id}/approve
   *
   * Submits the human recruiter's approval decision.
   * Bind the onClick of the "Approve & Shortlist" button to this method.
   *
   * @example
   *   await cvEvaluationApi.approve(evaluationResult.id, { decision: 'Approved' });
   */
  approve: (evaluationId: string, payload: ApproveEvaluationRequestDto) =>
    request<ApproveEvaluationResponseDto>(`/CVEvaluation/${evaluationId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * GET /api/CVEvaluation/{id}
   * Fetches a specific evaluation result by its persisted ID.
   */
  getById: (evaluationId: string) =>
    request<CvEvaluationResultDto>(`/CVEvaluation/${evaluationId}`),

  /**
   * GET /api/CVEvaluation/latest?candidateId=...&jobId=...
   * Fetches the latest cached evaluation for a candidate/job pair.
   * Use this on component mount to pre-populate the report if it already exists.
   */
  getLatest: (candidateId: string, jobId: string) =>
    request<CvEvaluationResultDto>(
      `/CVEvaluation/latest?candidateId=${candidateId}&jobId=${jobId}`
    ),
};

// ── Student 1: AI Interview Preparation Guide ────────────────────────────────

export interface GenerateInterviewPrepRequestDto {
  candidateId?: string;
  applicationId?: string;
  jobId?: string;
  jobTitle?: string;
  targetRole?: string;
  jobDescription: string;
  experienceLevel?: string;
  forceRegenerate?: boolean;
}

export interface StudyFocusAreaDto {
  id: string;
  title: string;
  section: string;
  priority: 'High Priority' | 'Core Requirement' | 'Practical Focus' | string;
  estimatedStudyTime: string;
  overview: string;
  conceptsToReview: string[];
  practicalApplication: string;
  coachTip: string;
}

export interface StarGuidanceDto {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface BehavioralQuestionDto {
  id: string;
  question: string;
  competency: string;
  starGuidance: StarGuidanceDto;
  whatToAvoid: string;
}

export interface InterviewQuestionDto {
  id: string;
  question: string;
  category: string;
  difficulty: 'Junior' | 'Mid-Level' | 'Senior' | string;
  expectedAnswerGuideline: string;
  sampleAnswer?: string;
  keyEvaluationPoints: string[];
  proTip?: string;
}

export interface InterviewPrepGuideDto {
  id: string;
  guideId?: string;
  candidateId: string;
  applicationId?: string;
  jobId?: string;
  jobTitle: string;
  targetRole: string;
  companyName?: string;
  location?: string;
  employmentType?: string;
  applicationStatus?: string;
  appliedDate?: string;
  interviewDate?: string;
  jobDescription: string;
  roleOverviewSummary: string;
  keyTheoreticalAreas: StudyFocusAreaDto[];
  technicalCoreConcepts: StudyFocusAreaDto[];
  practicalImplementationFocus: StudyFocusAreaDto[];
  proTips: string[];
  preparationChecklist: string[];
  technicalQuestions?: InterviewQuestionDto[];
  behavioralQuestions?: BehavioralQuestionDto[];
  createdAt: string;
}

export interface InterviewPrepEligibilityDto {
  isEligible: boolean;
  applicationStatus: string;
  message: string;
}

export interface GenerateInterviewPrepResponseDto {
  guideId: string;
  id: string;
  message: string;
  guide?: InterviewPrepGuideDto;
}

export const interviewPrepApi = {
  /**
   * POST /api/interviewprep/generate
   * Generates a tailored AI Interview Preparation Guide, saves to DB, and returns guideId.
   */
  generate: (payload: GenerateInterviewPrepRequestDto) =>
    request<GenerateInterviewPrepResponseDto>('/interviewprep/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 120_000 /* 2-min timeout matching backend */),

  /**
   * GET /api/interviewprep/{id}
   * Fetches the saved guide from the database for the Study Dashboard.
   */
  getById: (guideId: string) =>
    request<InterviewPrepGuideDto>(`/interviewprep/${guideId}`),

  /**
   * GET /api/interviewprep/eligibility
   * Checks if candidate is eligible to access interview prep.
   */
  checkEligibility: (applicationId?: string, jobId?: string) => {
    const params = new URLSearchParams();
    if (applicationId) params.append('applicationId', applicationId);
    if (jobId) params.append('jobId', jobId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<InterviewPrepEligibilityDto>(`/interviewprep/eligibility${query}`);
  },

  /**
   * GET /api/interviewprep/latest
   * Retrieves the candidate's most recent preparation guide.
   */
  getLatest: (jobId?: string) =>
    request<InterviewPrepGuideDto>(
      jobId ? `/interviewprep/latest?jobId=${jobId}` : '/interviewprep/latest'
    ),

  /**
   * GET /api/interviewprep/my-guides
   * Retrieves all interview preparation guides for the current candidate.
   */
  getAll: () =>
    request<InterviewPrepGuideDto[]>('/interviewprep/my-guides'),

  /**
   * DELETE /api/interviewprep/{id}
   * Deletes a saved interview preparation guide.
   */
  deleteGuide: (guideId: string) =>
    request<void>(`/interviewprep/${guideId}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// 15. MONTHLY PLANNER (INTERVIEW SCHEDULING CALENDAR) API
// ============================================================================

export interface EventResponseDto {
  id: string;
  title: string;
  description?: string | null;
  eventDate: string; // "YYYY-MM-DD"
  eventTime: string; // e.g. "14:30" or "02:30 PM"
  createdBy: string;
  creatorName?: string | null;
  jobVacancyId?: string | null;
  jobVacancyTitle?: string | null;
  department?: string | null;
  createdAt: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  eventDate: string; // "YYYY-MM-DD"
  eventTime: string; // "HH:mm"
  jobVacancyId?: string;
  department?: string;
}

export interface NationalHolidayDto {
  id: string;
  title: string;
  description: string;
  date: string; // "YYYY-MM-DD"
  country: string;
  countryCode: string;
}

export const eventsApi = {
  /**
   * GET /api/Events
   * Retrieves events for the HR manager's company, optionally filtered by department, month/year or date range.
   */
  getEvents: (params?: { year?: number; month?: number; startDate?: string; endDate?: string; department?: string }) => {
    const q = new URLSearchParams();
    if (params?.year) q.append('year', params.year.toString());
    if (params?.month) q.append('month', params.month.toString());
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.department) q.append('department', params.department);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request<EventResponseDto[]>(`/Events${queryString}`);
  },

  /**
   * GET /api/Events/departments
   * Retrieves departments that currently have at least one active job vacancy.
   */
  getActiveDepartments: () => request<string[]>('/Events/departments'),

  /**
   * GET /api/Events/holidays
   * Retrieves national and public holidays for the specified country and month/year from ASP.NET Core backend.
   */
  getHolidays: (params?: { year?: number; month?: number; country?: string }) => {
    const q = new URLSearchParams();
    if (params?.year) q.append('year', params.year.toString());
    if (params?.month) q.append('month', params.month.toString());
    if (params?.country) q.append('country', params.country);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request<NationalHolidayDto[]>(`/Events/holidays${queryString}`);
  },

  /**
   * GET /api/Events/{id}
   * Retrieves a single event by ID.
   */
  getById: (id: string) => request<EventResponseDto>(`/Events/${id}`),

  /**
   * POST /api/Events
   * Creates a new event on the Monthly Planner.
   */
  create: (payload: CreateEventPayload) =>
    request<EventResponseDto>('/Events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * PUT /api/Events/{id}
   * Updates an existing event on the Monthly Planner.
   */
  update: (id: string, payload: CreateEventPayload) =>
    request<EventResponseDto>(`/Events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  /**
   * DELETE /api/Events/{id}
   * Deletes an event by ID.
   */
  delete: (id: string) =>
    request<void>(`/Events/${id}`, {
      method: 'DELETE',
    }),

  /**
   * POST /api/Events/generate-interview-schedule
   * Generates clash-free draft interview schedule proposal using AI Agent.
   */
  generateInterviewSchedule: (payload: GenerateScheduleRequestDto) =>
    request<ScheduleProposalResponseDto>('/Events/generate-interview-schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * POST /api/Events/confirm-interview-schedule
   * Persists approved interview slots to database (Human-in-the-loop).
   */
  confirmInterviewSchedule: (payload: ConfirmInterviewScheduleDto) =>
    request<ConfirmInterviewScheduleResultDto>('/Events/confirm-interview-schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * GET /api/Events/my-interviews
   * Retrieves scheduled interviews for the authenticated candidate.
   */
  getMyInterviews: () =>
    request<CandidateInterviewDto[]>('/Events/my-interviews'),

  /**
   * POST /api/Events/schedule-candidate-interview
   * Manually schedules or reschedules a candidate interview from Interview Selection.
   */
  scheduleCandidateInterview: (payload: {
    candidateId: string;
    jobVacancyId: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    meetingMode: 'Online' | 'Physical';
    location: string;
    notes?: string;
    existingEventId?: string;
  }) =>
    request<EventResponseDto>('/Events/schedule-candidate-interview', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export interface GenerateScheduleRequestDto {
  jobVacancyId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  interviewDurationMinutes?: number;
  parallelTracks?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  bufferMinutes?: number;
}

export interface ProposedSlotDto {
  slotId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  trackNumber: number;
  trackName: string;
  isExtendedSearch: boolean;
}

export interface UnscheduledCandidateDto {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  reason: string;
}

export interface ScheduleSummaryDto {
  totalCandidates: number;
  scheduledCount: number;
  unscheduledCount: number;
  originalDateRange: string;
  effectiveDateRange: string;
  forwardDaysExtended: number;
  tracksUtilized: number;
  assumptionsMade: string[];
  aiValidationNotes: string[];
}

export interface ScheduleProposalResponseDto {
  jobVacancyId: string;
  jobTitle: string;
  proposedSlots: ProposedSlotDto[];
  unscheduledCandidates: UnscheduledCandidateDto[];
  summary: ScheduleSummaryDto;
  isDraft: boolean;
}

export interface ConfirmedSlotItemDto {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  trackNumber: number;
  trackName: string;
  meetingMode?: string; // "Online" | "Physical"
  location?: string; // Meeting link or venue
}

export interface ConfirmInterviewScheduleDto {
  jobVacancyId: string;
  jobTitle: string;
  slots: ConfirmedSlotItemDto[];
}

export interface ConfirmInterviewScheduleResultDto {
  scheduledCount: number;
  message: string;
  createdEventIds: string[];
}

export interface CandidateInterviewDto {
  id: string;
  title: string;
  jobVacancyId?: string;
  jobTitle?: string;
  companyName?: string;
  department?: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // e.g. "10:00 - 10:30"
  meetingMode: string; // "Online" or "Physical"
  location?: string;
  description?: string;
  status: string; // "Upcoming" | "Completed"
  createdAt: string;
}

