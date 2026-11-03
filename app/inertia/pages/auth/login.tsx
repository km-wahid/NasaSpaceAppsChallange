import { Form } from '@adonisjs/inertia/react'
import AuthFrame from '../../components/auth_frame'
import PasswordInput from '../../components/password_input'

export default function Login() {
  return (
    <AuthFrame
      title="Log in"
      description="Access your saved farms and plans."
    >
      <Form route="session.store">
        {({ errors, processing }) => (
          <>
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="username"
                className="input w-full"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                data-invalid={errors.email ? 'true' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <PasswordInput
                name="password"
                id="password"
                autoComplete="current-password"
                invalid={Boolean(errors.password)}
                errorId="password-error"
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary w-full min-h-12"
                disabled={processing}
              >
                {processing ? 'Logging in…' : 'Log in'}
              </button>
            </div>
          </>
        )}
      </Form>
    </AuthFrame>
  )
}
