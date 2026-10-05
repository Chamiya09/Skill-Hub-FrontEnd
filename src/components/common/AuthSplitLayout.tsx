import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  Building2,
  Briefcase,
  TrendingUp,
  Star,
  Activity,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';
import './AuthCreativeShowcase.css';

export type AuthSplitLayoutProps = {
  children: ReactNode;
  eyebrow: string;
  quote: string;
  description: string;
  portalType?: 'company' | 'candidate' | 'admin';
  transitioning?: boolean;
};

// 1. Company / Employer Creative Showcase
const CompanyCreativeShowcase: React.FC = () => (
  <div className="auth-creative-showcase space-y-3.5 my-5">
    {/* Floating Candidate Match Card */}
    <div className="auth-glass-card p-4 rounded-2xl text-white relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-md">
            LC
          </div>
          <div>
            <div className="text-[13px] font-bold text-white flex items-center gap-1.5">
              <span>Liam Chen</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-semibold">Staff Systems Engineer</span>
            </div>
            <div className="text-[11px] text-emerald-100/70 font-medium">8+ Yrs Experience • San Francisco, CA</div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full text-[11.5px] font-black bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-xs flex items-center gap-1">
          <Sparkles size={11} className="text-emerald-300" />
          <span>98.6% Fit</span>
        </div>
      </div>

      {/* Verified Skills Telemetry */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-[11px]">
        <div className="p-2 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold truncate">Go Concurrency</div>
          <div className="text-emerald-400 font-black text-[11.5px]">Top 1% Score</div>
        </div>
        <div className="p-2 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold truncate">Cloud Arch</div>
          <div className="text-emerald-400 font-black text-[11.5px]">96% Rating</div>
        </div>
        <div className="p-2 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold truncate">PostgreSQL</div>
          <div className="text-emerald-400 font-black text-[11.5px]">High-Perf</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-emerald-100/80 pt-2 border-t border-white/10">
        <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
          <CheckCircle2 size={12} className="text-emerald-400" />
          Proctored Code Validation Passed
        </span>
        <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider">
          Interview Ready
        </span>
      </div>
    </div>

    {/* Live Hiring Telemetry Grid */}
    <div className="grid grid-cols-2 gap-2.5">
      <div className="p-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Active Requisitions</span>
          <Briefcase size={13} className="text-emerald-400" />
        </div>
        <div className="text-lg font-black text-white">14 Live Roles</div>
        <div className="text-[10.5px] text-emerald-300 font-semibold mt-0.5">42 Verified Hires</div>
      </div>
      <div className="p-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Time-to-Hire</span>
          <TrendingUp size={13} className="text-emerald-400" />
        </div>
        <div className="text-lg font-black text-white">11 Days Avg</div>
        <div className="text-[10.5px] text-emerald-300 font-semibold mt-0.5">4.2x Industry Velocity</div>
      </div>
    </div>

    {/* Trust Seal */}
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/25 border border-white/10 text-[11.5px] text-emerald-100/90 font-medium">
      <ShieldCheck size={15} className="text-emerald-400 flex-shrink-0" />
      <span>Enterprise SOC-2 Type II Certified • Zero-Bias Assessment AI</span>
    </div>
  </div>
);

// 2. Candidate Creative Showcase
const CandidateCreativeShowcase: React.FC = () => (
  <div className="auth-creative-showcase space-y-3.5 my-5">
    {/* Verified Talent Passport Card */}
    <div className="auth-glass-card p-4 rounded-2xl text-white relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md">
            SJ
          </div>
          <div>
            <div className="text-[13px] font-bold text-white flex items-center gap-1.5">
              <span>Sarah Jenkins</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-semibold">Staff React Architect</span>
            </div>
            <div className="text-[11px] text-emerald-100/70 font-medium">Verified Talent Passport #SKH-8942</div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full text-[11.5px] font-black bg-amber-400/20 text-amber-200 border border-amber-300/30 shadow-xs flex items-center gap-1">
          <Award size={12} className="text-amber-300" />
          <span>Top 1%</span>
        </div>
      </div>

      {/* Verified Skills */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-[11px]">
        <div className="p-2 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold truncate">React 19 & TS</div>
          <div className="text-emerald-400 font-black text-[11.5px]">98% Proctored</div>
        </div>
        <div className="p-2 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold truncate">System Design</div>
          <div className="text-emerald-400 font-black text-[11.5px]">Mastery L5</div>
        </div>
        <div className="p-2 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold truncate">Algorithms</div>
          <div className="text-emerald-400 font-black text-[11.5px]">100% Passed</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-emerald-100/80 pt-2 border-t border-white/10">
        <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
          <CheckCircle2 size={12} className="text-emerald-400" />
          Directly Discoverable by Top Tech Companies
        </span>
        <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider">
          Active Clearance
        </span>
      </div>
    </div>

    {/* Inbound Interview Invitation Card */}
    <div className="p-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md text-white flex items-center justify-between gap-3">
      <div>
        <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={11} />
          Inbound Interview Invitation
        </div>
        <div className="text-[13px] font-bold text-white mt-0.5">Staff Frontend Infrastructure Engineer</div>
        <div className="text-[11px] text-emerald-100/70 font-medium">Stripe • $170,000 - $195,000 • Remote</div>
      </div>
      <div className="px-2.5 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-bold text-[11px] whitespace-nowrap">
        Fast Track
      </div>
    </div>

    {/* Testimonial Quote */}
    <div className="flex items-start gap-2 px-3.5 py-2 rounded-xl bg-black/25 border border-white/10 text-[11px] text-emerald-100/90 font-medium italic">
      <Star size={13} className="text-amber-300 flex-shrink-0 mt-0.5" />
      <span>"Skill Hub bypassed traditional resume filters. My proctored assessment score got me 3 interviews in a week."</span>
    </div>
  </div>
);

// 3. Admin Creative Showcase
const AdminCreativeShowcase: React.FC = () => (
  <div className="auth-creative-showcase space-y-3.5 my-5">
    {/* Zero-Trust Telemetry Card */}
    <div className="auth-glass-card p-4 rounded-2xl text-white relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-700 text-white flex items-center justify-center font-black text-xs shadow-md">
            <Shield size={16} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white flex items-center gap-1.5">
              <span>Skill Hub Master Console</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-emerald-100/70 font-medium">Master Cluster Security Telemetry</div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
          Enforced 2FA
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2.5 text-[11px]">
        <div className="p-2.5 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold">Isolated Sandboxes</div>
          <div className="text-emerald-400 font-black text-[12.5px]">28 Active Nodes</div>
        </div>
        <div className="p-2.5 rounded-xl bg-black/25 border border-white/10 text-center">
          <div className="text-emerald-200 font-bold">Audit Ledger</div>
          <div className="text-emerald-400 font-black text-[12.5px]">SHA-256 Verified</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-emerald-100/80 pt-2 border-t border-white/10">
        <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
          <ShieldCheck size={12} className="text-emerald-400" />
          Zero-Trust RBAC Policy Live
        </span>
        <span className="text-[10px] text-emerald-200 font-mono">cluster-id: #MTR-01</span>
      </div>
    </div>

    {/* Multi-Region Node Map */}
    <div className="p-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md text-white">
      <div className="flex items-center justify-between text-[10.5px] font-bold text-emerald-200 uppercase tracking-wider mb-1.5">
        <span>Global High-Availability Node Map</span>
        <Activity size={13} className="text-emerald-400" />
      </div>
      <div className="flex items-center flex-wrap gap-3 text-xs font-semibold text-white">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> US-East (Virginia)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> EU-Central (Frankfurt)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> AP-South (Singapore)</span>
      </div>
    </div>
  </div>
);

export const AuthSplitLayout = ({
  children,
  eyebrow,
  quote,
  description,
  portalType,
  transitioning = false,
}: AuthSplitLayoutProps) => {
  // Resolve portal type from prop or eyebrow fallback
  const resolvedPortal =
    portalType ||
    (eyebrow?.toUpperCase().includes('CANDIDATE') ||
    eyebrow?.toUpperCase().includes('GROW') ||
    eyebrow?.toUpperCase().includes('TALENT')
      ? 'candidate'
      : eyebrow?.toUpperCase().includes('ADMIN') ||
        eyebrow?.toUpperCase().includes('OPERATIONS') ||
        eyebrow?.toUpperCase().includes('RESTRICTED')
      ? 'admin'
      : 'company');

  return (
    <div className="auth-split-layout">
      {/* 1. Left Creative Showcase Story Panel */}
      <aside className="auth-split-story">
        {/* Ambient Lighting Orbs */}
        <div className="auth-ambient-orb-1" />
        <div className="auth-ambient-orb-2" />

        {/* Top Header Bar */}
        <div className="auth-story-topbar">
          <Link to="/" className="auth-split-brand" title="Skill Hub Home">
            <span className="auth-split-brand-icon">
              <Sparkles size={20} />
            </span>
            <span>
              Skill<span className="text-emerald-300">Hub</span>
            </span>
          </Link>

          <div className="auth-status-pill">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {resolvedPortal === 'company'
                ? 'AI Match Engine Live'
                : resolvedPortal === 'candidate'
                ? '4,500+ Roles Live'
                : 'Zero-Trust Gate Live'}
            </span>
          </div>
        </div>

        {/* Main Story Copy */}
        <div className="auth-split-story-copy">
          <span className="auth-split-eyebrow">
            <Zap size={13} className="text-emerald-400" />
            {eyebrow}
          </span>
          <h2>{quote}</h2>
          <p>{description}</p>
        </div>

        {/* Dynamic Creative Visual Showcase Widget */}
        {resolvedPortal === 'company' && <CompanyCreativeShowcase />}
        {resolvedPortal === 'candidate' && <CandidateCreativeShowcase />}
        {resolvedPortal === 'admin' && <AdminCreativeShowcase />}

        {/* Bottom Metrics Counter Strip */}
        <div className="auth-story-footer">
          <div className="auth-metrics-grid">
            {resolvedPortal === 'company' ? (
              <>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">120,000+</div>
                  <div className="auth-metric-label">Verified Engineers</div>
                </div>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">4.2x Faster</div>
                  <div className="auth-metric-label">Hiring Velocity</div>
                </div>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">Zero-Bias</div>
                  <div className="auth-metric-label">AI Code Testing</div>
                </div>
              </>
            ) : resolvedPortal === 'candidate' ? (
              <>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">4,500+</div>
                  <div className="auth-metric-label">Active Vacancies</div>
                </div>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">85% Rate</div>
                  <div className="auth-metric-label">Direct Interview Call</div>
                </div>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">Top 1%</div>
                  <div className="auth-metric-label">Skills Certification</div>
                </div>
              </>
            ) : (
              <>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">99.99%</div>
                  <div className="auth-metric-label">SLA Uptime</div>
                </div>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">Sub-ms</div>
                  <div className="auth-metric-label">Audit Telemetry</div>
                </div>
                <div className="auth-metric-box">
                  <div className="auth-metric-value">Zero-Trust</div>
                  <div className="auth-metric-label">Master Clearance</div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Right Main Content Panel */}
      <main className="auth-split-main">
        <div className="auth-split-main-inner">
          {children}
        </div>
      </main>

      {/* Transitioning Fullscreen Overlay */}
      {transitioning && (
        <div className="auth-transition-overlay" role="status" aria-label="Authenticating with Skill Hub">
          <div className="auth-transition-content">
            <span className="auth-transition-mark">
              <Sparkles size={28} />
            </span>
            <span className="auth-transition-wordmark">
              Skill<span className="text-emerald-400">Hub</span>
            </span>
            <span className="auth-transition-track">
              <span />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};