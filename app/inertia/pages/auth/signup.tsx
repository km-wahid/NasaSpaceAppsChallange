import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import AuthLayout from '../../components/auth_layout'
import PasswordInput from '../../components/password_input'
import { Loader2 } from 'lucide-react'

export default function Signup() {
  const [password, setPassword] = useState('')

  // Lightweight visual strength meter
  const strengthScore = Math.min(
    4,
    (password.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(password) ? 1 : 0) +
      (/[0-9]/.test(password) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(password) ? 1 : 0)
  )

  const strengthLabel =
    password.length === 0
      ? ''
      : strengthScore <= 1
      ? 'Weak'
      : strengthScore <= 3
      ? 'Moderate'
      : 'Strong'

  return (
    <AuthLayout title="Create your account">
      <Head title="Create Account - OrbitAgro" />

      <Form route="new_account.store">
        {({ errors, processing }) => (
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Full name
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                autoComplete="name"
                className="w-full h-11 px-3.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-base md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                placeholder="Md. Rafiqul Islam"
              />
              {errors.fullName && (
                <p className="text-xs text-red-600 mt-1 font-medium" role="alert">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                className="w-full h-11 px-3.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-base md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                placeholder="farmer@orbitagro.org"
                required
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1 font-medium" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {strengthLabel && (
                  <span className={`text-[11px] font-mono font-bold ${
                    strengthScore <= 1 ? 'text-amber-600' : strengthScore <= 3 ? 'text-blue-600' : 'text-emerald-700'
                  }`}>
                    {strengthLabel}
                  </span>
                )}
              </div>
              <PasswordInput
                name="password"
                id="password"
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
                errorId="password-error"
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-red-600 mt-1 font-medium" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="passwordConfirmation" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Confirm password
              </label>
              <PasswordInput
                name="passwordConfirmation"
                id="passwordConfirmation"
                autoComplete="new-password"
                invalid={Boolean(errors.passwordConfirmation)}
                errorId="passwordConfirmation-error"
              />
              {errors.passwordConfirmation && (
                <p id="passwordConfirmation-error" className="text-xs text-red-600 mt-1 font-medium" role="alert">
                  {errors.passwordConfirmation}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-11 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl text-sm transition-all shadow-xs cursor-pointer active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account…</span>
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>

            {/* Link to login */}
            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
              >
                Already have an account? Sign in →
              </Link>
            </div>
          </div>
        )}
      </Form>
    </AuthLayout>
  )
}
