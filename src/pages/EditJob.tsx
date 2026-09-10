import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JobForm, type JobFormData } from '../components/jobs/JobForm';
import { CheckIcon, ClockIcon } from '../components/common/Icons';

const mockJobDatabase: Record<string, JobFormData> = {
  'vac-1': {
    title: 'Senior Full Stack Engineer (React / .NET Core)',
    department: 'Engineering',
    location: 'Remote (APAC / Singapore)',
    type: 'Full-time',
    experienceLevel: 'Senior Level (5+ Yrs)',
    status: 'Active',
    salaryRange: '$135,000 - $175,000 USD / yr',
    description: `<h2>Role Overview</h2><p>We are seeking a seasoned Senior Full Stack Engineer to lead the architecture and implementation of our next-generation Talent Intelligence platform.</p><h3>Key Responsibilities</h3><ul><li>Architect and build resilient, distributed RESTful APIs using ASP.NET Core 9 and PostgreSQL.</li><li>Develop pixel-perfect, responsive UI components with React 19, TypeScript, and modern design systems.</li><li>Optimize database indexing and real-time WebSocket communications.</li><li>Mentor intermediate engineers through code reviews and design docs.</li></ul><h3>Required Qualifications</h3><ul><li>5+ years of production experience with C# / .NET Core and React.</li><li>Solid understanding of relational databases and Entity Framework Core.</li><li>Strong grasp of modern CSS, responsive design, and web accessibility.</li></ul>`,
    benefits: `<h3>What We Offer</h3><ul><li>Competitive base salary + equity stock options.</li><li>100% remote work flexibility with home office setup stipend ($1,500).</li><li>Comprehensive health, dental, and vision coverage for you and dependents.</li><li>Annual learning and conference budget ($2,500/year).</li><li>Flexible paid time off (25 days minimum) plus public holidays.</li></ul>`,
  },
  'vac-2': {
    title: 'Staff AI / ML Infrastructure Architect',
    department: 'AI Research',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Lead / Staff (7+ Yrs)',
    status: 'Active',
    salaryRange: '$220,000 - $280,000 USD / yr',
    description: `<h2>Role Overview</h2><p>We are looking for a Staff AI/ML Infrastructure Architect to spearhead our high-throughput vector database clusters and GPU orchestration framework.</p><h3>Key Responsibilities</h3><ul><li>Design and operate multi-node GPU training and inference clusters (Triton, vLLM, Ray).</li><li>Scale vector database infrastructure (Milvus, Pinecone, pgvector) for billion-scale embeddings.</li><li>Enforce enterprise data isolation and zero-leakage LLM governance.</li></ul><h3>Required Qualifications</h3><ul><li>8+ years in distributed systems with 4+ years dedicated to ML/AI production infrastructure.</li><li>Deep mastery of Python, C++, CUDA optimizations, and Kubernetes operator architectures.</li></ul>`,
    benefits: `<h3>What We Offer</h3><ul><li>Top-tier compensation package with meaningful founding-tier equity.</li><li>Premium health, wellness, and commuter benefits.</li><li>Latest compute hardware (M3 Max / Dual RTX workstations).</li></ul>`,
  },
  'vac-3': {
    title: 'Lead Product Designer (Enterprise Design Systems)',
    department: 'Product Design',
    location: 'London, UK (Remote)',
    type: 'Full-time',
    experienceLevel: 'Senior Level (5+ Yrs)',
    status: 'Active',
    salaryRange: '£95,000 - £125,000 GBP / yr',
    description: `<h2>Role Overview</h2><p>Lead our global design system and craft intuitive, state-of-the-art enterprise ATS workflows that delight recruitment teams worldwide.</p><h3>Key Responsibilities</h3><ul><li>Govern and evolve our Figma enterprise token system and multi-brand component library.</li><li>Conduct user research sessions with enterprise recruiters to eliminate UX friction.</li><li>Create high-fidelity interactive prototypes and interaction specifications.</li></ul><h3>Required Qualifications</h3><ul><li>6+ years UX/UI design experience for SaaS or B2B enterprise software applications.</li><li>Advanced expertise in Figma variables, auto-layout, and token-based design systems.</li></ul>`,
    benefits: `<h3>What We Offer</h3><ul><li>Generous pension matching, private medical insurance, and 28 days paid leave.</li><li>Full home office equipment budget and flexible asynchronous work hours.</li></ul>`,
  },
  'vac-4': {
    title: 'Principal Cloud Security & DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote (Global)',
    type: 'Contract',
    experienceLevel: 'Principal / Executive (10+ Yrs)',
    status: 'Active',
    salaryRange: '$110 - $145 USD / hr',
    description: `<h2>Role Overview</h2><p>Oversee multi-cloud AWS & Azure infrastructure, SOC-2 compliance automation, and implement zero-trust Kubernetes cluster network policies.</p><h3>Key Responsibilities</h3><ul><li>Maintain Terraform infrastructure-as-code across 4 global AWS/GCP regions.</li><li>Execute automated vulnerability scans and container hardening pipelines.</li><li>Automate deployment pipelines using GitHub Actions, ArgoCD, and Helm charts.</li></ul><h3>Required Qualifications</h3><ul><li>8+ years in DevOps and cloud infrastructure engineering with SOC-2 experience.</li></ul>`,
    benefits: `<h3>What We Offer</h3><ul><li>Long-term rolling contract with competitive hourly rate and performance bonuses.</li></ul>`,
  },
  'vac-5': {
    title: 'Senior Technical Product Manager - ATS Platforms',
    department: 'Product',
    location: 'New York, NY (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Senior Level (5+ Yrs)',
    status: 'Draft',
    salaryRange: '$160,000 - $200,000 USD / yr',
    description: `<h2>Role Overview</h2><p>Define product strategy, developer APIs, and candidate discovery algorithms for the Skill Hub talent ecosystem.</p><h3>Key Responsibilities</h3><ul><li>Translate customer recruitment friction points into concise PRDs and engineering specifications.</li><li>Drive roadmap prioritization using qualitative feedback and quantitative product analytics.</li></ul>`,
    benefits: `<h3>What We Offer</h3><ul><li>Competitive base salary, 401(k) matching, and comprehensive healthcare.</li></ul>`,
  },
  'vac-6': {
    title: 'Junior QA Automation Engineer',
    department: 'Engineering',
    location: 'Austin, TX',
    type: 'Full-time',
    experienceLevel: 'Entry Level (0-2 Yrs)',
    status: 'Closed',
    salaryRange: '$75,000 - $95,000 USD / yr',
    description: `<h2>Role Overview</h2><p>Position filled. The role involves developing Playwright and Cypress end-to-end automated regression test suites for web applications.</p>`,
    benefits: `<h3>What We Offer</h3><ul><li>Health insurance, 401(k), paid parental leave, and mentorship programs.</li></ul>`,
  },
};

export const EditJob = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobFormData | null>(null);

  // Load existing vacancy data
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (id && mockJobDatabase[id]) {
        setJobData(mockJobDatabase[id]);
      } else {
        // Fallback
        setJobData({
          title: 'Senior Enterprise Solutions Architect',
          department: 'Engineering',
          location: 'Remote (Worldwide)',
          type: 'Full-time',
          experienceLevel: 'Senior Level (5+ Yrs)',
          status: 'Active',
          salaryRange: '$145,000 - $190,000 USD / yr',
          description: `<h2>Role Overview</h2><p>Lead enterprise-grade architectural design, client technical integrations, and scalable cloud solutions for our global hiring intelligence platform.</p><h3>Key Responsibilities</h3><ul><li>Design high-availability cloud architecture on AWS/Azure.</li><li>Collaborate with cross-functional engineering teams to implement microservices.</li><li>Provide technical thought leadership and conduct architectural reviews.</li></ul>`,
          benefits: `<h3>What We Offer</h3><ul><li>Competitive salary, equity options, comprehensive healthcare, and flexible remote hours.</li></ul>`,
        });
      }
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [id]);

  const handleEditSubmit = (data: JobFormData) => {
    setIsSubmitting(true);

    // Simulate updating existing vacancy
    setTimeout(() => {
      setIsSubmitting(false);
      setToastMessage(`Job vacancy "${data.title}" updated successfully!`);

      setTimeout(() => {
        navigate(`/dashboard/jobs/${id || 'vac-1'}`);
      }, 1000);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="job-form-wrapper">
        <div className="job-form-inner-container">
          <div className="job-form-card-container">
            <div className="job-edit-loading-state">
              <ClockIcon />
              <span>Loading job vacancy details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-job-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="job-details-toast">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <JobForm
        initialData={jobData || undefined}
        onSubmit={handleEditSubmit}
        isEditMode={true}
        isSubmitting={isSubmitting}
        formTitle="Edit Job Vacancy"
        formSubtitle="Modify the role requirements, hiring criteria, compensation range, and candidate matching parameters."
        backLinkUrl={`/dashboard/jobs/${id || 'vac-1'}`}
        backLinkLabel="Back to Job Details"
        badgeText="REQUISITION MANAGEMENT"
      />
    </div>
  );
};
