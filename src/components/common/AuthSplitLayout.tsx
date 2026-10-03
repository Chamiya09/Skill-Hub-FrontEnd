import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SparkleIcon } from './Icons';

type AuthSplitLayoutProps = {
  children: ReactNode;
  eyebrow: string;
  quote: string;
  description: string;
};

export const AuthSplitLayout = ({ children, eyebrow, quote, description }: AuthSplitLayoutProps) => (
  <div className="auth-split-layout">
    <aside className="auth-split-story">
      <Link to="/" className="auth-split-brand">
        <span className="auth-split-brand-icon"><SparkleIcon /></span>
        <span>Skill<span>Hub</span></span>
      </Link>

      <div className="auth-split-story-copy">
        <span className="auth-split-eyebrow">{eyebrow}</span>
        <h2>{quote}</h2>
        <p>{description}</p>
      </div>

      <div className="auth-split-story-footer">
        <div className="auth-split-rule" />
        <div className="auth-split-pillars" aria-label="Skills, people, and opportunity">
          <span>Skills</span><i /><span>People</span><i /><span>Opportunity</span>
        </div>
        <span className="auth-split-caption">A smarter way to move forward.</span>
      </div>
    </aside>

    <main className="auth-split-main">
      <div className="auth-split-main-inner">
        <div className="auth-split-topbar">
          <span className="auth-split-secure-label"><span /> Secure sign in</span>
        </div>
        {children}
      </div>
    </main>
  </div>
);