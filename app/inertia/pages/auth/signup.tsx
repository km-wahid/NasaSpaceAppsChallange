import { useState } from 'react'
import { Form } from '@adonisjs/inertia/react'
import AuthFrame from '../../components/auth_frame'
import PasswordInput from '../../components/password_input'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function Signup() {
  const [step, setStep] = useState<1 | 2>(1)

  return (
    <Form route="new_account.store">
      {({ errors, processing }) => {
        const hasError = Boolean(
          errors.fullName || errors.email || errors.password || errors.passwordConfirmation
        )

        return (
          <AuthFrame signup title="Create OrbitAgro Account" hasError={hasError}>
            {/* Multi-step progress indicator */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-base-300/60">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 1 ? 'bg-success text-white' : 'bg-success/20 text-success'
                  }`}
                >
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </span>
                <span className="text-xs font-semibold text-base-content/80">Account</span>
              </div>

              <div className="h-0.5 flex-1 mx-3 bg-base-300" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 2 ? 'bg-success text-white' : 'bg-base-200 text-base-content/50'
                  }`}
                >
                  2
                </span>
                <span className="text-xs font-semibold text-base-content/80">Location</span>
              </div>
            </div>

            {/* Step 1: Account credentials */}
            <div className={`space-y-3.5 ${step === 1 ? 'block' : 'hidden'}`}>
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-base-content/75 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  className="input input-bordered w-full rounded-xl text-sm"
                  placeholder="Md. Rafiqul Islam"
                  autoComplete="name"
                  required
                />
                {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-base-content/75 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  className="input input-bordered w-full rounded-xl text-sm"
                  placeholder="farmer@orbitagro.org"
                  required
                />
                {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-base-content/75 mb-1">
                  Password
                </label>
                <PasswordInput
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  invalid={Boolean(errors.password)}
                  errorId="password-error"
                />
                {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="passwordConfirmation" className="block text-xs font-semibold text-base-content/75 mb-1">
                  Confirm password
                </label>
                <PasswordInput
                  name="passwordConfirmation"
                  id="passwordConfirmation"
                  autoComplete="new-password"
                  invalid={Boolean(errors.passwordConfirmation)}
                  errorId="confirm-error"
                />
                {errors.passwordConfirmation && (
                  <p className="text-xs text-error mt-1">{errors.passwordConfirmation}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-success w-full rounded-xl text-white font-bold min-h-11 flex items-center justify-center gap-2"
                >
                  <span>Continue to Farm Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step 2: Farm Location preview & Confirm */}
            <div className={`space-y-4 ${step === 2 ? 'block' : 'hidden'}`}>
              <div className="p-4 rounded-xl bg-base-200/60 border border-base-300 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-success">Pilot Region</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/10 text-success font-semibold">
                    Bogura (বগুড়া)
                  </span>
                </div>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Your workspace will initialize with calibrated NASA POWER historical climate data for Bogura & Rajshahi division. You can add more fields anytime.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-ghost rounded-xl text-xs font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </button>

                <button
                  type="submit"
                  className="btn btn-success flex-1 rounded-xl text-white font-bold min-h-11"
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    'Complete Registration'
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
