// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, User, Mail, Lock, ArrowRight, Loader2, AlertCircle,
  Eye, EyeOff, Sparkles, Database, FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-powered summaries',
    desc: 'Instantly distil any source into key insights.',
  },
  {
    icon: Database,
    title: 'Source-grounded Q&A',
    desc: 'Ask questions, get answers backed by your saved sources.',
  },
  {
    icon: FolderOpen,
    title: 'Organised by project',
    desc: 'Keep every research thread neatly contained.',
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ════════════════════════════════════════
          LEFT — Branded hero panel (hidden on mobile)
          ════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 60%, #4c1d95 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-purple-500/20" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-indigo-800/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.02] border border-white/5" />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ResearchMate</span>
        </div>

        {/* Centre hero copy */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-indigo-200 font-medium">AI-powered research assistant</span>
            </div>
            <h2 className="text-[2.6rem] font-extrabold text-white leading-tight">
              Your research, organised and&nbsp;amplified
            </h2>
            <p className="text-indigo-200 text-base leading-relaxed max-w-sm">
              Join researchers who save smarter, understand deeper, and never lose a source again.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 group">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 shadow group-hover:bg-white/15 transition-colors">
                  <Icon className="w-4 h-4 text-indigo-200" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-indigo-300 text-xs leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-indigo-400 text-xs">© 2025 ResearchMate. All rights reserved.</p>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — Form panel
          ════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="w-full max-w-md">

          {/* Top logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-indigo-600 tracking-tight">ResearchMate</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1.5">Start organising your research — it's free</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              id="register-error"
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form id="register-form" onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700">
                Full name
              </label>
              <div className="relative group">
                <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-150" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter Full Name"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none hover:border-gray-300 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="block text-sm font-semibold text-gray-700">
                Email address
              </label>
              <div className="relative group">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-150" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter Email Address"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none hover:border-gray-300 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-150" />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Choose a strong password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none hover:border-gray-300 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-indigo-200 transition-all duration-150 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Terms note */}
            <p className="text-center text-[11px] text-gray-400 leading-relaxed pt-1">
              By creating an account you agree to our{' '}
              <span className="text-gray-500 font-medium">Terms of Service</span> and{' '}
              <span className="text-gray-500 font-medium">Privacy Policy</span>.
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-gray-400">Already have an account?</span>
            </div>
          </div>

          {/* Login link */}
          <Link
            to="/login"
            id="go-to-login-link"
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-700 hover:text-indigo-700 font-semibold text-sm py-3 rounded-xl transition-all duration-150"
          >
            Log in instead
          </Link>

        </div>
      </div>
    </div>
  );
}
