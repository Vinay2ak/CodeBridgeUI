import React, { useState } from 'react';
import { LogIn, UserCheck, Briefcase, ExternalLink, AlertCircle } from 'lucide-react';
import { loginWithCredentials } from './session';
import { Button } from '../../components/ui/Button';
import { env } from '../../lib/env';

export const AuthFallbackScreen: React.FC = () => {
  const [email, setEmail] = useState('testowner@codebridge.dev');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      setLoading(true);
      setError(null);
      await loginWithCredentials(loginEmail, loginPass);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials or network.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'owner' | 'freelancer') => {
    if (role === 'owner') {
      setEmail('testowner@codebridge.dev');
      setPassword('Password123!');
      handleLogin(undefined, 'testowner@codebridge.dev', 'Password123!');
    } else {
      setEmail('testfreelancer@codebridge.dev');
      setPassword('Password123!');
      handleLogin(undefined, 'testfreelancer@codebridge.dev', 'Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-2 text-brand font-bold text-2xl tracking-tight">
            <span className="font-mono text-brand">&lt;/&gt;</span> CodeBridge
          </div>
          <h1 className="text-xl font-semibold text-text">Dashboard Access</h1>
          <p className="text-xs text-text-muted">
            Connected to gateway:{' '}
            <span className="font-mono text-brand font-medium">
              {env.VITE_GATEWAY_URL || env.VITE_API_URL || 'Local Gateway'}
            </span>
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Role Sign In */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            1-Click Test Access
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('owner')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-border hover:border-brand/60 bg-surface hover:bg-surface-elevated transition-colors text-center group disabled:opacity-60"
            >
              <Briefcase className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-text">Project Owner</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('freelancer')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-border hover:border-brand/60 bg-surface hover:bg-surface-elevated transition-colors text-center group disabled:opacity-60"
            >
              <UserCheck className="w-5 h-5 text-success group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-text">Freelancer</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative px-3 bg-surface text-[11px] uppercase tracking-wider text-text-muted">
            or enter credentials
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="user@codebridge.dev"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full justify-center mt-1"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In to Dashboard
              </span>
            )}
          </Button>
        </form>

        {/* External Signin Microfrontend link */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>Sign In App</span>
          <a
            href={env.VITE_SIGNIN_URL}
            className="flex items-center gap-1 text-brand hover:underline"
          >
            Open on port 5173
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

