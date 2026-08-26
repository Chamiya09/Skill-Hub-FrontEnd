import {
  SparkleIcon,
  TargetIcon,
  TrophyIcon,
  KanbanIcon,
} from '../components/common/Icons'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  avatar: string
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sunil Perera',
    role: 'Chief Executive Officer',
    bio: '15+ years of enterprise SaaS leadership scaling corporate HRtech and recruitment platforms globally.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '2',
    name: 'Kamal Silva',
    role: 'Tech Lead & Architect',
    bio: 'Pioneering distributed cloud systems, real-time hiring pipelines, and robust enterprise ATS architectures.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    name: 'Nimal Fernando',
    role: 'AI & ML Engineer',
    bio: 'Specialist in deep neural candidate matching, automated resume vectorization, and zero-bias ranking algorithms.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '4',
    name: 'Chamod Ekanayaka',
    role: 'Full Stack & Product Engineer',
    bio: 'Crafting high-velocity hiring workflows, intuitive recruiter Kanban boards, and seamless candidate UI/UX.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
  },
]

export const About = () => {
  return (
    <>
      {/* About Us Hero Section */}
      <section className="about-hero-section">
        <div className="badge-tag">
          <SparkleIcon />
          <span>B2B AI-DRIVEN CORPORATE ATS</span>
        </div>

        <h1 className="about-hero-heading">
          The Future of Talent Acquisition with <span className="ai-text">Automated AI Workflows</span>
        </h1>

        <p className="about-hero-subtext">
          Skill Hub is an enterprise-grade, B2B AI-driven corporate Applicant Tracking System built to eliminate recruiting bottlenecks, automate screening workflows, and empower hiring teams with data-backed talent decisions.
        </p>
      </section>

      {/* The 'Why Skill Hub' Section */}
      <section className="mission-section">
        <div className="mission-card">
          <div className="mission-header">
            <div className="section-tag">
              <SparkleIcon />
              <span>WHY SKILL HUB</span>
            </div>
            <h2 className="mission-title">Built to Supercharge Corporate Hiring</h2>
          </div>

          <p className="mission-lead-text">
            Skill Hub reimagines the corporate recruitment lifecycle by combining autonomous intelligence with human-centered hiring workflows. Say goodbye to manual resume parsing and lost applications—Skill Hub accelerates time-to-hire by 70% while improving candidate quality.
          </p>

          <div className="mission-highlights-grid">
            <div className="highlight-item">
              <div className="highlight-icon-box">
                <TargetIcon />
              </div>
              <h3 className="highlight-title">AI Profile Screener</h3>
              <p className="highlight-description">
                Instantly parses and evaluates incoming resumes against role requirements, extracting verified hard skills and experience benchmarks.
              </p>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box">
                <TrophyIcon />
              </div>
              <h3 className="highlight-title">Smart Candidate Leaderboard</h3>
              <p className="highlight-description">
                Automatically scores and ranks applicants in real-time, giving recruiters an instant priority list of the highest-match talent.
              </p>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon-box">
                <KanbanIcon />
              </div>
              <h3 className="highlight-title">Efficient Kanban Pipeline</h3>
              <p className="highlight-description">
                An intuitive, drag-and-drop collaborative stage pipeline that keeps hiring managers, recruiters, and interviewers aligned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="team-header">
          <div className="section-tag">
            <SparkleIcon />
            <span>OUR TEAM</span>
          </div>
          <h2 className="team-title">Meet the Team Behind Skill Hub</h2>
          <p className="team-subtitle">
            Our engineering and leadership team is dedicated to building the most intelligent recruitment platform for modern enterprises.
          </p>
        </div>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <div className="team-card" key={member.id}>
              <div className="team-avatar-wrap">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="team-avatar-img"
                  loading="lazy"
                />
              </div>
              <h3 className="team-name">{member.name}</h3>
              <span className="team-role">{member.role}</span>
              <p className="team-bio">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
