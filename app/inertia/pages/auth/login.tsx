import { Head } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import AuthLayout from '../../components/auth_layout'
import PasswordInput from '../../components/password_input'
import { Loader2 } from 'lucide-react'

export default function Login() {
  return (
    <AuthLayout title="Sign in to OrbitAgro">
      <Head title="Sign In - OrbitAgro" />

      <Form route="session.store">
        {({ errors, processing }) => (
          <div className="space-y-5">
            {/* General form error if credentials failed */}
            {(errors.email || errors.password) && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium" role="alert">
                Invalid email or password. Please verify your credentials.
              </div>
            )}

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="username"
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
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <PasswordInput
                name="password"
                id="password"
                autoComplete="current-password"
                invalid={Boolean(errors.password)}
                errorId="password-error"
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-red-600 mt-1 font-medium" role="alert">
                  {errors.password}
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
                    <span>Signing in…</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {/* Link to signup */}
            <div className="pt-2 text-center">
              <Link
                href="/signup"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
              >
                New to OrbitAgro? Create account →
              </Link>
            </div>
          </div>
        )}
      </Form>
    </AuthLayout>
  )
}
