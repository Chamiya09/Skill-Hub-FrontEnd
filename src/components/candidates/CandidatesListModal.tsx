import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApplicationsApi, type JobDto } from '../../services/api';
import { CandidateProfileReadOnly } from './CandidateProfileReadOnly';
import './CandidatesListModal.css';
import {
  ClockIcon,
  MailIcon,
  MapPinIcon,
  SearchIcon,
  SparkleIcon,
  UsersIcon,
  XIcon,
} from '../common/Icons';

export interface DisplayApplicant {
  id: string;
  candidateId: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  stage: string;
  skills: string[];
  avatarUrl?: string;
  avatarBg: string;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #00b074, #008759)',
  'linear-gradient(135deg, #2563eb, #1d4ed8)',
  'linear-gradient(135deg, #0f766e, #115e59)',
  'linear-gradient(135deg, #7c3aed, #6d28d9)',
];

const getGradientForName = (name: string): string => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

interface CandidatesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDto | null;
}

export const CandidatesListModal: React.FC<CandidatesListModalProps> = ({ isOpen, onClose, job }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [applicants, setApplicants] = useState<DisplayApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !job?.id) return;

    void Promise.resolve().then(async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSearchQuery('');
        setSelectedCandidateId(null);
        const data = await jobApplicationsApi.getJobApplicants(job.id);
        setApplicants((data || []).map((app) => ({
          id: app.id,
          candidateId: app.candidateId,
          name: app.candidateName || 'Unnamed Candidate',
          headline: app.candidateHeadline || 'Candidate Profile',
          email: app.candidateEmail || '',
          phone: app.candidatePhone || '',
          location: app.candidateLocation || 'Location not specified',
          appliedDate: app.appliedDate
            ? new Date(app.appliedDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })
            : 'Recent',
          stage: app.status || 'Applied',
          skills: app.skills || [],
          avatarUrl: app.candidateAvatarUrl,
          avatarBg: getGradientForName(app.candidateName || 'Candidate'),
        })));
      } catch (requestError: unknown) {
        console.error('Error fetching job applicants:', requestError);
        setError(requestError instanceof Error
          ? requestError.message
          : 'Failed to load applicants for this job requisition.');
      } finally {
        setIsLoading(false);
      }
    });
  }, [isOpen, job?.id]);

  const filteredCandidates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return applicants.filter((candidate) => !query
      || candidate.name.toLowerCase().includes(query)
      || candidate.headline.toLowerCase().includes(query)
      || candidate.skills.some((skill) => skill.toLowerCase().includes(query)));
  }, [applicants, searchQuery]);

  if (!isOpen || !job) return null;

  const goToAiScreening = () => {
    onClose();
    navigate('/pipelines');
  };

  return (
    <div className="candidates-modal-backdrop" onClick={onClose}>
      <div className="candidates-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="candidates-modal-header">
          <div className="candidates-modal-header-left">
            <div className="candidates-modal-badges">
              <span className="candidates-modal-req-tag">REQ #{job.id.substring(0, 8).toUpperCase()}</span>
              <span className="candidates-modal-dept-badge">{job.department}</span>
              <span className="candidates-modal-ai-badge"><UsersIcon /><span>Applicant Directory</span></span>
            </div>
            <h2 className="candidates-modal-title">{job.title}</h2>
            <div className="candidates-modal-meta-row">
              <span className="candidates-modal-meta-item highlight"><UsersIcon /><span>{applicants.length} Total Applicants</span></span>
              <span>•</span><span className="candidates-modal-meta-item"><MapPinIcon /><span>{job.location}</span></span>
              <span>•</span><span className="candidates-modal-meta-item"><ClockIcon /><span>{job.employmentType}</span></span>
            </div>
          </div>
          <button type="button" className="candidates-modal-close-btn" onClick={onClose} aria-label="Close applicants"><XIcon /></button>
        </div>

        {applicants.length > 0 && (
          <div className="candidates-modal-ai-bar candidates-modal-screening-link">
            <div><strong>Ready to evaluate these candidates?</strong><span>Use the dedicated AI Screening workspace for scoring and shortlisting.</span></div>
            <button type="button" className="candidates-modal-run-ai-btn" onClick={goToAiScreening}><SparkleIcon /><span>✨ Go to AI Screening</span></button>
          </div>
        )}

        {error && <div className="p-4 mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}

        <div className="candidates-modal-filter-bar">
          <div className="candidates-modal-search-box"><span className="candidates-modal-search-icon"><SearchIcon /></span>
            <input type="text" placeholder="Search applicant name, role, or skill..." value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)} className="candidates-modal-search-input" />
          </div>
          <div className="text-xs font-semibold text-slate-500">Showing <strong className="text-slate-800">{filteredCandidates.length}</strong> of {applicants.length} applicants</div>
        </div>

        <div className="candidates-modal-body">
          {isLoading ? <div className="py-16 text-center space-y-3"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-xs font-semibold text-slate-500">Loading applicants...</p></div>
            : filteredCandidates.length === 0 ? <div className="py-12 text-center"><div className="w-12 h-12 bg-slate-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3"><UsersIcon /></div><h3 className="text-base font-bold text-gray-900 mb-1">{applicants.length === 0 ? 'No applicants yet' : 'No candidates match your search'}</h3><p className="text-sm text-gray-500">{applicants.length === 0 ? 'New applications will appear here.' : 'Try a different name, role, or skill.'}</p></div>
            : filteredCandidates.map((candidate) => {
              const initials = candidate.name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase();
              return <div key={candidate.id} className="candidates-modal-row cursor-pointer" onClick={() => setSelectedCandidateId(candidate.candidateId)}>
                <div className="candidates-modal-row-left">{candidate.avatarUrl
                  ? <img src={candidate.avatarUrl} alt={candidate.name} className="candidates-modal-avatar object-cover" />
                  : <div className="candidates-modal-avatar" style={{ background: candidate.avatarBg }}>{initials}</div>}
                  <div className="candidates-modal-candidate-info"><h4 className="candidates-modal-candidate-name">{candidate.name}</h4><p className="candidates-modal-candidate-headline">{candidate.headline}</p>
                    <div className="candidates-modal-candidate-meta"><span className="flex items-center gap-1"><MailIcon /> {candidate.email}</span><span>•</span><span className="flex items-center gap-1"><MapPinIcon /> {candidate.location}</span><span>•</span><span className="flex items-center gap-1"><ClockIcon /> Applied {candidate.appliedDate}</span></div>
                  </div>
                </div>
                <div className="candidates-modal-row-right" onClick={(event) => event.stopPropagation()}><div className="hidden lg:flex items-center gap-1">{candidate.skills.slice(0, 3).map((skill) => <span key={skill} className="candidates-modal-skill-tag">{skill}</span>)}</div><span className="candidates-modal-stage-badge applied"><span className="candidates-modal-stage-dot" />{candidate.stage}</span><button type="button" className="candidates-modal-action-btn" onClick={() => setSelectedCandidateId(candidate.candidateId)}>View CV →</button></div>
              </div>;
            })}
        </div>

        <div className="candidates-modal-footer"><button type="button" className="candidates-modal-dismiss-btn" onClick={onClose}>Close</button></div>
      </div>

      {selectedCandidateId && <><div className="candidate-cv-drawer-overlay" onClick={(event) => { event.stopPropagation(); setSelectedCandidateId(null); }} /><div className="candidate-cv-drawer" style={{ width: '100%', maxWidth: '820px', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}><CandidateProfileReadOnly candidateId={selectedCandidateId} onClose={() => setSelectedCandidateId(null)} /></div></>}
    </div>
  );
};
