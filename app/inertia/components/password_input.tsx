import { useState } from 'react'
import Icon from './icon'

type Props = {
  name: string
  id: string
  autoComplete: string
  invalid: boolean
  errorId: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function PasswordInput({ name, id, autoComplete, invalid, errorId, onChange }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        id={id}
        autoComplete={autoComplete}
        className="w-full h-11 px-3.5 pr-12 bg-white text-slate-900 border border-slate-300 rounded-xl text-base md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
        required
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        data-invalid={invalid ? 'true' : undefined}
        onChange={onChange}
      />
      <button
        type="button"
        className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1.5 !bg-transparent hover:!bg-transparent text-[#15803d] hover:text-[#166534] !border-none !shadow-none transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] rounded-lg select-none"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  )
}
