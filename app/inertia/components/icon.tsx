const paths = {
  pinOff:
    'M3 3l18 18 M9 3.6a8 8 0 0 1 11 6.4c0 1.7-.7 3.4-1.8 5 M5 6a8 8 0 0 0-1 4c0 6 8 11 8 11s1.6-1 3.4-2.8',
  navigation: 'm21 3-6 18-4-8-8-4 18-6Z',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z M9 3v16 M15 5v16',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 2 M18 18a8 8 0 0 1-13-2',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  leaf: 'M20 4C9 2 3 7 5 14c2 7 13 7 15-10Z M4 21 15 10',
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  water: 'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z M9 15a3 3 0 0 0 3 3',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  search: 'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  layers: 'm12 3 10 6-10 6L2 9l10-6Z M2 14l10 6 10-6 M2 18l10 6 10-6',
  sun: 'M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z m-4 9 3 3 5-6',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 5-5 5-13 0-18',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11v6 M12 7v1',
  chevron: 'm9 5 7 7-7 7',
  check: 'm5 12 4 4L19 6',
} as const

export default function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
