import {AlertCircle, Lock, ShieldCheck, X} from 'lucide-react';
import React, {useState} from 'react';
import {useAuth} from '../context/AuthContext.tsx';
import {apiRequest} from '../lib/api.ts';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignInModal({open, onClose}: SignInModalProps) {
  const {login, health, refreshHealth} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  if (!open) return null;

  const dbConnected = health?.database.state === 'connected';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'volunteer' | 'coordinator') => {
    setError(null);
    if (role === 'volunteer') {
      setEmail('amina.volunteer@dignitylink.org');
      setPassword('DignityVol2026!');
    } else {
      setEmail('grace.coordinator@dignitylink.org');
      setPassword('DignityCoord2026!');
    }
  };

  const handleRetryDb = async () => {
    setReconnecting(true);
    try {
      await apiRequest('/api/health/reconnect', {method: 'POST'});
      await refreshHealth();
    } catch {
      await refreshHealth();
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#172323]/55 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#DDD5C7] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#EFEAE0] pb-4">
          <div>
            <p className="text-xs font-medium text-[#556363]">DignityLink Access Control</p>
            <h2 id="signin-modal-title" className="mt-1 text-xl font-bold text-[#172323]">
              Sign in to workspace
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#556363] transition-colors hover:bg-[#F7F4EE] hover:text-[#172323]"
            aria-label="Close sign in dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!dbConnected && (
          <div className="mt-4 rounded-lg border border-[#E5B8A8] bg-[#FDF4F0] p-3.5 text-sm text-[#7A321C]">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B85A3A]" />
              <div className="space-y-1.5">
                <p className="font-semibold">MongoDB connection required</p>
                <p className="text-xs leading-relaxed">
                  {health?.database.lastError ||
                    'Set MONGODB_URI in your .env file to connect to MongoDB Atlas or local MongoDB.'}
                </p>
                <button
                  type="button"
                  onClick={handleRetryDb}
                  disabled={reconnecting}
                  className="mt-1 inline-flex items-center rounded-md border border-[#B85A3A]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#7A321C] hover:bg-[#F7F4EE]"
                >
                  {reconnecting ? 'Checking connection...' : 'Retry MongoDB connection'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-[#DDD5C7] bg-[#F7F4EE] p-3.5">
          <p className="text-xs font-medium text-[#556363]">
            Quick demo credentials (Volunteer vs Coordinator RBAC)
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('volunteer')}
              className="rounded-lg border border-[#DDD5C7] bg-white px-3 py-2 text-left transition-colors hover:border-[#0F5C5C]"
            >
              <span className="block text-xs font-semibold text-[#172323]">Volunteer</span>
              <span className="block truncate text-[11px] text-[#556363]">Bakassi IDP Camp</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('coordinator')}
              className="rounded-lg border border-[#DDD5C7] bg-white px-3 py-2 text-left transition-colors hover:border-[#0F5C5C]"
            >
              <span className="block text-xs font-semibold text-[#172323]">Coordinator</span>
              <span className="block truncate text-[11px] text-[#556363]">All Communities</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-[#172323]">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@dignitylink.org"
              className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-white px-3.5 py-2.5 text-sm text-[#172323] focus:border-[#0F5C5C] focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]/20"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-[#172323]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-1.5 w-full rounded-lg border border-[#DDD5C7] bg-white px-3.5 py-2.5 text-sm text-[#172323] focus:border-[#0F5C5C] focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]/20"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-[#E5B8A8] bg-[#FDF4F0] px-3 py-2.5 text-xs text-[#7A321C]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B85A3A]" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F5C5C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0B4646] disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-4 flex items-center gap-2 border-t border-[#EFEAE0] pt-3 text-xs text-[#556363]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#0F5C5C]" />
          <span>Role-scoped JWT authentication protects beneficiary records and phone numbers.</span>
        </div>
      </div>
    </div>
  );
}
