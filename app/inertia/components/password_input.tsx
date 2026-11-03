import { useState } from 'react'
import Icon from './icon'

export default function PasswordInput({
  name,
  id,
  autoComplete,
  invalid,
  errorId,
}: {
  name: string
  id: string
  autoComplete: string
  invalid: boolean
  errorId: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        id={id}
        autoComplete={autoComplete}
        className="input w-full pr-12"
        required
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        data-invalid={invalid ? 'true' : undefined}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square absolute top-1/2 right-1 -translate-y-1/2 text-base-content/60 hover:text-base-content"
        onClick={() => setVisible((currentlyVisible) => !currentlyVisible)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  )
}
