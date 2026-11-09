import { Form } from '@adonisjs/inertia/react'
import AuthFrame from '../../components/auth_frame'
import PasswordInput from '../../components/password_input'
import { Loader2 } from 'lucide-react'

export default function Login() {
  return (
    <Form route="session.store">
      {({ errors, processing }) => {
        const hasError = Boolean(errors.email || errors.password)

        return (
          <AuthFrame title="Sign in to OrbitAgro" hasError={hasError}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-base-content/75 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="username"
                  className="input input-bordered w-full rounded-xl text-sm"
                  placeholder="farmer@orbitagro.org"
                  required
                  aria-invalid={Boolean(errors.email)}
                  data-invalid={errors.email ? 'true' : undefined}
                />
                {errors.email && (
                  <p className="text-xs text-error mt-1" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-base-content/75">
                    Password
                  </label>
                </div>
                <PasswordInput
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  invalid={Boolean(errors.password)}
                  errorId="password-error"
                />
                {errors.password && (
                  <p id="password-error" className="text-xs text-error mt-1" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="btn btn-success w-full rounded-xl text-white font-bold min-h-11 transition-all active:scale-98"
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </div>
          </AuthFrame>
        )
      }}
    </Form>
  )
}
