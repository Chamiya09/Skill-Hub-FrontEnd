import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import {
  candidateAuthApi,
  candidateCvApi,
  type ExperienceDto,
  type EducationDto,
  type ProjectDto,
  type SkillDto,
} from '../services/api';
import {
  SparkleIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingIcon,
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

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

const quillFormats = [
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
];

const sanitizeHtml = (htmlContent: string) => {
  return { __html: DOMPurify.sanitize(htmlContent || '') };
};

// Lucide-style extra icons
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

// Fallback initial items if user hasn't added entries yet
const defaultExperiences: ExperienceDto[] = [
  {
    id: 'exp-mock-1',
    title: 'Lead Cloud & Full-Stack Architect',
    company: 'Horizon Cloud Systems Inc.',
    location: 'San Francisco, CA (Remote)',
    startDate: '2023',
    endDate: 'Present',
    isCurrent: true,
    description: '<p>Architected and deployed high-throughput distributed event streaming pipelines reducing cross-region data latency by <strong>42%</strong>.</p><ul><li>Spearheaded the migration of legacy monoliths to containerized microservices running on <strong>AWS EKS</strong>.</li><li>Established automated CI/CD pipelines, integration test suites, and strict SLA monitoring.</li></ul>',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-mock-2',
    title: 'Senior Full-Stack Software Engineer',
    company: 'Nexus FinTech Solutions',
    location: 'New York, NY (Hybrid)',
    startDate: '2020',
    endDate: '2023',
    isCurrent: false,
    description: '<p>Built real-time transaction reconciliation dashboard using <strong>React</strong>, <strong>TypeScript</strong>, and <strong>.NET Core Web API</strong> handling $40M+ daily volume.</p><ul><li>Designed high-performance multi-level caching layer with <strong>Redis</strong>.</li><li>Reduced API response times from 340ms to 45ms.</li></ul>',
    createdAt: new Date().toISOString(),
  },
];

const defaultEducations: EducationDto[] = [
  {
    id: 'edu-mock-1',
    degree: 'Bachelor of Science in Computer Science & Engineering',
    institution: 'Stanford University',
    fieldOfStudy: 'Distributed Systems & Software Architecture',
    startYear: '2014',
    endYear: '2018',
    description: 'Focus in Distributed Systems, Algorithms, and Software Architecture. Graduated with Honors (First Class distinction).',
    createdAt: new Date().toISOString(),
  },
];

const defaultProjects: ProjectDto[] = [
  {
    id: 'proj-mock-1',
    projectName: 'High-Throughput Distributed Cache & In-Memory Key-Value Store',
    role: 'Lead Architect / C# & Redis',
    description: '<p>Engineered an asynchronous high-concurrency memory cache supporting LRU eviction and replication with sub-millisecond read/write latency.</p><ul><li>Zero-allocation serialization engine with <strong>99.999% uptime</strong>.</li><li>Benchmark throughput surpassing 1.2M operations per second.</li></ul>',
    link: 'https://github.com/example/distributed-cache',
    createdAt: new Date().toISOString(),
  },
];

const defaultSkills: SkillDto[] = [
  { id: 'sk-1', skillName: 'TypeScript', category: 'Languages & Core Stack', createdAt: new Date().toISOString() },
  { id: 'sk-2', skillName: 'C# / .NET 8', category: 'Languages & Core Stack', createdAt: new Date().toISOString() },
  { id: 'sk-3', skillName: 'React 19', category: 'Frameworks & Libraries', createdAt: new Date().toISOString() },
  { id: 'sk-4', skillName: 'Next.js', category: 'Frameworks & Libraries', createdAt: new Date().toISOString() },
  { id: 'sk-5', skillName: 'ASP.NET Core Web API', category: 'Frameworks & Libraries', createdAt: new Date().toISOString() },
  { id: 'sk-6', skillName: 'AWS (ECS & Lambda)', category: 'Cloud, DevOps & Databases', createdAt: new Date().toISOString() },
  { id: 'sk-7', skillName: 'Docker & Kubernetes', category: 'Cloud, DevOps & Databases', createdAt: new Date().toISOString() },
  { id: 'sk-8', skillName: 'PostgreSQL', category: 'Cloud, DevOps & Databases', createdAt: new Date().toISOString() },
  { id: 'sk-9', skillName: 'Microservices Architecture', category: 'Architecture & Practices', createdAt: new Date().toISOString() },
  { id: 'sk-10', skillName: 'System Design', category: 'Architecture & Practices', createdAt: new Date().toISOString() },
  { id: 'sk-11', skillName: 'Technical Leadership', category: 'Soft Skills & Leadership', createdAt: new Date().toISOString() },
];

export const CandidateProfile: React.FC = () => {
  const { currentUser, updateUser } = useAuth();

  // Dynamic CV Data State
  const [experiences, setExperiences] = useState<ExperienceDto[]>(defaultExperiences);
  const [educations, setEducations] = useState<EducationDto[]>(defaultEducations);
  const [projects, setProjects] = useState<ProjectDto[]>(defaultProjects);
  const [skills, setSkills] = useState<SkillDto[]>(defaultSkills);

  // Profile Edit State
  const [headline, setHeadline] = useState(
    currentUser?.headline || 'Senior Full-Stack Cloud Architect • Distributed Systems & React/Node.js'
  );
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 749-2041');
  const [location, setLocation] = useState(currentUser?.location || 'San Francisco, CA (Open to Remote)');
  const [bio, setBio] = useState(
    '<p>Passionate <strong>Senior Full-Stack Engineer</strong> with <strong>8+ years of experience</strong> designing and scaling fault-tolerant cloud services, modern web applications, and enterprise microservices.</p><p>Proven track record of leading cross-functional engineering teams, optimizing application performance, and deploying high-impact products from inception to millions of daily active users.</p>'
  );

  // Modal Control States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Full CV from Backend on Mount
  const loadCvData = useCallback(async () => {
    try {
      const cv = await candidateCvApi.getCv();
      if (cv.experiences && cv.experiences.length > 0) {
        setExperiences(cv.experiences);
      }
      if (cv.educations && cv.educations.length > 0) {
        setEducations(cv.educations);
      }
      if (cv.projects && cv.projects.length > 0) {
        setProjects(cv.projects);
      }
      if (cv.skills && cv.skills.length > 0) {
        setSkills(cv.skills);
      }
    } catch (err) {
      console.warn('Could not load dynamic CV from backend, using current state:', err);
    }
  }, []);

  useEffect(() => {
    loadCvData();
  }, [loadCvData]);

  // Update profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await candidateAuthApi.updateProfile({
        headline: headline.trim(),
        phone: phone.trim(),
        location: location.trim(),
      });
      updateUser(updated);
      setSuccessMsg('Digital CV details updated successfully!');
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error('Failed to update candidate profile:', err);
      setErrorMsg(err.message || 'Unable to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Delete Item Handlers
  const handleDeleteExperience = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this work experience?')) return;
    try {
      if (!id.startsWith('exp-mock-')) {
        await candidateCvApi.deleteExperience(id);
      }
      setExperiences((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg('Experience entry removed.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete experience.');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this education entry?')) return;
    try {
      if (!id.startsWith('edu-mock-')) {
        await candidateCvApi.deleteEducation(id);
      }
      setEducations((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg('Education entry removed.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete education.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this project?')) return;
    try {
      if (!id.startsWith('proj-mock-')) {
        await candidateCvApi.deleteProject(id);
      }
      setProjects((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg('Project removed.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete project.');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      if (!id.startsWith('sk-')) {
        await candidateCvApi.deleteSkill(id);
      }
      setSkills((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete skill.');
    }
  };

  const candidateDisplayName =
    currentUser?.fullName ||
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    'Jessica Taylor';

  const candidateEmail = currentUser?.email || 'jessica.taylor.cloud@example.com';

  const initials =
    candidateDisplayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'JT';

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
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="candidate-btn-edit"
              >
                <EditIcon />
                <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
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

            <p className="candidate-headline-text">
              {headline}
            </p>

            {/* Location & Quick Meta Tags */}
            <div className="candidate-meta-row">
              <span className="candidate-meta-item">
                <MapPinIcon />
                <span>{location}</span>
              </span>
              <span className="candidate-meta-divider">•</span>
              <span className="candidate-meta-item">
                <BriefcaseIcon />
                <span>8+ Years Experience</span>
              </span>
              <span className="candidate-meta-divider">•</span>
              <span className="candidate-meta-item">
                <BuildingIcon />
                <span>Immediate Availability</span>
              </span>
            </div>
          </div>

          {/* Contact & Social Links Row */}
          <div className="candidate-contact-bar">
            <a
              href={`mailto:${candidateEmail}`}
              className="candidate-contact-pill"
            >
              <MailIcon />
              <span>{candidateEmail}</span>
            </a>

            <a
              href={`tel:${phone}`}
              className="candidate-contact-pill"
            >
              <PhoneIcon />
              <span>{phone}</span>
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="candidate-contact-pill"
            >
              <LinkedInIcon />
              <span>LinkedIn</span>
            </a>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="candidate-contact-pill"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>

            <span className="candidate-contact-pill" style={{ cursor: 'default' }}>
              <GlobeLinkIcon />
              <span>Portfolio: https://jessicataylor.dev</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE EDIT PROFILE FORM (Toggled by "Edit Profile" Button)
          ========================================================================= */}
      {isEditingProfile && (
        <div className="candidate-edit-form-card">
          <div className="candidate-card-header">
            <div className="candidate-card-title-group">
              <div className="candidate-icon-box">
                <EditIcon />
              </div>
              <div className="candidate-card-title-text">
                <h2>Edit Digital CV Profile</h2>
                <p>Update your professional headline, location, and bio</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <label className="settings-label">Professional Headline / Target Job Title</label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="settings-input-field"
                  style={{ paddingLeft: '16px' }}
                />
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-form-group" style={{ marginBottom: 0 }}>
                <label className="settings-label">Phone Number</label>
                <div className="settings-input-wrapper">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="settings-input-field"
                    style={{ paddingLeft: '16px' }}
                  />
                </div>
              </div>

              <div className="settings-form-group" style={{ marginBottom: 0 }}>
                <label className="settings-label">Location & Work Preference</label>
                <div className="settings-input-wrapper">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="settings-input-field"
                    style={{ paddingLeft: '16px' }}
                  />
                </div>
              </div>
            </div>

            {/* Rich Text Editor for Bio */}
            <div className="settings-form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="settings-label" style={{ margin: 0 }}>
                  Professional Bio & Summary
                </label>
                <span style={{ fontSize: '11px', color: '#009e67', fontWeight: 700, background: '#e6f9f2', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <SparkleIcon />
                  <span>Rich Text Enabled</span>
                </span>
              </div>
              <div className="candidate-quill-wrapper">
                <ReactQuill
                  theme="snow"
                  value={bio}
                  onChange={setBio}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Share an executive summary of your background, key achievements, and technical passions..."
                />
              </div>
            </div>

            <div className="settings-actions-footer">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="settings-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="settings-btn-save"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

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
        </div>

        {/* Safely Rendered HTML Bio */}
        <div
          className="candidate-rich-text"
          dangerouslySetInnerHTML={sanitizeHtml(bio)}
        />

        {/* Quick Highlights Metrics Bar */}
        <div className="candidate-metrics-grid">
          <div className="candidate-metric-box">
            <span className="candidate-metric-label">Architecture</span>
            <span className="candidate-metric-val">99.99% Cloud Uptime</span>
            <span className="candidate-metric-sub">Enterprise AWS & Kubernetes SLA</span>
          </div>

          <div className="candidate-metric-box">
            <span className="candidate-metric-label">Engineering</span>
            <span className="candidate-metric-val">14+ Engineers Led</span>
            <span className="candidate-metric-sub">Agile sprints & architectural reviews</span>
          </div>

          <div className="candidate-metric-box">
            <span className="candidate-metric-label">Impact</span>
            <span className="candidate-metric-val">42% Latency Reduction</span>
            <span className="candidate-metric-sub">Optimized Redis & Kafka pipelines</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: TECHNICAL & SOFT SKILLS (Dynamic from DB)
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.keys(skillsByCategory).map((catName) => (
            <div key={catName} className="candidate-skill-category-group">
              <h3 className="candidate-skill-cat-title">{catName}</h3>
              <div className="candidate-skill-pills-wrap">
                {skillsByCategory[catName].map((skill) => (
                  <div key={skill.id} className="candidate-skill-chip">
                    <span>{skill.skillName}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="candidate-skill-delete-btn"
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: WORK EXPERIENCE (Dynamic from DB)
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

        {/* Timeline List */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="candidate-timeline-date">
                      {job.startDate} — {job.isCurrent ? 'Present' : job.endDate || 'Present'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(job.id)}
                      className="candidate-delete-icon-btn"
                      title="Delete experience"
                    >
                      <TrashIcon />
                    </button>
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
      </div>

      {/* =========================================================================
          SECTION 5: FEATURED PROJECTS & BUILDS (Dynamic from DB)
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

        <div className="candidate-grid-cards">
          {projects.map((proj) => (
            <div key={proj.id} className="candidate-item-card">
              <div className="candidate-item-card-top">
                <div className="candidate-item-card-badge-row">
                  <span className="candidate-item-category-tag">
                    {proj.role || 'Featured Project'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(proj.id)}
                    className="candidate-delete-icon-btn"
                    title="Delete project"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <h3 className="candidate-item-title">{proj.projectName}</h3>
                {proj.description && (
                  <div
                    className="candidate-rich-text"
                    dangerouslySetInnerHTML={sanitizeHtml(proj.description)}
                  />
                )}
              </div>

              {proj.link && (
                <div className="candidate-item-footer">
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="candidate-item-link"
                  >
                    <span>View Repository / Link</span>
                    <ExternalLinkIcon />
                  </a>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Live Artifact</span>
                </div>
              )}
            </div>
          ))}
        </div>
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
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(item.id)}
                      className="candidate-delete-icon-btn"
                      title="Delete education"
                    >
                      <TrashIcon />
                    </button>
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
      </div>

      {/* =========================================================================
          FLOATING ACTION BUTTON (SPEED DIAL)
          ========================================================================= */}
      <SpeedDialFab
        onAddExperience={() => setIsExpModalOpen(true)}
        onAddEducation={() => setIsEduModalOpen(true)}
        onAddProject={() => setIsProjModalOpen(true)}
        onAddSkill={() => setIsSkillModalOpen(true)}
      />

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      <AddExperienceModal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        onSuccess={(newExp) => {
          setExperiences((prev) => [newExp, ...prev]);
          setSuccessMsg(`Added experience at ${newExp.company}!`);
        }}
      />

      <AddEducationModal
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        onSuccess={(newEdu) => {
          setEducations((prev) => [newEdu, ...prev]);
          setSuccessMsg(`Added education from ${newEdu.institution}!`);
        }}
      />

      <AddProjectModal
        isOpen={isProjModalOpen}
        onClose={() => setIsProjModalOpen(false)}
        onSuccess={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setSuccessMsg(`Added project: ${newProj.projectName}!`);
        }}
      />

      <AddSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        onSuccess={(newSkill) => {
          setSkills((prev) => [...prev, newSkill]);
          setSuccessMsg(`Added skill: ${newSkill.skillName}!`);
        }}
      />
    </div>
  );
};
