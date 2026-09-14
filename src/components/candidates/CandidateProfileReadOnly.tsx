import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import {
  jobApplicationsApi,
  type CandidateProfileResponseDto,
  type ExperienceDto,
  type EducationDto,
  type ProjectDto,
  type SkillDto,
  type CertificationDto,
} from '../../services/api';
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
  XIcon,
} from '../common/Icons';

const sanitizeHtml = (htmlContent: string) => {
  return { __html: DOMPurify.sanitize(htmlContent || '') };
};

const GlobeLinkIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

interface CandidateProfileReadOnlyProps {
  candidateId?: string;
  initialData?: CandidateProfileResponseDto | null;
  onClose?: () => void;
}

export const CandidateProfileReadOnly: React.FC<CandidateProfileReadOnlyProps> = ({
  candidateId,
  initialData,
  onClose,
}) => {
  const [profileData, setProfileData] = useState<CandidateProfileResponseDto | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData && Boolean(candidateId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setProfileData(initialData);
      setIsLoading(false);
      return;
    }

    if (!candidateId) return;

    const fetchCandidateCv = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await jobApplicationsApi.getCandidateProfileForEmployer(candidateId);
        setProfileData(data);
      } catch (err: any) {
        console.error('Error fetching candidate digital CV:', err);
        setError(err.message || 'Failed to load candidate digital CV profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidateCv();
  }, [candidateId, initialData]);

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium text-slate-500">Loading verified Digital CV profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl">
          ⚠️
        </div>
        <h3 className="text-base font-bold text-slate-800">Unable to Load Digital CV</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error || 'Candidate details could not be retrieved at this time.'}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        )}
      </div>
    );
  }

  // Derive initials for avatar fallback
  const initials = profileData.fullName
    ? profileData.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CA';

  return (
    <div className="candidate-cv-readonly-container bg-white text-slate-900 pb-12">
      {/* Top Bar with Badges & Optional Close */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <SparkleIcon />
            <span>Verified Digital CV</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ID: {profileData.id ? profileData.id.substring(0, 8).toUpperCase() : 'N/A'}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Close CV Viewer"
          >
            <XIcon />
          </button>
        )}
      </div>

      <div className="space-y-6 px-6 pt-6">
        {/* =========================================================
            1. HERO & IDENTITY CARD (READ-ONLY)
            ========================================================= */}
        <div className="candidate-card candidate-hero-card">
          <div className="candidate-hero-content">
            {/* Avatar */}
            <div className="candidate-avatar-wrap">
              <div className="candidate-avatar-glow" />
              {profileData.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={profileData.fullName}
                  className="candidate-avatar-img"
                />
              ) : (
                <div className="candidate-avatar-placeholder">
                  {initials}
                </div>
              )}
              <span className="candidate-avatar-badge" title="Active Digital CV">
                <CheckIcon />
              </span>
            </div>

            {/* Core Info */}
            <div className="candidate-identity-info">
              <div className="candidate-title-row">
                <h1 className="candidate-name">{profileData.fullName}</h1>
                <span className="candidate-verified-chip">
                  <SparkleIcon />
                  <span>ATS Ready</span>
                </span>
              </div>

              <p className="candidate-headline">
                {profileData.headline || 'Software Professional & Technology Specialist'}
              </p>

              {/* Meta details */}
              <div className="candidate-meta-grid">
                {profileData.location && (
                  <span className="candidate-meta-item">
                    <MapPinIcon />
                    <span>{profileData.location}</span>
                  </span>
                )}
                {profileData.experience && (
                  <span className="candidate-meta-item">
                    <BriefcaseIcon />
                    <span>{profileData.experience}</span>
                  </span>
                )}
                {profileData.availability && (
                  <span className="candidate-meta-item">
                    <ClockIcon />
                    <span>{profileData.availability}</span>
                  </span>
                )}
              </div>

              {/* Contact & Social Links */}
              <div className="candidate-contacts-row">
                {profileData.email && (
                  <a
                    href={`mailto:${profileData.email}`}
                    className="candidate-contact-badge"
                  >
                    <MailIcon />
                    <span>{profileData.email}</span>
                  </a>
                )}
                {profileData.phone && (
                  <a
                    href={`tel:${profileData.phone}`}
                    className="candidate-contact-badge"
                  >
                    <PhoneIcon />
                    <span>{profileData.phone}</span>
                  </a>
                )}
                {profileData.linkedinUrl && (
                  <a
                    href={profileData.linkedinUrl.startsWith('http') ? profileData.linkedinUrl : `https://${profileData.linkedinUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="candidate-contact-badge"
                  >
                    <LinkedInIcon />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profileData.githubUrl && (
                  <a
                    href={profileData.githubUrl.startsWith('http') ? profileData.githubUrl : `https://${profileData.githubUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="candidate-contact-badge"
                  >
                    <GitHubIcon />
                    <span>GitHub</span>
                  </a>
                )}
                {profileData.website && (
                  <a
                    href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="candidate-contact-badge"
                  >
                    <GlobeLinkIcon />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            2. ABOUT & EXECUTIVE SUMMARY (READ-ONLY)
            ========================================================= */}
        {(profileData.summary || (profileData.keyHighlights && profileData.keyHighlights.length > 0)) && (
          <div className="candidate-card">
            <div className="candidate-card-header">
              <div className="candidate-card-title-group">
                <span className="candidate-card-icon-wrap">
                  <SparkleIcon />
                </span>
                <div>
                  <h2 className="candidate-card-title">About & Executive Summary</h2>
                  <p className="candidate-card-subtitle">Candidate professional summary and key career highlights</p>
                </div>
              </div>
            </div>

            <div className="candidate-about-body">
              {profileData.summary && (
                <div
                  className="candidate-summary-text"
                  dangerouslySetInnerHTML={sanitizeHtml(profileData.summary)}
                />
              )}

              {profileData.keyHighlights && profileData.keyHighlights.length > 0 && (
                <div className="candidate-highlights-grid mt-4">
                  {profileData.keyHighlights.map((hl, idx) => (
                    <div key={idx} className="candidate-highlight-card">
                      <div className="candidate-highlight-cat">{hl.category}</div>
                      <div className="candidate-highlight-val">{hl.value}</div>
                      {hl.subtext && (
                        <div className="candidate-highlight-sub">{hl.subtext}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            3. PROFESSIONAL EXPERIENCE (READ-ONLY)
            ========================================================= */}
        {profileData.experiences && profileData.experiences.length > 0 && (
          <div className="candidate-card">
            <div className="candidate-card-header">
              <div className="candidate-card-title-group">
                <span className="candidate-card-icon-wrap">
                  <BriefcaseIcon />
                </span>
                <div>
                  <h2 className="candidate-card-title">Professional Experience</h2>
                  <p className="candidate-card-subtitle">Employment history, role impact, and architectural contributions</p>
                </div>
              </div>
            </div>

            <div className="candidate-timeline">
              {profileData.experiences.map((exp: ExperienceDto) => (
                <div key={exp.id} className="candidate-timeline-item">
                  <div className="candidate-timeline-bullet" />
                  <div className="candidate-timeline-content">
                    <div className="candidate-timeline-header">
                      <div>
                        <h3 className="candidate-item-title">{exp.title}</h3>
                        <p className="candidate-item-subtitle">{exp.company}</p>
                      </div>
                      <div className="candidate-item-date-badge">
                        {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                      </div>
                    </div>

                    {exp.description && (
                      <div
                        className="candidate-item-description"
                        dangerouslySetInnerHTML={sanitizeHtml(exp.description)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            4. FEATURED PROJECTS & BUILDS (READ-ONLY)
            ========================================================= */}
        {profileData.projects && profileData.projects.length > 0 && (
          <div className="candidate-card">
            <div className="candidate-card-header">
              <div className="candidate-card-title-group">
                <span className="candidate-card-icon-wrap">
                  <CodeFolderIcon />
                </span>
                <div>
                  <h2 className="candidate-card-title">Featured Projects & Builds</h2>
                  <p className="candidate-card-subtitle">Software systems, web applications, and technical contributions</p>
                </div>
              </div>
            </div>

            <div className="candidate-projects-list">
              {profileData.projects.map((proj: ProjectDto) => {
                const { displayRole, techStack } = parseProjectDetails(proj.role);
                return (
                  <div key={proj.id} className="candidate-project-item">
                    {/* 1. Primary Header: Project Title & Link */}
                    <div className="candidate-project-header">
                      <div style={{ flex: 1 }}>
                        <h3 className="candidate-project-title">{proj.projectName}</h3>
                        {/* 2. Secondary Meta: Role with System Theme Color */}
                        {displayRole && (
                          <p className="candidate-project-role">
                            {displayRole}
                          </p>
                        )}
                      </div>

                      {proj.link && (
                        <div className="candidate-project-actions">
                          <a
                            href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="candidate-project-link-btn"
                            title="View Project Link"
                          >
                            <span>View Project</span>
                            <ExternalLinkIcon />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* 3. Tech Stack: Distinct Badges/Pills with System Theme */}
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

                    {/* 4. Description Layout with Rich Text System Styling */}
                    {proj.description && (
                      <div
                        className="candidate-rich-text"
                        style={{ marginTop: '10px' }}
                        dangerouslySetInnerHTML={sanitizeHtml(proj.description)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            5. TECHNICAL & PROFESSIONAL SKILLS (READ-ONLY)
            ========================================================= */}
        {profileData.skills && profileData.skills.length > 0 && (
          <div className="candidate-card">
            <div className="candidate-card-header">
              <div className="candidate-card-title-group">
                <span className="candidate-card-icon-wrap">
                  <SparkleIcon />
                </span>
                <div>
                  <h2 className="candidate-card-title">Technical & Professional Skills</h2>
                  <p className="candidate-card-subtitle">Verified programming languages, frameworks, databases, and tooling</p>
                </div>
              </div>
            </div>

            <div className="candidate-skills-wrap">
              {profileData.skills.map((skill: SkillDto) => (
                <div key={skill.id} className="candidate-skill-pill">
                  <span className="candidate-skill-name">{skill.skillName}</span>
                  {skill.category && (
                    <span className="candidate-skill-category-tag">{skill.category}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            6. EDUCATION & INDUSTRY CREDENTIALS (READ-ONLY)
            ========================================================= */}
        {profileData.educations && profileData.educations.length > 0 && (
          <div className="candidate-card">
            <div className="candidate-card-header">
              <div className="candidate-card-title-group">
                <span className="candidate-card-icon-wrap">
                  <GraduationCapIcon />
                </span>
                <div>
                  <h2 className="candidate-card-title">Education & Academic Credentials</h2>
                  <p className="candidate-card-subtitle">Academic degrees, certifications, and institutional honors</p>
                </div>
              </div>
            </div>

            <div className="candidate-timeline">
              {profileData.educations.map((edu: EducationDto) => (
                <div key={edu.id} className="candidate-timeline-item">
                  <div className="candidate-timeline-bullet" />
                  <div className="candidate-timeline-content">
                    <div className="candidate-timeline-header">
                      <div>
                        <h3 className="candidate-item-title">{edu.degree}</h3>
                        <p className="candidate-item-subtitle">
                          {edu.institution} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}
                        </p>
                      </div>
                      <div className="candidate-item-date-badge">
                        {edu.startYear} - {edu.endYear || 'Present'}
                      </div>
                    </div>

                    {edu.description && (
                      <div
                        className="candidate-item-description"
                        dangerouslySetInnerHTML={sanitizeHtml(edu.description)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            7. LICENSES & CERTIFICATIONS (READ-ONLY)
            ========================================================= */}
        {profileData.certifications && profileData.certifications.length > 0 && (
          <div className="candidate-card">
            <div className="candidate-card-header">
              <div className="candidate-card-title-group">
                <span className="candidate-card-icon-wrap">
                  <AwardIcon />
                </span>
                <div>
                  <h2 className="candidate-card-title">Licenses & Certifications</h2>
                  <p className="candidate-card-subtitle">Industry credentials, vendor accreditations, and technical badges</p>
                </div>
              </div>
            </div>

            <div className="candidate-certifications-grid">
              {profileData.certifications.map((cert: CertificationDto) => (
                <div key={cert.id} className="candidate-cert-card">
                  <div className="candidate-cert-icon">
                    <AwardIcon />
                  </div>
                  <div className="candidate-cert-info">
                    <h3 className="candidate-cert-title">{cert.title}</h3>
                    <p className="candidate-cert-org">{cert.issuingOrganization}</p>
                    {cert.issueDate && (
                      <p className="candidate-cert-date">Issued {cert.issueDate}</p>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl.startsWith('http') ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="candidate-cert-link"
                      >
                        <span>Verify Credential</span>
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
