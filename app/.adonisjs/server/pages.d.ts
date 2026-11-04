import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'compare': ExtractProps<(typeof import('../../inertia/pages/compare.tsx'))['default']>
    'dashboard': ExtractProps<(typeof import('../../inertia/pages/dashboard.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'explorer_map': ExtractProps<(typeof import('../../inertia/pages/explorer_map.tsx'))['default']>
    'explorer': ExtractProps<(typeof import('../../inertia/pages/explorer.tsx'))['default']>
    'farms': ExtractProps<(typeof import('../../inertia/pages/farms.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'mission': ExtractProps<(typeof import('../../inertia/pages/mission.tsx'))['default']>
    'planner': ExtractProps<(typeof import('../../inertia/pages/planner.tsx'))['default']>
    'sources': ExtractProps<(typeof import('../../inertia/pages/sources.tsx'))['default']>
  }
}
