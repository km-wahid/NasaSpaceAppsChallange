import type { ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Logo from './logo'
import { ArrowRight } from 'lucide-react'

export default function AuthFrame({
  title,
  children,
  signup = false,
  hasError = false,
}: {
  title: string
  children: ReactNode
  signup?: boolean
  hasError?: boolean
}) {
  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <Head title={signup ? 'Create account' : 'Log in'} />

      {/* Centered Modern Auth Card (No gradients, solid surface) */}
      <div
        className={`w-full max-w-md card-modern p-7 sm:p-8 bg-base-100 border border-base-300 shadow-xl transition-all ${
          hasError ? 'animate-shake' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Logo size="md" showSubtitle={true} href="/" className="justify-center" />
          <h1 className="text-xl font-bold text-base-content mt-4">{title}</h1>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {children}
        </div>

        {/* Small bottom link */}
        <div className="mt-6 pt-5 border-t border-base-300/60 text-center text-xs text-base-content/70">
          <span>{signup ? 'Already have an account?' : 'New to OrbitAgro?'}</span>{' '}
          <Link
            href={signup ? '/login' : '/signup'}
            className="font-semibold text-success hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            <span>{signup ? 'Log in' : 'Create account'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
