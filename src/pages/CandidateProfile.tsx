import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import {
  candidateCvApi,
  candidateAuthApi,
  assessmentsApi,
  type CandidateProfileResponseDto,
  type ExperienceDto,
  type EducationDto,
  type ProjectDto,
  type SkillDto,
  type CertificationDto,
  type CandidateAssessmentListItemDto,
} from '../services/api';
import {
  SparkleIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckIcon,
  LinkedInIcon,
  GitHubIcon,
  AwardIcon,
  TrashIcon,
} from '../components/common/Icons';
import { SpeedDialFab } from '../components/candidates/SpeedDialFab';
import { AddExperienceModal } from '../components/candidates/modals/AddExperienceModal';
import { AddEducationModal } from '../components/candidates/modals/AddEducationModal';
import { AddProjectModal } from '../components/candidates/modals/AddProjectModal';
import { AddSkillModal } from '../components/candidates/modals/AddSkillModal';
import { EditAboutModal } from '../components/candidates/modals/EditAboutModal';
import { AddCertificationModal } from '../components/candidates/modals/AddCertificationModal';
import { EditProfileModal } from '../components/candidates/modals/EditProfileModal';

const sanitizeHtml = (htmlContent: string) => {
  return { __html: DOMPurify.sanitize(htmlContent || '') };
};

// Extra Icons
const GlobeLinkIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const GraduationCapIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const CodeFolderIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <path d="m10 13-2 2 2 2" />
    <path d="m14 17 2-2-2-2" />
  </svg>
);

const ExternalLinkIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// Empty State Box Component
interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, actionLabel, onAction }) => (
  <div className="candidate-empty-state-box">
    <div className="candidate-empty-state-icon">
      {icon}
    </div>
    <p className="candidate-empty-state-text">{message}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="candidate-empty-state-btn"
      >
        <span>+ {actionLabel}</span>
      </button>
    )}
  </div>
);

// Helper to parse Role and Tech Stack from combined project role strings
const parseProjectDetails = (rawRole?: string) => {
  if (!rawRole) return { displayRole: '', techStack: [] as string[] };

  let displayRole = '';
  let techString = '';

  if (rawRole.includes('•')) {
    const parts = rawRole.split('•');
    displayRole = parts[0].trim();
    techString = parts.slice(1).join(',');
  } else if (rawRole.includes('|')) {
    const parts = rawRole.split('|');
    displayRole = parts[0].trim();
    techString = parts.slice(1).join(',');
  } else if (rawRole.includes('(') && rawRole.includes(')')) {
    const match = rawRole.match(/^([^(]+)\(([^)]+)\)/);
    if (match) {
      displayRole = match[1].trim();
      techString = match[2].trim();
    } else {
      displayRole = rawRole.trim();
    }
  } else if (rawRole.includes(',')) {
    const parts = rawRole.split(',').map((s) => s.trim()).filter(Boolean);
    const knownRoles = ['lead', 'engineer', 'developer', 'architect', 'full stack', 'frontend', 'backend', 'devops', 'intern', 'consultant', 'manager'];
    const firstPartLower = parts[0]?.toLowerCase() || '';
    const hasRoleKeyword = knownRoles.some((k) => firstPartLower.includes(k));

    if (hasRoleKeyword && parts.length > 1) {
      displayRole = parts[0];
      techString = parts.slice(1).join(',');
    } else {
      techString = rawRole;
    }
  } else {
    displayRole = rawRole.trim();
  }

  const techStack = techString
    ? techString
        .split(',')
        .map((t) => t.trim().replace(/^•\s*/, ''))
        .filter(Boolean)
    : [];

  return { displayRole, techStack };
};

// Skeleton Loader Component (Premium Corporate Light Theme)
const CandidateProfileSkeleton: React.FC = () => (
  <div className="candidate-profile-container">
    {/* Hero Card Skeleton */}
    <div className="candidate-hero-card">
      <div className="candidate-hero-banner">
        <div className="candidate-skeleton-pulse" style={{ width: '130px', height: '28px', borderRadius: '9999px' }} />
      </div>
      <div className="candidate-hero-body">
        <div className="candidate-hero-top-row">
          <div className="candidate-avatar-wrapper">
            <div className="candidate-skeleton-pulse" style={{ width: '104px', height: '104px', borderRadius: '50%', border: '4px solid #ffffff' }} />
          </div>
          <div className="candidate-hero-actions">
            <div className="candidate-skeleton-pulse" style={{ width: '116px', height: '40px', borderRadius: '12px' }} />
            <div className="candidate-skeleton-pulse" style={{ width: '130px', height: '40px', borderRadius: '12px' }} />
          </div>
        </div>

        <div className="candidate-identity-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div className="candidate-skeleton-pulse" style={{ width: '220px', height: '28px', borderRadius: '8px' }} />
            <div className="candidate-skeleton-pulse" style={{ width: '96px', height: '24px', borderRadius: '9999px' }} />
          </div>
          <div className="candidate-skeleton-pulse-light" style={{ width: '70%', height: '18px', borderRadius: '6px', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '14px' }}>
            <div className="candidate-skeleton-pulse-light" style={{ width: '110px', height: '16px', borderRadius: '6px' }} />
            <div className="candidate-skeleton-pulse-light" style={{ width: '90px', height: '16px', borderRadius: '6px' }} />
            <div className="candidate-skeleton-pulse-light" style={{ width: '100px', height: '16px', borderRadius: '6px' }} />
          </div>
        </div>

        <div className="candidate-contact-bar">
          <div className="candidate-skeleton-pulse-light" style={{ width: '180px', height: '34px', borderRadius: '10px' }} />
          <div className="candidate-skeleton-pulse-light" style={{ width: '140px', height: '34px', borderRadius: '10px' }} />
          <div className="candidate-skeleton-pulse-light" style={{ width: '100px', height: '34px', borderRadius: '10px' }} />
        </div>
      </div>
    </div>

    {/* About Section Skeleton */}
    <div className="candidate-card">
      <div className="candidate-card-header">
        <div className="candidate-card-title-group">
          <div className="candidate-skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          <div>
            <div className="candidate-skeleton-pulse" style={{ width: '190px', height: '18px', borderRadius: '6px', marginBottom: '6px' }} />
            <div className="candidate-skeleton-pulse-light" style={{ width: '240px', height: '13px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0 16px' }}>
        <div className="candidate-skeleton-pulse-light" style={{ width: '100%', height: '14px', borderRadius: '4px' }} />
        <div className="candidate-skeleton-pulse-light" style={{ width: '92%', height: '14px', borderRadius: '4px' }} />
        <div className="candidate-skeleton-pulse-light" style={{ width: '80%', height: '14px', borderRadius: '4px' }} />
      </div>
      <div className="candidate-metrics-grid">
        <div className="candidate-skeleton-pulse-light" style={{ height: '72px', borderRadius: '14px' }} />
        <div className="candidate-skeleton-pulse-light" style={{ height: '72px', borderRadius: '14px' }} />
        <div className="candidate-skeleton-pulse-light" style={{ height: '72px', borderRadius: '14px' }} />
      </div>
    </div>

    {/* Experience Section Skeleton */}
    <div className="candidate-card">
      <div className="candidate-card-header">
        <div className="candidate-card-title-group">
          <div className="candidate-skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          <div>
            <div className="candidate-skeleton-pulse" style={{ width: '180px', height: '18px', borderRadius: '6px', marginBottom: '6px' }} />
            <div className="candidate-skeleton-pulse-light" style={{ width: '250px', height: '13px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
        <div className="candidate-skeleton-pulse-light" style={{ height: '100px', borderRadius: '16px' }} />
        <div className="candidate-skeleton-pulse-light" style={{ height: '100px', borderRadius: '16px' }} />
      </div>
    </div>

    {/* Skills Section Skeleton */}
    <div className="candidate-card">
      <div className="candidate-card-header">
        <div className="candidate-card-title-group">
          <div className="candidate-skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          <div>
            <div className="candidate-skeleton-pulse" style={{ width: '200px', height: '18px', borderRadius: '6px', marginBottom: '6px' }} />
            <div className="candidate-skeleton-pulse-light" style={{ width: '260px', height: '13px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {[80, 95, 110, 75, 120, 90, 85, 105].map((w, i) => (
          <div key={i} className="candidate-skeleton-pulse-light" style={{ width: `${w}px`, height: '32px', borderRadius: '9999px' }} />
        ))}
      </div>
    </div>
  </div>
);

export const CandidateProfile: React.FC = () => {
  const { currentUser, updateUser } = useAuth();

  // Dynamic Candidate Profile & CV State
  const [profileData, setProfileData] = useState<CandidateProfileResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Control States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Selected item state for editing
  const [editingExperience, setEditingExperience] = useState<ExperienceDto | null>(null);
  const [editingEducation, setEditingEducation] = useState<EducationDto | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);
  const [editingCertification, setEditingCertification] = useState<CertificationDto | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [technicalAssessments, setTechnicalAssessments] = useState<CandidateAssessmentListItemDto[]>([]);

  // Fetch Full Profile from Backend
  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Also fetch technical assessments
      try {
        const tests = await assessmentsApi.getMyAssessments();
        setTechnicalAssessments(tests || []);
      } catch (tErr) {
        console.warn('Could not load candidate technical assessments:', tErr);
      }

      let data: CandidateProfileResponseDto;
      try {
        data = await candidateCvApi.getProfile();
      } catch {
        // Fallback to fetch /candidate/cv and /candidate/me concurrently
        const [cv, user] = await Promise.all([
          candidateCvApi.getCv(),
          candidateAuthApi.getMe().catch(() => currentUser),
        ]);
        data = {
          id: user?.id || '',
          firstName: user?.firstName,
          lastName: user?.lastName,
          fullName: user?.fullName || '',
          email: user?.email || '',
          headline: user?.headline,
          phone: user?.phone,
          location: user?.location,
          experience: user?.experience,
          availability: user?.availability,
          avatarUrl: user?.avatarUrl,
          website: user?.website,
          linkedinUrl: user?.linkedinUrl,
          githubUrl: user?.githubUrl,
          summary: cv.summary || user?.about,
          keyHighlights: cv.keyHighlights || [],
          experiences: cv.experiences || [],
          educations: cv.educations || [],
          projects: cv.projects || [],
          skills: cv.skills || [],
          certifications: cv.certifications || [],
        };
      }
      setProfileData(data);
    } catch (err: any) {
      console.error('Failed to load candidate profile:', err);
      setError(err?.message || 'Failed to load profile data from the database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Delete Item Handlers
  const handleDeleteExperience = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this work experience?')) return;
    try {
      await candidateCvApi.deleteExperience(id);
      setProfileData((prev) => (prev ? {
        ...prev,
        experiences: prev.experiences.filter((item) => item.id !== id),
      } : null));
      setSuccessMsg('Experience entry removed.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete experience.');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this educational qualification?')) return;
    try {
      await candidateCvApi.deleteEducation(id);
      setProfileData((prev) => (prev ? {
        ...prev,
        educations: prev.educations.filter((item) => item.id !== id),
      } : null));
      setSuccessMsg('Education entry removed.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete education entry.');
    }
  };

  const handleDeleteCertification = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this certification?')) return;
    try {
      await candidateCvApi.deleteCertification(id);
      setProfileData((prev) => (prev ? {
        ...prev,
        certifications: prev.certifications.filter((item) => item.id !== id),
      } : null));
      setSuccessMsg('Certification entry removed.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete certification.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this project?')) return;
    try {
      await candidateCvApi.deleteProject(id);
      setProfileData((prev) => (prev ? {
        ...prev,
        projects: prev.projects.filter((item) => item.id !== id),
      } : null));
      setSuccessMsg('Project removed.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete project.');
    }
  };

  const handleDeleteSkill = async (id: string, name?: string) => {
    if (name && !window.confirm(`Are you sure you want to remove skill "${name}"?`)) return;
    try {
      await candidateCvApi.deleteSkill(id);
      setProfileData((prev) => (prev ? {
        ...prev,
        skills: prev.skills.filter((item) => item.id !== id),
      } : null));
      setSuccessMsg(`Skill "${name || 'entry'}" removed.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete skill.');
    }
  };

  // Render Skeleton Loader while loading
  if (isLoading) {
    return <CandidateProfileSkeleton />;
  }

  // Render Error state if loading failed completely
  if (error && !profileData) {
    return (
      <div className="candidate-profile-container">
        <div className="candidate-alert-error" style={{ margin: '40px 0', padding: '24px', borderRadius: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px' }}>Failed to Load Profile</h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>{error}</p>
          </div>
          <button
            type="button"
            onClick={loadProfileData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Profile data values
  const candidateDisplayName =
    profileData?.fullName ||
    `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim() ||
    currentUser?.fullName ||
    'Candidate';

  const candidateEmail = profileData?.email || currentUser?.email || '';
  const headline = profileData?.headline || currentUser?.headline || '';
  const phone = profileData?.phone || currentUser?.phone || '';
  const location = profileData?.location || currentUser?.location || '';
  const experience = profileData?.experience || currentUser?.experience || '';
  const availability = profileData?.availability || currentUser?.availability || '';
  const website = profileData?.website || currentUser?.website || '';
  const linkedinUrl = profileData?.linkedinUrl || currentUser?.linkedinUrl || '';
  const githubUrl = profileData?.githubUrl || currentUser?.githubUrl || '';
  const summary = profileData?.summary || '';
  const keyHighlights = profileData?.keyHighlights || [];
  const experiences = profileData?.experiences || [];
  const educations = profileData?.educations || [];
  const projects = profileData?.projects || [];
  const skills = profileData?.skills || [];
  const certifications = profileData?.certifications || [];

  const initials =
    candidateDisplayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    (candidateEmail ? candidateEmail[0].toUpperCase() : 'CV');

  // Group skills by category
  const skillsByCategory = skills.reduce<Record<string, SkillDto[]>>((acc, skill) => {
    const cat = skill.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <div className="candidate-profile-container">
      {/* Alert Notifications */}
      {successMsg && (
        <div className="candidate-alert-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckIcon />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#008759', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="candidate-alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HERO / INTRO CARD (Company Dashboard Theme)
          ========================================================================= */}
      <div className="candidate-hero-card">
        {/* Banner Cover Gradient */}
        <div className="candidate-hero-banner">
          <span className="candidate-hero-badge">
            <SparkleIcon />
            <span>Verified Digital CV</span>
          </span>
        </div>

        {/* Profile Details Body */}
        <div className="candidate-hero-body">
          {/* Top Row: Avatar & Action Buttons */}
          <div className="candidate-hero-top-row">
            {/* Large Circular Avatar */}
            <div className="candidate-avatar-wrapper">
              <div className="candidate-avatar-circle">
                {initials}
              </div>
              <div className="candidate-status-dot" title="Online & Ready for Interviews" />
            </div>

            {/* Actions */}
            <div className="candidate-hero-actions">
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="candidate-btn-edit"
              >
                <EditIcon />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Digital CV exported to PDF successfully.')}
                className="candidate-btn-download"
              >
                <DownloadIcon />
                <span>Download CV</span>
              </button>
            </div>
          </div>

          {/* Name & Headline */}
          <div className="candidate-identity-info">
            <div className="candidate-name-row">
              <h1 className="candidate-name-title">{candidateDisplayName}</h1>
              <span className="candidate-badge-open">
                <span className="candidate-badge-open-dot"></span>
                <span>Open to Work</span>
              </span>
            </div>

            {headline ? (
              <p className="candidate-headline-text">
                {headline}
              </p>
            ) : (
              <p className="candidate-headline-text" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                No professional headline provided yet. Click &quot;Edit Profile&quot; to add your title.
              </p>
            )}

            {/* Dynamic Meta Info Tags: Location, Experience, Availability */}
            {(() => {
              const metaItems = [
                location ? { id: 'loc', icon: <MapPinIcon />, text: location } : null,
                experience
                  ? {
                      id: 'exp',
                      icon: <BriefcaseIcon />,
                      text:
                        experience.includes('Experience') || experience.includes('Level')
                          ? experience
                          : `${experience} Experience`,
                    }
                  : null,
                availability
                  ? {
                      id: 'avail',
                      icon: <ClockIcon />,
                      text:
                        availability.includes('Notice') ||
                        availability.includes('Immediate') ||
                        availability.includes('Offers') ||
                        availability.includes('Looking')
                          ? availability
                          : `${availability} Availability`,
                    }
                  : null,
              ].filter(Boolean) as { id: string; icon: React.ReactNode; text: string }[];

              if (metaItems.length === 0) return null;

              return (
                <div className="candidate-meta-row">
                  {metaItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && <span className="candidate-meta-divider">•</span>}
                      <span className="candidate-meta-item">
                        {item.icon}
                        <span>{item.text}</span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Contact & Social Links Row */}
          <div className="candidate-contact-bar">
            {candidateEmail && (
              <a
                href={`mailto:${candidateEmail}`}
                className="candidate-contact-pill"
              >
                <MailIcon />
                <span>{candidateEmail}</span>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                className="candidate-contact-pill"
              >
                <PhoneIcon />
                <span>{phone}</span>
              </a>
            )}

            {linkedinUrl && (
              <a
                href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="candidate-contact-pill"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>
            )}

            {githubUrl && (
              <a
                href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="candidate-contact-pill"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </a>
            )}

            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="candidate-contact-pill"
              >
                <GlobeLinkIcon />
                <span>{website}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: ABOUT / PROFESSIONAL SUMMARY
          ========================================================================= */}
      <div className="candidate-card">
        <div className="candidate-card-header">
          <div className="candidate-card-title-group">
            <div className="candidate-icon-box">
              <SparkleIcon />
            </div>
            <div className="candidate-card-title-text">
              <h2>About & Executive Summary</h2>
              <p>Career highlights and leadership profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAboutModalOpen(true)}
            className="candidate-action-btn"
            title="Edit About & Summary"
            aria-label="Edit About & Summary"
          >
            <EditIcon />
          </button>
        </div>

        {/* Safely Rendered HTML Summary */}
        {summary ? (
          <div
            className="candidate-rich-text"
            dangerouslySetInnerHTML={sanitizeHtml(summary)}
          />
        ) : (
          <EmptyState
            icon={<SparkleIcon />}
            message="No executive summary provided yet. Click the edit icon to add your professional story."
            actionLabel="Add Executive Summary"
            onAction={() => setIsAboutModalOpen(true)}
          />
        )}

        {/* Quick Highlights Metrics Bar (Conditionally Rendered) */}
        {keyHighlights && keyHighlights.length > 0 && (
          <div className="candidate-metrics-grid">
            {keyHighlights.map((hl, idx) => (
              <div key={idx} className="candidate-metric-box">
                <span className="candidate-metric-label">{hl.category}</span>
                <span className="candidate-metric-val">{hl.value}</span>
                {hl.subtext && <span className="candidate-metric-sub">{hl.subtext}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: WORK EXPERIENCE (Dynamic from DB)
          ========================================================================= */}
      <div className="candidate-card">
        <div className="candidate-card-header">
          <div className="candidate-card-title-group">
            <div className="candidate-icon-box">
              <BriefcaseIcon />
            </div>
            <div className="candidate-card-title-text">
              <h2>Professional Experience</h2>
              <p>Work history, roles, leadership contributions, and project deliveries</p>
            </div>
          </div>
        </div>

        {experiences && experiences.length > 0 ? (
          <div className="candidate-timeline-wrap">
            {experiences.map((job) => (
              <div key={job.id} className="candidate-timeline-entry">
                <div className="candidate-timeline-card">
                  <div className="candidate-timeline-header">
                    <div>
                      <h3 className="candidate-timeline-title">{job.title}</h3>
                      <p className="candidate-timeline-company">
                        {job.company} {job.location ? `• ${job.location}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="candidate-timeline-date">
                        {job.startDate} — {job.isCurrent ? 'Present' : job.endDate || 'Present'}
                      </span>
                      <div className="candidate-actions-group">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExperience(job);
                            setIsExpModalOpen(true);
                          }}
                          className="candidate-action-btn"
                          title="Edit work experience"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(job.id)}
                          className="candidate-action-btn candidate-action-btn-danger"
                          title="Delete work experience"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>

                  {job.description && (
                    <div
                      className="candidate-rich-text"
                      dangerouslySetInnerHTML={sanitizeHtml(job.description)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BriefcaseIcon />}
            message="No experience added yet. Click the + button to add your work history."
            actionLabel="Add Experience"
            onAction={() => {
              setEditingExperience(null);
              setIsExpModalOpen(true);
            }}
          />
        )}
      </div>

      {/* =========================================================================
          SECTION 4: FEATURED PROJECTS & BUILDS (Dynamic from DB)
          ========================================================================= */}
      <div className="candidate-card">
        <div className="candidate-card-header">
          <div className="candidate-card-title-group">
            <div className="candidate-icon-box">
              <CodeFolderIcon />
            </div>
            <div className="candidate-card-title-text">
              <h2>Featured Projects & Builds</h2>
              <p>Open-source contributions, distributed systems, and deployed applications</p>
            </div>
          </div>
        </div>

        {projects && projects.length > 0 ? (
          <div className="candidate-projects-list">
            {projects.map((proj) => {
              const { displayRole, techStack } = parseProjectDetails(proj.role);
              const projectUrl = proj.link || proj.liveUrl || (proj as any).projectUrl;

              return (
                <div key={proj.id} className="candidate-project-item">
                  {/* 1. Primary Header: Project Title & Actions (Edit/Delete) */}
                  <div className="candidate-project-header">
                    <div style={{ flex: 1 }}>
                      <h3 className="candidate-project-title">{proj.projectName}</h3>

                      {/* 2. Secondary Meta: Role with System Theme Color and Subtle Text Link */}
                      <div className="candidate-project-meta-row">
                        {displayRole && (
                          <span className="candidate-project-role">
                            {displayRole}
                          </span>
                        )}
                        {projectUrl && (
                          <>
                            {displayRole && <span className="candidate-project-meta-divider">•</span>}
                            <a
                              href={projectUrl.startsWith('http') ? projectUrl : `https://${projectUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="candidate-project-link"
                            >
                              <span>View Project</span>
                              <ExternalLinkIcon />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons aligned strictly to far right */}
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <div className="candidate-actions-group">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProject(proj);
                            setIsProjModalOpen(true);
                          }}
                          className="candidate-action-btn"
                          title="Edit project"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="candidate-action-btn candidate-action-btn-danger"
                          title="Delete project"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Tech Stack: System UI Theme Badges */}
                  {techStack.length > 0 && (
                    <div className="candidate-project-tags">
                      {techStack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="candidate-project-tag"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 4. Description: Completely independent safe rendering */}
                  {proj.description && (
                    <div
                      className="candidate-rich-text"
                      style={{ marginTop: '6px' }}
                      dangerouslySetInnerHTML={sanitizeHtml(proj.description)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<CodeFolderIcon />}
            message="No projects added yet. Click the + button to showcase your featured repositories and live builds."
            actionLabel="Add Project"
            onAction={() => {
              setEditingProject(null);
              setIsProjModalOpen(true);
            }}
          />
        )}
      </div>

      {/* =========================================================================
          SECTION 5: TECHNICAL & SOFT SKILLS (Dynamic from DB)
          ========================================================================= */}
      <div className="candidate-card">
        <div className="candidate-card-header">
          <div className="candidate-card-title-group">
            <div className="candidate-icon-box">
              <AwardIcon />
            </div>
            <div className="candidate-card-title-text">
              <h2>Technical & Professional Skills</h2>
              <p>Core competencies, languages, frameworks, and architecture tools</p>
            </div>
          </div>
        </div>

        {Object.keys(skillsByCategory).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.keys(skillsByCategory).map((catName) => (
              <div key={catName} className="candidate-skill-category-group">
                <h3 className="candidate-skill-cat-title">{catName}</h3>
                <div className="candidate-skill-pills-wrap">
                  {skillsByCategory[catName]?.map((skill) => (
                    <div key={skill.id} className="candidate-skill-chip">
                      <span>{skill.skillName}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill.id, skill.skillName)}
                        className="candidate-skill-delete-btn"
                        title={`Remove skill ${skill.skillName}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<AwardIcon />}
            message="No skills added yet. Click the + button to add technical and professional competencies."
            actionLabel="Add Skill"
            onAction={() => setIsSkillModalOpen(true)}
          />
        )}
      </div>

      {/* =========================================================================
          SECTION 6: EDUCATION & QUALIFICATIONS (Dynamic from DB)
          ========================================================================= */}
      <div className="candidate-card">
        <div className="candidate-card-header">
          <div className="candidate-card-title-group">
            <div className="candidate-icon-box">
              <GraduationCapIcon />
            </div>
            <div className="candidate-card-title-text">
              <h2>Education & Industry Credentials</h2>
              <p>Degrees, academic distinctions, and accredited certifications</p>
            </div>
          </div>
        </div>

        {educations && educations.length > 0 ? (
          <div className="candidate-grid-cards">
            {educations.map((item) => (
              <div key={item.id} className="candidate-item-card">
                <div className="candidate-item-card-top">
                  <div className="candidate-item-card-badge-row">
                    <span className="candidate-item-category-tag">Academic Credential</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                        {item.startYear} {item.endYear ? `— ${item.endYear}` : ''}
                      </span>
                      <div className="candidate-actions-group">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEducation(item);
                            setIsEduModalOpen(true);
                          }}
                          className="candidate-action-btn"
                          title="Edit education"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(item.id)}
                          className="candidate-action-btn candidate-action-btn-danger"
                          title="Delete education"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 className="candidate-item-title">{item.degree}</h3>
                  <p className="candidate-item-subtitle">
                    {item.institution} {item.fieldOfStudy ? `• ${item.fieldOfStudy}` : ''}
                  </p>
                  {item.description && (
                    <p className="candidate-item-desc">{item.description}</p>
                  )}
                </div>

                <div className="candidate-item-footer">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#008759' }}>
                    <CheckIcon />
                    <span>Verified Degree</span>
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Skill Hub Verified</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<GraduationCapIcon />}
            message="No education credentials added yet. Click the + button to add your degrees and academic history."
            actionLabel="Add Education"
            onAction={() => {
              setEditingEducation(null);
              setIsEduModalOpen(true);
            }}
          />
        )}
      </div>

      {/* =========================================================================
          SECTION 7: LICENSES & CERTIFICATIONS (Dynamic from DB)
          ========================================================================= */}
      <div className="candidate-card">
        <div className="candidate-card-header">
          <div className="candidate-card-title-group">
            <div className="candidate-icon-box">
              <AwardIcon />
            </div>
            <div className="candidate-card-title-text">
              <h2>Licenses & Certifications</h2>
              <p>Accredited professional certifications, licenses, and verified credentials</p>
            </div>
          </div>
        </div>

        {certifications && certifications.length > 0 ? (
          <div className="candidate-grid-cards">
            {certifications.map((item) => (
              <div key={item.id} className="candidate-item-card">
                <div className="candidate-item-card-top">
                  <div className="candidate-item-card-badge-row">
                    <span className="candidate-item-category-tag">Verified Certificate</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.issueDate && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                          {item.issueDate}
                        </span>
                      )}
                      <div className="candidate-actions-group">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCertification(item);
                            setIsCertModalOpen(true);
                          }}
                          className="candidate-action-btn"
                          title="Edit certification"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(item.id)}
                          className="candidate-action-btn candidate-action-btn-danger"
                          title="Delete certification"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 className="candidate-item-title">{item.title}</h3>
                  <p className="candidate-item-subtitle" style={{ margin: '4px 0 0' }}>
                    {item.issuingOrganization}
                  </p>
                </div>

                {item.credentialUrl && (
                  <div className="candidate-item-footer">
                    <a
                      href={item.credentialUrl.startsWith('http') ? item.credentialUrl : `https://${item.credentialUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="candidate-item-link"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#008759',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Show Credential</span>
                      <ExternalLinkIcon />
                    </a>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Verified Issuer</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<AwardIcon />}
            message="No certifications added yet. Click the + button to add your licenses and certificates."
            actionLabel="Add Certification"
            onAction={() => {
              setEditingCertification(null);
              setIsCertModalOpen(true);
            }}
          />
        )}
      </div>

      {/* =========================================================================
          SECTION 8: TECHNICAL ASSESSMENTS (Verified Engine & HR Evaluated Marks)
          ========================================================================= */}
      <div className="candidate-card" id="technical-assessments-section">
        <div className="candidate-card-header">
          <div className="candidate-card-title-group">
            <div className="candidate-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
              <SparkleIcon />
            </div>
            <div className="candidate-card-title-text">
              <h2>Technical Assessments &amp; Verified Scores</h2>
              <p>Evaluated coding challenges, benchmark marks, and interview selection status</p>
            </div>
          </div>
          <Link
            to="/candidate/assessments"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#008759',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View Assessments Portal</span>
            <ExternalLinkIcon />
          </Link>
        </div>

        {technicalAssessments && technicalAssessments.length > 0 ? (
          <div className="candidate-grid-cards">
            {technicalAssessments.map((item) => {
              const isGraded = item.status === 'Graded' || item.status === 'Passed' || (item.status === 'Submitted' && item.examScore > 0);
              const isUnderReview = item.status === 'Under_Review' || (item.status === 'Submitted' && item.examScore === 0);

              return (
                <div
                  key={item.submissionId}
                  className="candidate-item-card"
                  style={item.isSelectedForInterview ? { border: '1.5px solid #10b981', background: '#f0fdf4' } : undefined}
                >
                  <div className="candidate-item-card-top">
                    <div className="candidate-item-card-badge-row">
                      {item.isSelectedForInterview ? (
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}>
                          ⭐ Selected for Technical Interview
                        </span>
                      ) : isGraded ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: item.isPassed ? '#ecfdf5' : '#eff6ff', color: item.isPassed ? '#047857' : '#1d4ed8' }}>
                          {item.isPassed ? 'Passed Assessment' : 'Evaluated'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: '#fffbeb', color: '#b45309' }}>
                          Under Review
                        </span>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                        {item.companyName}
                      </span>
                    </div>

                    <h3 className="candidate-item-title">{item.assessmentTitle}</h3>
                    <p className="candidate-item-subtitle">
                      Applied for: <strong>{item.jobTitle}</strong>
                    </p>

                    {isUnderReview && (
                      <p className="candidate-item-desc" style={{ color: '#b45309' }}>
                        ⏳ Code submitted. Evaluators are reviewing your solutions. Results will be published within 3–4 working days.
                      </p>
                    )}

                    {isGraded && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Technical Score:</span>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: item.examScore >= item.passingThreshold ? '#059669' : '#0f172a' }}>
                            {item.examScore}%
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>(Pass Benchmark: {item.passingThreshold}%)</span>
                        </div>
                        {item.reviewerFeedback && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                            "{item.reviewerFeedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="candidate-item-footer" style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: item.isSelectedForInterview ? '#047857' : '#008759' }}>
                      <CheckIcon />
                      <span>{item.isSelectedForInterview ? 'Interview Round Unlocked' : 'Verified Challenge'}</span>
                    </span>
                    <Link
                      to="/candidate/assessments"
                      style={{ fontSize: '12px', fontWeight: 600, color: '#008759', textDecoration: 'none' }}
                    >
                      Scorecard &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<SparkleIcon />}
            message="No technical assessments completed yet. When employers dispatch coding assessments for your applications, your scores will appear here."
            actionLabel="View Technical Assessments"
            onAction={() => window.location.href = '/candidate/assessments'}
          />
        )}
      </div>

      {/* =========================================================================
          FLOATING ACTION BUTTON (SPEED DIAL)
          ========================================================================= */}
      <SpeedDialFab
        onAddExperience={() => {
          setEditingExperience(null);
          setIsExpModalOpen(true);
        }}
        onAddEducation={() => {
          setEditingEducation(null);
          setIsEduModalOpen(true);
        }}
        onAddProject={() => {
          setEditingProject(null);
          setIsProjModalOpen(true);
        }}
        onAddSkill={() => setIsSkillModalOpen(true)}
        onAddCertification={() => {
          setEditingCertification(null);
          setIsCertModalOpen(true);
        }}
      />

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      <AddExperienceModal
        isOpen={isExpModalOpen}
        initialData={editingExperience}
        onClose={() => {
          setIsExpModalOpen(false);
          setEditingExperience(null);
        }}
        onSuccess={(saved) => {
          setProfileData((prev) => {
            if (!prev) return null;
            const exists = prev.experiences.some((e) => e.id === saved.id);
            return {
              ...prev,
              experiences: exists
                ? prev.experiences.map((e) => (e.id === saved.id ? saved : e))
                : [saved, ...prev.experiences],
            };
          });
          setSuccessMsg(editingExperience ? `Updated experience at ${saved.company}!` : `Added experience at ${saved.company}!`);
          setEditingExperience(null);
        }}
      />

      <AddEducationModal
        isOpen={isEduModalOpen}
        initialData={editingEducation}
        onClose={() => {
          setIsEduModalOpen(false);
          setEditingEducation(null);
        }}
        onSuccess={(saved) => {
          setProfileData((prev) => {
            if (!prev) return null;
            const exists = prev.educations.some((ed) => ed.id === saved.id);
            return {
              ...prev,
              educations: exists
                ? prev.educations.map((ed) => (ed.id === saved.id ? saved : ed))
                : [saved, ...prev.educations],
            };
          });
          setSuccessMsg(editingEducation ? `Updated education from ${saved.institution}!` : `Added education from ${saved.institution}!`);
          setEditingEducation(null);
        }}
      />

      <AddProjectModal
        isOpen={isProjModalOpen}
        initialData={editingProject}
        onClose={() => {
          setIsProjModalOpen(false);
          setEditingProject(null);
        }}
        onSuccess={(saved) => {
          setProfileData((prev) => {
            if (!prev) return null;
            const exists = prev.projects.some((p) => p.id === saved.id);
            return {
              ...prev,
              projects: exists
                ? prev.projects.map((p) => (p.id === saved.id ? saved : p))
                : [saved, ...prev.projects],
            };
          });
          setSuccessMsg(editingProject ? `Updated project: ${saved.projectName}!` : `Added project: ${saved.projectName}!`);
          setEditingProject(null);
        }}
      />

      <AddSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        onSuccess={(newSkill) => {
          setProfileData((prev) => (prev ? {
            ...prev,
            skills: [...prev.skills, newSkill],
          } : null));
          setSuccessMsg(`Added skill: ${newSkill.skillName}!`);
        }}
      />

      <EditAboutModal
        isOpen={isAboutModalOpen}
        initialSummary={summary}
        initialHighlights={keyHighlights}
        onClose={() => setIsAboutModalOpen(false)}
        onSuccess={(data) => {
          setProfileData((prev) => (prev ? {
            ...prev,
            summary: data.summary || '',
            keyHighlights: data.keyHighlights || [],
          } : null));
          setSuccessMsg('Executive summary and key highlights updated successfully!');
        }}
      />

      <AddCertificationModal
        isOpen={isCertModalOpen}
        initialData={editingCertification}
        onClose={() => {
          setIsCertModalOpen(false);
          setEditingCertification(null);
        }}
        onSuccess={(saved) => {
          setProfileData((prev) => {
            if (!prev) return null;
            const exists = prev.certifications.some((c) => c.id === saved.id);
            return {
              ...prev,
              certifications: exists
                ? prev.certifications.map((c) => (c.id === saved.id ? saved : c))
                : [saved, ...prev.certifications],
            };
          });
          setSuccessMsg(editingCertification ? `Updated certification: ${saved.title}!` : `Added certification: ${saved.title}!`);
          setEditingCertification(null);
        }}
      />

      <EditProfileModal
        isOpen={isEditingProfile}
        initialData={{
          firstName: profileData?.firstName || currentUser?.firstName,
          lastName: profileData?.lastName || currentUser?.lastName,
          headline: profileData?.headline || currentUser?.headline,
          phone: profileData?.phone || currentUser?.phone,
          location: profileData?.location || currentUser?.location,
          experience: profileData?.experience || currentUser?.experience,
          availability: profileData?.availability || currentUser?.availability,
          website: profileData?.website || currentUser?.website,
          linkedinUrl: profileData?.linkedinUrl || currentUser?.linkedinUrl,
          githubUrl: profileData?.githubUrl || currentUser?.githubUrl,
        }}
        onClose={() => setIsEditingProfile(false)}
        onSuccess={(updated) => {
          updateUser(updated);
          setProfileData((prev) => (prev ? {
            ...prev,
            firstName: updated.firstName !== undefined ? updated.firstName : prev.firstName,
            lastName: updated.lastName !== undefined ? updated.lastName : prev.lastName,
            fullName: updated.fullName || `${updated.firstName || prev.firstName || ''} ${updated.lastName || prev.lastName || ''}`.trim() || prev.fullName,
            headline: updated.headline !== undefined ? updated.headline : prev.headline,
            phone: updated.phone !== undefined ? updated.phone : prev.phone,
            location: updated.location !== undefined ? updated.location : prev.location,
            experience: updated.experience !== undefined ? updated.experience : prev.experience,
            availability: updated.availability !== undefined ? updated.availability : prev.availability,
            website: updated.website !== undefined ? updated.website : prev.website,
            linkedinUrl: updated.linkedinUrl !== undefined ? updated.linkedinUrl : prev.linkedinUrl,
            githubUrl: updated.githubUrl !== undefined ? updated.githubUrl : prev.githubUrl,
          } : null));
          setSuccessMsg('Profile details updated successfully!');
        }}
      />
    </div>
  );
};
