import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Satellite, Shield, Leaf, Eye, EyeOff, Loader2, CheckCircle2, Zap, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const { user, signIn, signUp, loginAsDemo, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  if (!loading && user) return <Navigate to="/farms" replace />

  const handleDemoLogin = () => {
    loginAsDemo('demo.farmer@agriproof.ai')
    navigate('/farms')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        navigate('/farms')
      }
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        setSubmitting(false)
        return
      }
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setSignupSuccess(true)
      }
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Satellite className="w-7 h-7 text-emerald-400" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              AgriProof<span className="text-emerald-400">.AI</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm">Parametric Crop Insurance · Zero-Knowledge Verified</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800/90 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl space-y-6">

          {/* Mode toggle */}
          <div className="flex bg-dark-900 rounded-xl p-1 border border-dark-700">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSignupSuccess(false) }}
              className={[
                'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                mode === 'login' ? 'bg-emerald-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              ].join(' ')}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setSignupSuccess(false) }}
              className={[
                'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                mode === 'signup' ? 'bg-emerald-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              ].join(' ')}
            >
              Create Account
            </button>
          </div>

          {/* Success state */}
          {signupSuccess ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              <div>
                <p className="text-white font-bold text-lg">Check your email!</p>
                <p className="text-slate-400 text-sm mt-1">
                  We sent a confirmation link to <span className="text-emerald-300">{email}</span>.
                  Click it to activate your account, then sign in.
                </p>
              </div>
              <button
                onClick={() => { setMode('login'); setSignupSuccess(false) }}
                className="text-sm text-emerald-400 hover:text-emerald-300 font-medium underline transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password {mode === 'signup' && <span className="normal-case font-normal text-slate-500">(min 6 chars)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-emerald-300 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting
                  ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                  : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>

              {/* Or separator */}
              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-dark-700 w-full" />
                <span className="bg-dark-800 px-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider absolute">
                  or
                </span>
              </div>

              {/* Instant Demo Access Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full bg-dark-900 hover:bg-dark-700 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md text-sm cursor-pointer group"
              >
                <Zap className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>⚡ Continue with Demo Farmer Account</span>
              </button>
            </form>
          )}

          {/* Trust badges */}
          <div className="pt-2 border-t border-dark-700 flex items-center justify-center gap-6 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-500" /> ZK-Verified</span>
            <span className="flex items-center gap-1.5"><Satellite className="w-3 h-3 text-blue-400" /> Sentinel-2 AI</span>
            <span className="flex items-center gap-1.5"><Leaf className="w-3 h-3 text-green-400" /> Privacy-First</span>
          </div>
        </div>
      </div>
    </div>
  )
}
