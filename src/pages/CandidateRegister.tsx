import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SparkleIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  PhoneIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '../components/common/Icons';

/**
 * =========================================================================================
 * BACKEND READINESS & CONTROLLER INSTRUCTIONS FOR HEADLINE & PHONE:
 * =========================================================================================
 * To persist 'headline' and 'phone' in the candidate database record:
 *
 * 1. DTO Update (RegisterCandidateDto.cs):
 *    public class RegisterCandidateDto
 *    {
 *        [Required] public string FirstName { get; set; } = string.Empty;
 *        [Required] public string LastName { get; set; } = string.Empty;
 *        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
 *        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
 *        [MaxLength(150)] public string? Headline { get; set; }
 *        [MaxLength(30)] public string? Phone { get; set; }
 *    }
 *
 * 2. Service / Controller Implementation (AuthService.cs / CandidateAuthController.cs):
 *    var user = new User
 *    {
 *        FirstName = dto.FirstName.Trim(),
 *        LastName = dto.LastName.Trim(),
 *        Email = dto.Email.Trim().ToLowerInvariant(),
 *        Headline = dto.Headline?.Trim(),
 *        Phone = dto.Phone?.Trim(),
 *        Role = "CANDIDATE",
 *        CreatedAt = DateTime.UtcNow
 *    };
 *    user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
 *    await _context.Users.AddAsync(user);
 *    await _context.SaveChangesAsync();
 * =========================================================================================
 */

export const CandidateRegister: React.FC = () => {
  const navigate = useNavigate();
  const { candidateRegister, isAuthenticated, currentUser, isLoading: authLoading } = useAuth();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser) {
      if (currentUser.role?.toUpperCase() === 'CANDIDATE') {
        navigate('/candidate/profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!firstName.trim()) {
      setErrorMessage('Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage('Please enter your last name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      // Construct API payload with all extended professional fields
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        headline: headline.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase(),
        password,
      };

      const user = await candidateRegister(payload);

      setSuccessMessage(`Welcome to Skill Hub, ${user.fullName || user.firstName}! Redirecting to your candidate profile...`);
      setTimeout(() => {
        navigate('/candidate/profile', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error('Candidate registration error:', err);
      setErrorMessage(
        err.message || 'Unable to register candidate account. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Centered Clean Card - Premium Corporate Light Theme */}
      <div className="w-full max-w-[540px] bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 shadow-none">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#00b074] transition-colors"
          >
            <ArrowLeftIcon />
            <span>Back to Home</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00b074] flex items-center justify-center border border-emerald-100">
              <SparkleIcon />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              Skill<span className="text-[#00b074]">Hub</span>
            </span>
          </Link>
        </div>

        {/* Header Title Section */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[#00b074] text-xs font-bold tracking-wider mb-2.5 border border-emerald-100/60">
            <BriefcaseIcon />
            <span>CANDIDATE REGISTRATION</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Create Candidate Account
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
            Join premier technology talent with AI-powered resume matching and verified employer connections.
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2.5" role="alert">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5" role="status">
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name & Last Name (Side-by-side 2-column grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="candidateFirstName"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <UserIcon />
                </span>
                <input
                  id="candidateFirstName"
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="candidateLastName"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <UserIcon />
                </span>
                <input
                  id="candidateLastName"
                  type="text"
                  required
                  placeholder="e.g. Rivera"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Professional Headline / Target Job Title */}
          <div>
            <label
              htmlFor="candidateHeadline"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Professional Headline / Target Job Title
            </label>
            <div className="relative rounded-lg">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <BriefcaseIcon />
              </span>
              <input
                id="candidateHeadline"
                type="text"
                placeholder="e.g. Senior Software Engineer / UX Designer"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
                autoComplete="organization-title"
              />
            </div>
          </div>

          {/* Phone Number & Email Address (Side-by-side or stacked cleanly) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="candidatePhone"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Phone Number
              </label>
              <div className="relative rounded-lg">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <PhoneIcon />
                </span>
                <input
                  id="candidatePhone"
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="candidateEmail"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MailIcon />
                </span>
                <input
                  id="candidateEmail"
                  type="email"
                  required
                  placeholder="alex.rivera@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="candidatePassword"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                id="candidatePassword"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074] transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="candidateConfirmPassword"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockIcon />
              </span>
              <input
                id="candidateConfirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-2.5 text-sm bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                  password && confirmPassword && password !== confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-200 focus:border-[#00b074] focus:ring-1 focus:ring-[#00b074]'
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#00b074] focus:ring-[#00b074] cursor-pointer accent-[#00b074]"
            />
            <label htmlFor="agreeTerms" className="text-xs text-gray-500 leading-normal cursor-pointer select-none">
              I agree to the{' '}
              <span className="text-[#00b074] font-semibold hover:underline">Terms of Service</span> and{' '}
              <span className="text-[#00b074] font-semibold hover:underline">Privacy Policy</span>.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#00b074] hover:bg-[#009663] text-white font-bold text-sm shadow-none flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Creating Candidate Account...</span>
            ) : (
              <>
                <span>Create Free Candidate Account</span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Card Footer & Cross-portal Navigation Links */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-3">
          <p className="text-xs sm:text-sm text-gray-500">
            Already have a candidate account?{' '}
            <Link to="/candidate-login" className="font-semibold text-[#00b074] hover:text-[#009663] transition-colors">
              Candidate Sign In
            </Link>
          </p>

          <div className="pt-2 border-t border-gray-50 text-xs text-gray-400">
            Looking to hire talent?{' '}
            <Link to="/company-register" className="font-semibold text-[#00b074] hover:text-[#009663] transition-colors">
              Register Employer Company
            </Link>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 pt-1">
            <ShieldCheckIcon />
            <span>Encrypted Credentials • 256-Bit SSL Protection</span>
          </div>
        </div>

      </div>
    </div>
  );
};
