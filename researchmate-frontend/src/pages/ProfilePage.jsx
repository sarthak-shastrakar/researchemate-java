// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import {
  User, Mail, Lock, Pencil, Check, X, ShieldCheck,
  Calendar, KeyRound, LogOut, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMe, updateProfile } from '../api/auth';

/* ── small helper ── */
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

/* ── inline alert component ── */
function Alert({ type, message }) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error:   'bg-red-50 border-red-200 text-red-700',
  };
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* ── section card wrapper ── */
function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

/* ── input field ── */
function Field({ id, label, type = 'text', value, onChange, placeholder, disabled, icon: Icon }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400 ${
            Icon ? 'pl-9 pr-4' : 'px-4'
          }`}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, persistSession } = useAuth();
  const navigate = useNavigate();

  // ── profile data (fetched from /me) ─────────────────────────────────────────
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  // ── name edit ────────────────────────────────────────────────────────────────
  const [editingName, setEditingName]   = useState(false);
  const [nameInput, setNameInput]       = useState('');
  const [nameSaving, setNameSaving]     = useState(false);
  const [nameAlert, setNameAlert]       = useState(null); // { type, message }

  // ── password change ──────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwAlert, setPwAlert]     = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);

  // ── fetch profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getMe();
        setProfile(data);
        setNameInput(data.name || '');
      } catch {
        // Fall back to AuthContext data
        setProfile(user);
        setNameInput(user?.name || '');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ── save name ────────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      setNameAlert({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }
    setNameSaving(true);
    setNameAlert(null);
    try {
      const data = await updateProfile({ name: nameInput.trim() });
      setProfile((p) => ({ ...p, name: data.name }));
      // Refresh auth context session
      if (data.token) {
        persistSession({ ...user, name: data.name }, data.token);
      }
      setEditingName(false);
      setNameAlert({ type: 'success', message: 'Name updated successfully!' });
    } catch (err) {
      setNameAlert({ type: 'error', message: err.message });
    } finally {
      setNameSaving(false);
    }
  };

  // ── save password ─────────────────────────────────────────────────────────────
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPwAlert(null);
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwAlert({ type: 'error', message: 'Both current and new passwords are required.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwAlert({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwAlert({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    setPwSaving(true);
    try {
      const data = await updateProfile({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      if (data.token) {
        persistSession({ ...user, name: data.name }, data.token);
      }
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwAlert({ type: 'success', message: 'Password changed successfully!' });
    } catch (err) {
      setPwAlert({ type: 'error', message: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials   = getInitials(profile?.name);
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account information and security settings.</p>
      </div>

      {/* ── Avatar + basic info card ── */}
      <Card className="mb-5">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl font-bold text-white tracking-wide">{loading ? '…' : initials}</span>
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {loading ? '…' : (profile?.name ?? 'User')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                <ShieldCheck className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {loading ? '…' : (profile?.email ?? '')}
            </p>
            {memberSince && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Member since {memberSince}
              </p>
            )}
          </div>

          {/* Logout */}
          <button
            id="profile-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 bg-red-50 rounded-xl hover:bg-red-100 cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </Card>

      {/* ── Name section ── */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Display Name</h3>
        </div>

        {nameAlert && <div className="mb-3"><Alert {...nameAlert} /></div>}

        {editingName ? (
          <div className="space-y-3">
            <Field
              id="profile-name-input"
              label="Full Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your full name"
              disabled={nameSaving}
              icon={User}
            />
            <div className="flex gap-2">
              <button
                id="save-name-btn"
                onClick={handleSaveName}
                disabled={nameSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                {nameSaving ? 'Saving…' : 'Save Name'}
              </button>
              <button
                onClick={() => { setEditingName(false); setNameInput(profile?.name || ''); setNameAlert(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Current name</p>
              <p className="text-sm font-semibold text-gray-900">{profile?.name ?? '—'}</p>
            </div>
            <button
              id="edit-name-btn"
              onClick={() => { setEditingName(true); setNameAlert(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        )}
      </Card>

      {/* ── Email (read-only) ── */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
            <Mail className="w-4 h-4 text-sky-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Email Address</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Registered email</p>
            <p className="text-sm font-semibold text-gray-900">{profile?.email ?? '—'}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
            Read-only
          </span>
        </div>
      </Card>

      {/* ── Change password ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-violet-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Change Password</h3>
        </div>

        {pwAlert && <div className="mb-4"><Alert {...pwAlert} /></div>}

        <form onSubmit={handleSavePassword} className="space-y-4">
          <Field
            id="current-password-input"
            label="Current Password"
            type={showPasswords ? 'text' : 'password'}
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Enter your current password"
            disabled={pwSaving}
            icon={Lock}
          />
          <Field
            id="new-password-input"
            label="New Password"
            type={showPasswords ? 'text' : 'password'}
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="At least 6 characters"
            disabled={pwSaving}
            icon={Lock}
          />
          <Field
            id="confirm-password-input"
            label="Confirm New Password"
            type={showPasswords ? 'text' : 'password'}
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Re-enter new password"
            disabled={pwSaving}
            icon={Lock}
          />

          {/* Strength indicator */}
          {pwForm.newPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Password strength</span>
                <span className={`text-xs font-medium ${
                  pwForm.newPassword.length < 6 ? 'text-red-500' :
                  pwForm.newPassword.length < 10 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {pwForm.newPassword.length < 6 ? 'Too short' :
                   pwForm.newPassword.length < 10 ? 'Fair' : 'Strong'}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      (i === 1 && pwForm.newPassword.length >= 1) ? 'bg-red-400' :
                      (i === 2 && pwForm.newPassword.length >= 6) ? 'bg-amber-400' :
                      (i === 3 && pwForm.newPassword.length >= 10) ? 'bg-emerald-400' :
                      'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="show-passwords-toggle"
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="show-passwords-toggle" className="text-xs text-gray-500 cursor-pointer select-none">
              Show passwords
            </label>
          </div>

          <button
            type="submit"
            id="save-password-btn"
            disabled={pwSaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 cursor-pointer disabled:opacity-60"
          >
            <KeyRound className="w-4 h-4" />
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </Card>
    </div>
  );
}
