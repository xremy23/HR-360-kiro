import React, { useState } from 'react';
import { ShieldAlert, Fingerprint, Sparkles, LogIn, ChevronRight } from 'lucide-react';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'responder' | 'employee';
  team?: string;
  phone?: string;
  address?: string;
}

interface CorporateSignInProps {
  users: UserType[];
  onSignIn: (user: UserType) => void;
  onAddAndSignIn: (user: UserType) => void;
  darkMode: boolean;
}

export function CorporateSignIn({
  users,
  onSignIn,
  onAddAndSignIn,
  darkMode,
}: CorporateSignInProps) {
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Magic Link holding states
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestToken, setLatestToken] = useState<string | null>(null);

  // Registration Flow state if email domain is valid but user isn't in roster
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    team: 'Guest Support',
    department: 'General Roster',
    address: 'Metro Manila, Philippines',
  });

  const handleEmailNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsRegistering(false);

    const email = emailInput.trim().toLowerCase();

    if (!email) {
      setErrorMsg(' Please enter your email address.');
      return;
    }

    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      setErrorMsg(' Please enter a valid email format (e.g name@domain.com).');
      return;
    }

    // Accept any email format - let backend handle org-level validation
    // Frontend should NOT restrict domains
    setIsLoading(true);

    let userExistsOnServer = false;
    try {
      // Use absolute URL to backend API
      const apiUrl = window.__API_URL__ || 'https://hr-crisis-360-backend-116253736511.asia-southeast1.run.app/api';
      const checkRes = await fetch(
        `${apiUrl}/auth/check-email?email=${encodeURIComponent(email)}`
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.success && checkData.exists) {
          userExistsOnServer = true;
        }
      }
    } catch (err) {
      console.warn('Pre-flight email proof check encountered handshaking problems:', err);
    }

    const match = userExistsOnServer || users.some((u) => u.email.toLowerCase() === email);

    if (match) {
      // Existing account -> dispatch magic link
      try {
        const apiUrl = window.__API_URL__ || 'https://hr-crisis-360-backend-116253736511.asia-southeast1.run.app/api';
        const res = await fetch(`${apiUrl}/auth/request-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.success) {
          setIsLinkSent(true);
          setSentEmail(email);
          setLatestToken(data.token || null);
        } else {
          setErrorMsg(data.error || 'Failed to issue magic secure token.');
        }
      } catch (err) {
        setErrorMsg('Network link error reaching verification node.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      // Not yet in roster -> prompt first-time profile creation activation
      // BUT ONLY if this is not a magic link verification redirect
      // If user is already authenticated, they shouldn't see this
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        // User is already authenticated, don't show registration form
        try {
          const user = JSON.parse(savedUser);
          console.log('User already authenticated, sending magic link for re-login');
          // Still send magic link for re-login
          const apiUrl = window.__API_URL__ || 'https://hr-crisis-360-backend-116253736511.asia-southeast1.run.app/api';
          const res = await fetch(`${apiUrl}/auth/request-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (data.success) {
            setIsLinkSent(true);
            setSentEmail(email);
            setLatestToken(data.token || null);
          } else {
            setErrorMsg(data.error || 'Failed to issue magic secure token.');
          }
        } catch (err) {
          setErrorMsg('Network error during re-authentication.');
        }
      } else {
        setIsRegistering(true);
      }
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerForm.name.trim()) {
      setErrorMsg('Please specify your full name.');
      return;
    }

    if (!registerForm.phone.trim()) {
      setErrorMsg('Please specify your physical emergency mobile line.');
      return;
    }

    const email = emailInput.trim().toLowerCase();
    setIsLoading(true);

    try {
      const apiUrl = window.__API_URL__ || 'https://hr-crisis-360-backend-116253736511.asia-southeast1.run.app/api';
      const res = await fetch(`${apiUrl}/auth/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          profile: {
            name: registerForm.name.trim(),
            phone: registerForm.phone.trim(),
            team: registerForm.team,
            department: registerForm.department,
            address: registerForm.address.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLinkSent(true);
        setSentEmail(email);
        setLatestToken(data.token || null);
      } else {
        setErrorMsg(data.error || 'Failed to dispatch activation token.');
      }
    } catch (err) {
      setErrorMsg('Roster registry link handshake error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-300 font-sans ${
        darkMode
          ? 'bg-[#080d0d] text-white'
          : 'bg-[#eef5f5] text-neutral-900'
      }`}
    >
      <div
        className={`w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 bg-white dark:bg-neutral-900 shadow-2xl rounded-[2.5rem] border overflow-hidden p-6 md:p-8 ${
          darkMode ? 'border-neutral-800' : 'border-stone-200/80'
        }`}
      >
        {/* Branding & Info Area (Left 5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-6 bg-[#024645] text-white rounded-[2rem] p-6 relative overflow-hidden shrink-0">
          {/* Subtle design accents */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#038F8D]/30 rounded-full blur-xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#8965F5]/25 rounded-full blur-xl" />

          <div className="space-y-4 relative z-10">
            <div className="bg-[#038F8D] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">
              <Fingerprint size={28} className="stroke-[2.5px] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h1 className="font-extrabold text-xl tracking-tight leading-tight">
                Crisis Preparedness & Safety Hub
              </h1>
              <p className="text-[11px] text-[#9AC0C3] uppercase font-black tracking-widest">
                Multi-Org Secured Network
              </p>
            </div>
            <p className="text-xs text-[#9AC0C3]/90 leading-relaxed">
              Authenticate via single-use magic login link directly. Create private safe workspaces,
              synchronize emergency contacts, and broadcast check-ins securely within your team's
              grid boundaries.
            </p>
          </div>

          <div className="space-y-3 relative z-10 pt-4 border-t border-[#027574]/40 text-[11px] text-stone-100">
            <p className="font-bold flex items-center gap-1.5 text-white">
              <Sparkles size={12} className="text-amber-300 fill-amber-300" />
              <span>Multi-Organization Guardrails:</span>
            </p>
            <ul className="space-y-1 opacity-90 pl-1">
              <li>• Guest Mode standby default</li>
              <li>• Encrypted token SMTP dispatch</li>
              <li>• Instant organization spawning</li>
              <li>• Private roster boundaries</li>
            </ul>
          </div>
        </div>

        {/* Authentication Form Area (Right 7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-4 p-2 md:p-4">
          <div>
            <span className="text-[9px] uppercase font-black tracking-wider text-[#038F8D] bg-[#038F8D]/10 px-2.5 py-1 rounded-full">
              Single Sign-In Portal
            </span>
            <h2 className="text-xl font-black mt-2 tracking-tight">Access Verification</h2>
            <p className="text-xs text-stone-400 mt-1">
              {isLinkSent
                ? 'We sent a single-use login link to complete authentication.'
                : 'Please authenticate with your email to receive a secure login link.'}
            </p>
          </div>

          {/* Form error warning */}
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-2xl flex items-start gap-2 animate-fade-in font-medium">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLinkSent ? (
            /* Part 3: Magic link sent confirmation state */
            <div className="space-y-4 animate-fade-in text-left">
              <div className="p-4 bg-[#038F8D]/10 dark:bg-[#038F8D]/5 border border-[#038F8D]/30 rounded-2xl space-y-3 text-xs leading-relaxed text-[#024645] dark:text-[#57dfdd]">
                <div className="flex items-center gap-2 font-bold text-[#038F8D] text-sm">
                  <Sparkles size={16} className="animate-bounce" />
                  <span>Magic Link Dispatched!</span>
                </div>
                <p>
                  A secure access link was dispatched to your email address <b>{sentEmail}</b>.
                  Please click on the link to activate your safe workstation session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkSent(false)}
                className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-stone-100 p-3 rounded-2xl font-bold text-xs border dark:border-neutral-750 transition"
              >
                Back to Sign In
              </button>
            </div>
          ) : !isRegistering ? (
            /* Part 1: Domain/Email Input Form */
            <form onSubmit={handleEmailNext} className="space-y-3.5">
              <div className="space-y-1.5 focus-within:ring-1 focus-within:ring-[#038F8D]/25 rounded-2xl transition">
                <label className="text-[10px] text-stone-400 font-extrabold uppercase select-none">
                  Corporate Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    placeholder="e.g. employee@corporate.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-xs p-3.5 rounded-2xl border border-stone-200 dark:border-neutral-800 bg-[#f9fbfb] dark:bg-neutral-950 text-neutral-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[#038F8D] transition-all font-medium"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#038F8D] hover:bg-[#027574] text-white p-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[99%] disabled:opacity-40"
              >
                {isLoading ? (
                  <span>Requesting Secure Link...</span>
                ) : (
                  <>
                    <span>Send Login Link</span>
                    <ChevronRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Part 2: Activation/First-Time Registration Profile completeness Form */
            <form onSubmit={handleRegistrationSubmit} className="space-y-3.5 animate-fade-in text-xs">
              <div className="p-3 bg-[#8965F5]/10 dark:bg-[#8965F5]/5 border border-[#8965F5]/20 text-neutral-800 dark:text-stone-200 rounded-2xl text-[11px] leading-relaxed">
                🎉 <b>Email Verified!</b> We authorized your email <b>{emailInput}</b>. Since you are
                not registered yet, complete these emergency details to receive an activation link.
                You will join your company's list as a <b>Guest</b>.
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-[#038F8D]">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="e.g. Jeremy Cariño"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-[#024645] dark:text-stone-100 focus:outline-none focus:border-[#038F8D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#038F8D]">
                    Crisis Mobile Line
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={isLoading}
                    placeholder="+63 918 888 2345"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-[#024645] dark:text-stone-100 focus:outline-none focus:border-[#038F8D]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-[#038F8D]">
                    Physical Home Address
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="e.g. Makati, Metro Manila"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950 text-[#024645] dark:text-stone-100 focus:outline-none focus:border-[#038F8D]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 rounded-xl font-bold border dark:border-neutral-700 text-neutral-800 dark:text-stone-100 transition-colors text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#8965F5] hover:bg-[#724ee5] text-white py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow disabled:opacity-40"
                >
                  <span>Request Activation Link</span>
                  <LogIn size={14} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CorporateSignIn;
