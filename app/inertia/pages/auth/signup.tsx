import { Form } from '@adonisjs/inertia/react'
import AuthFrame from '../../components/auth_frame'

export default function Signup() {
  return (
    <AuthFrame
      signup
      title="Let’s grow together."
      description="Create an account to save your farm and plan with perspective."
    >
      <Form route="new_account.store">
        {({ errors, processing }) => (
          <>
            <div>
              <label htmlFor="fullName">Full name</label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                className="input w-full"
                autoComplete="name"
                required
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'name-error' : undefined}
                data-invalid={errors.fullName ? 'true' : undefined}
              />
              {errors.fullName && (
                <p id="name-error" className="text-sm text-error" role="alert">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
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
              <input
                type="password"
                name="password"
                id="password"
                autoComplete="new-password"
                className="input w-full"
                required
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                data-invalid={errors.password ? 'true' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="passwordConfirmation">Confirm password</label>
              <input
                type="password"
                name="passwordConfirmation"
                id="passwordConfirmation"
                autoComplete="new-password"
                className="input w-full"
                required
                aria-invalid={Boolean(errors.passwordConfirmation)}
                aria-describedby={errors.passwordConfirmation ? 'confirm-error' : undefined}
                data-invalid={errors.passwordConfirmation ? 'true' : undefined}
              />
              {errors.passwordConfirmation && (
                <p id="confirm-error" className="text-sm text-error" role="alert">
                  {errors.passwordConfirmation}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary w-full min-h-12"
                disabled={processing}
              >
                {processing ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </>
        )}
      </Form>
    </AuthFrame>
  )
}
