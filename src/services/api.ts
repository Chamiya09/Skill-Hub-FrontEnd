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
  timeoutMs = 10000,
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
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
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
    const user = authStorage.getUser();
    const companyId = user?.companyId || user?.id || '';

    // Attempt backend sync directly from PostgreSQL database
    try {
      const me = await companyAuthApi.getMe();
      const combined: CompanyProfileDto = {
        id: me.companyId || me.id || companyId,
        companyName: me.companyName || user?.companyName || '',
        adminName: me.adminName || me.fullName || (user as any)?.adminName || user?.fullName || '',
        contactEmail: me.contactEmail || me.email || (user as any)?.contactEmail || user?.email || '',
        phone: me.phone || (user as any)?.phone || '',
        companySize: me.companySize || (user as any)?.companySize || '',
        foundedYear: me.foundedYear || (user as any)?.foundedYear || '',
        logoUrl: me.logoUrl || (user as any)?.logoUrl || '',
        website: me.website || (user as any)?.website || '',
        linkedinUrl: me.linkedinUrl || (user as any)?.linkedinUrl || '',
        twitterUrl: me.twitterUrl || (user as any)?.twitterUrl || '',
        githubUrl: me.githubUrl || (user as any)?.githubUrl || '',
        location: me.location || (user as any)?.location || '',
        industry: me.industry || (user as any)?.industry || '',
        about: me.about || (user as any)?.about || '',
        createdAt: me.createdAt || user?.createdAt || new Date().toISOString(),
        updatedAt: me.updatedAt || user?.updatedAt || new Date().toISOString(),
      };
      return combined;
    } catch {
      // Fallback from cached authenticated user session
      return {
        id: companyId,
        companyName: user?.companyName || '',
        adminName: (user as any)?.adminName || user?.fullName || '',
        contactEmail: (user as any)?.contactEmail || user?.email || '',
        phone: (user as any)?.phone || '',
        companySize: (user as any)?.companySize || '',
        foundedYear: (user as any)?.foundedYear || '',
        logoUrl: (user as any)?.logoUrl || '',
        website: (user as any)?.website || '',
        linkedinUrl: (user as any)?.linkedinUrl || '',
        twitterUrl: (user as any)?.twitterUrl || '',
        githubUrl: (user as any)?.githubUrl || '',
        location: (user as any)?.location || '',
        industry: (user as any)?.industry || '',
        about: (user as any)?.about || '',
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
      const backendResponse = await request<any>('/company/profile', {
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
    let result: any = null;
    try {
      result = await request<{ company: CompanyProfileDto; jobs: JobDto[] }>(
        `/companies/${encodeURIComponent(rawIdentifier)}`,
        { method: 'GET' }
      );
    } catch (err) {
      // Fallback attempt to alternate public jobs company route
      result = await request<{ company: CompanyProfileDto; jobs: JobDto[] }>(
        `/public/jobs/company/${encodeURIComponent(rawIdentifier)}`,
        { method: 'GET' }
      );
    }

    if (result && (result.company || result.id)) {
      const companyData = result.company || result;
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
  createdAt: string;
  updatedAt?: string;
}

export interface AiMatchRequestDto {
  candidate: {
    skills: string[];
    experienceYears: number;
    headline?: string;
    summary?: string;
    experiences: ExperienceDto[];
    projects: ProjectDto[];
    educations: EducationDto[];
    certifications: CertificationDto[];
  };
  job: {
    title: string;
    department?: string;
    experienceLevel?: string;
    description?: string;
    skills: string[];
  };
}

export interface AiMatchResponseDto {
  matchPercentage: number;
  strengths: string[];
  missingSkillGaps: string[];
  aiRecommendation: string;
}

export const aiMatchApi = {
  async analyze(candidateId: string, jobId: string): Promise<AiMatchResponseDto> {
    const query = new URLSearchParams({ candidateId, jobId });
    return request<AiMatchResponseDto>(`/match?${query.toString()}`, {
      method: 'GET',
    }, 120_000);
  },
};

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

export interface ScreenedApplicantDto {
  applicationId: string;
  candidateId: string;
  fullName: string;
  email: string;
  headline?: string;
  skills: string[];
  appliedDate: string;
  status: string;
  aiMatchScore: number | null;
}

export interface ApplicationStatusDto {
  hasApplied: boolean;
  appliedDate?: string | null;
  status?: string | null;
  applicationId?: string | null;
}

export interface CandidateApplicationItemDto {
  id: string;
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

export interface RecommendedJobDto {
  jobId: string;
  title: string;
  company: string;
  location: string;
  postedDate: string;
  matchPercentage: number;
  isRecommended: boolean;
}

const recommendationRequests = new Map<string, Promise<RecommendedJobDto[]>>();

export const jobRecommendationsApi = {
  async getForCandidate(candidateId: string): Promise<RecommendedJobDto[]> {
    const existingRequest = recommendationRequests.get(candidateId);
    if (existingRequest) return existingRequest;

    const pendingRequest = request<RecommendedJobDto[]>(
      `/candidate/${encodeURIComponent(candidateId)}/recommended-jobs`,
      { method: 'GET' },
      120000,
    );

    recommendationRequests.set(candidateId, pendingRequest);
    try {
      return await pendingRequest;
    } finally {
      recommendationRequests.delete(candidateId);
    }
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
    } catch (err: any) {
      if (err?.message?.includes('404')) {
        return [];
      }
      throw err;
    }
  },

  async runAiScreen(jobId: string): Promise<ScreenedApplicantDto[]> {
    return request<ScreenedApplicantDto[]>(`/jobs/${jobId}/run-ai-screen`, {
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

export interface RecommendedJobResponseDto {
  jobId: string;
  title: string;
  company: string;
  location: string;
  postedDate: string;
  matchPercentage: number;
  isRecommended: boolean;
}

export const candidateJobRecommendationsApi = {
  /**
   * Fetches AI-recommended jobs for a candidate.
   * Calls: GET /api/candidate/{candidateId}/recommended-jobs
   */
  async getRecommendedJobs(candidateId: string): Promise<RecommendedJobResponseDto[]> {
    return request<RecommendedJobResponseDto[]>(`/candidate/${candidateId}/recommended-jobs`, {
      method: 'GET',
    });
  },
};
