'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Plus,
  Loader2,
  Shield,
  Users,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const SUBSCRIPTION_DAYS = 30;

interface Client {
  id: string;
  username: string;
  isActive: boolean;
  activatedAt: string | null;
  createdAt: string;
  daysRemaining: number;
  isExpired: boolean;
}

export default function AdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/list-clients');
      if (response.status === 403) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Verify admin session
    fetch('/api/auth/me').then(res => {
      if (!res.ok) {
        router.push('/login');
        return;
      }
      res.json().then(data => {
        if (data.user?.role !== 'admin') {
          router.push('/login');
          return;
        }
      });
    });
    fetchClients();
  }, [fetchClients, router]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const response = await fetch('/api/auth/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create client');
        return;
      }

      setSuccess(`Client "${newUsername}" created successfully! Toggle ON to activate their subscription.`);
      setNewUsername('');
      setNewPassword('');
      setShowCreate(false);
      fetchClients();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (clientId: string) => {
    setTogglingId(clientId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/toggle-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to toggle client');
        return;
      }

      const client = data.client;
      setSuccess(`Client "${client.username}" ${client.isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchClients();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const activeClients = clients.filter(c => c.isActive && !c.isExpired).length;
  const expiredClients = clients.filter(c => c.isExpired || !c.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-slate-300 hover:text-white gap-2">
              <FileText className="h-4 w-4" />
              Resume App
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
                <p className="text-sm text-slate-500">Total Clients</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ToggleRight className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{activeClients}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <ToggleLeft className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{expiredClients}</p>
                <p className="text-sm text-slate-500">Inactive / Expired</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Client Accounts</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchClients} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">{success}</div>
        )}

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreateClient} className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800">Create New Client Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Username</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g., client_john"
                  required
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Client
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setNewUsername(''); setNewPassword(''); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Client List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No clients yet</p>
            <p className="text-sm text-slate-400">Click &quot;Add Client&quot; to create the first client account.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const isCurrentlyActive = client.isActive && !client.isExpired;
              return (
                <div
                  key={client.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
                    isCurrentlyActive ? 'border-emerald-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Client info */}
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isCurrentlyActive ? 'bg-emerald-500' : 'bg-red-400'
                      }`}>
                        {client.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{client.username}</p>
                        <p className="text-xs text-slate-400">
                          Created {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Subscription status */}
                    <div className="flex items-center gap-4">
                      {isCurrentlyActive ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                          <Clock className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-semibold">{client.daysRemaining} days remaining</p>
                            <p className="text-xs text-emerald-500">
                              Activated {client.activatedAt ? new Date(client.activatedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-lg px-3 py-2">
                          <Clock className="h-4 w-4" />
                          <p className="text-sm font-semibold">
                            {client.isExpired ? 'Expired' : 'Inactive'}
                          </p>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="hidden sm:block w-32">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCurrentlyActive
                                ? client.daysRemaining > 10 ? 'bg-emerald-500' : client.daysRemaining > 5 ? 'bg-amber-500' : 'bg-red-500'
                                : 'bg-red-300'
                            }`}
                            style={{ width: `${isCurrentlyActive ? (client.daysRemaining / SUBSCRIPTION_DAYS) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 text-center mt-1">
                          {isCurrentlyActive ? `${client.daysRemaining}/${SUBSCRIPTION_DAYS}d` : '0%'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggle(client.id)}
                        disabled={togglingId === client.id}
                        className="relative inline-flex items-center"
                      >
                        {togglingId === client.id ? (
                          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        ) : isCurrentlyActive ? (
                          <ToggleRight className="h-10 w-10 text-emerald-500 cursor-pointer hover:text-emerald-600 transition-colors" />
                        ) : (
                          <ToggleLeft className="h-10 w-10 text-slate-300 cursor-pointer hover:text-slate-400 transition-colors" />
                        )}
                      </button>
                      <span className={`text-xs font-medium ${isCurrentlyActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isCurrentlyActive ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="bg-slate-800 text-slate-300 rounded-xl p-5 text-sm space-y-2">
          <p className="font-semibold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            How it works
          </p>
          <ul className="space-y-1 text-slate-400 list-disc list-inside">
            <li>Create client accounts with username and password</li>
            <li>Toggle ON to activate — this starts a <strong className="text-white">30-day countdown</strong></li>
            <li>Clients can see their remaining days when logged in</li>
            <li>After 30 days, access is <strong className="text-white">automatically disabled</strong></li>
            <li>You must <strong className="text-white">manually toggle ON</strong> to renew — this resets the 30-day countdown</li>
            <li>Toggling OFF immediately revokes access</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
