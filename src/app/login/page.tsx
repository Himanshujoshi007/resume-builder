'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Shield, User, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminSeeded, setAdminSeeded] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Small delay to ensure cookie is properly set before redirect
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // Auto-seed admin on first visit to ensure admin account exists
  useEffect(() => {
    const seedAdmin = async () => {
      try {
        const res = await fetch('/api/auth/seed-admin', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setAdminSeeded(true);
        }
      } catch {
        // silent - admin might already exist
      }
    };
    seedAdmin();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Resume Builder</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Logo */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-100 mb-2">
                <FileText className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-sm text-slate-500">Sign in to access your resume builder</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 h-11"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </div>

          {/* Admin Credentials Hint */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
              <Info className="h-4 w-4 shrink-0" />
              Admin Credentials
            </div>
            <div className="text-xs text-amber-600 space-y-0.5">
              <p>Username: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">admin</code></p>
              <p>Password: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">Admin@2026</code></p>
            </div>
            {adminSeeded && (
              <p className="text-xs text-emerald-600 font-medium">Admin account initialized successfully!</p>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500">
            Access provided by your administrator. Contact support if you need credentials.
          </p>
        </div>
      </main>
    </div>
  );
}
