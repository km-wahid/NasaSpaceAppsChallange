import { useEffect, useState, useRef, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  Search,
  Home,
  Compass,
  MapPin,
  GitCompare,
  Sprout,
  Layers,
  Sparkles,
  X,
  FileText,
  Map,
} from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface PaletteItem {
  id: string
  title: string
  subtitle: string
  href: string
  group: 'Pages' | 'Farms' | 'Districts'
  icon: typeof Home
  badge?: string
}

const ALL_ITEMS: PaletteItem[] = [
  // Group: Pages
  {
    id: 'page-home',
    title: 'Home Overview',
    subtitle: 'Overview & quick metrics',
    href: '/',
    group: 'Pages',
    icon: Home,
  },
  {
    id: 'page-mission',
    title: 'Mission & Methodology',
    subtitle: 'Scientific calibration steps',
    href: '/mission',
    group: 'Pages',
    icon: Compass,
  },
  {
    id: 'page-explorer',
    title: 'EO Explorer',
    subtitle: 'Historical climate & satellite trends',
    href: '/explorer',
    group: 'Pages',
    icon: MapPin,
  },
  {
    id: 'page-map',
    title: 'Bangladesh GIS Map',
    subtitle: 'Full-screen spatial layer viewer',
    href: '/explorer/map',
    group: 'Pages',
    icon: Layers,
  },
  {
    id: 'page-compare',
    title: 'Compare Strategies',
    subtitle: 'Side-by-side trade-off analysis',
    href: '/compare',
    group: 'Pages',
    icon: GitCompare,
  },
  {
    id: 'page-planner',
    title: 'Crop Rotation Planner',
    subtitle: 'Deterministic advisor engine',
    href: '/planner',
    group: 'Pages',
    icon: Sparkles,
  },
  {
    id: 'page-farms',
    title: 'Farm Workspace',
    subtitle: 'Manage plots & field constraints',
    href: '/farms',
    group: 'Pages',
    icon: Sprout,
  },

  // Group: Farms
  {
    id: 'farm-bogura',
    title: 'Bogura Demo Farm',
    subtitle: '1-Hectare validated trial scenario',
    href: '/farms',
    group: 'Farms',
    icon: Sprout,
    badge: 'Demo Trial',
  },
  {
    id: 'farm-new',
    title: 'Create New Farm Plot',
    subtitle: 'Set soil, area & water priorities',
    href: '/farms#new',
    group: 'Farms',
    icon: FileText,
    badge: 'Action',
  },

  // Group: Districts
  {
    id: 'dist-bogura',
    title: 'Bogura District',
    subtitle: 'Rajshahi Division · AEZ-3 Karatoya-Bangali',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-3',
  },
  {
    id: 'dist-dinajpur',
    title: 'Dinajpur District',
    subtitle: 'Rangpur Division · Tista Meander Floodplain',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-1',
  },
  {
    id: 'dist-rajshahi',
    title: 'Rajshahi District',
    subtitle: 'High Barind Tract · Drought-prone',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-26',
  },
  {
    id: 'dist-rangpur',
    title: 'Rangpur District',
    subtitle: 'Northern agricultural corridor',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-3',
  },
  {
    id: 'dist-jessore',
    title: 'Jessore District',
    subtitle: 'Khulna Division · High pulse productivity',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-11',
  },
  {
    id: 'dist-mymensingh',
    title: 'Mymensingh District',
    subtitle: 'Old Brahmaputra Floodplain',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-9',
  },
  {
    id: 'dist-sylhet',
    title: 'Sylhet District',
    subtitle: 'Surma-Kushiyara Floodplain · High rainfall',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-20',
  },
  {
    id: 'dist-barishal',
    title: 'Barishal District',
    subtitle: 'Ganges Tidal Floodplain · Coastal basin',
    href: '/explorer',
    group: 'Districts',
    icon: Map,
    badge: 'AEZ-13',
  },
]

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter items matching query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ITEMS
    return ALL_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    )
  }, [query])

  // Grouped results preserving flat order for keyboard index
  const grouped = useMemo(() => {
    const groups: { [key: string]: PaletteItem[] } = {}
    filtered.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    })
    return groups
  }, [filtered])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        router.visit(filtered[selectedIndex].href)
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, onClose])

  if (!isOpen) return null

  let currentIndex = -1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center pt-0 sm:pt-20 px-0 sm:px-4">
      {/* Solid Dim Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container: Mobile bottom sheet / Desktop centered dialog */}
      <div className="relative w-full max-w-lg bg-base-100 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-base-300 overflow-hidden animate-fade-in z-10 max-h-[85vh] flex flex-col">
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-base-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Search Input Bar (with proper 16px padding & search icon) */}
        <div className="flex items-center px-4 py-3.5 border-b border-base-300/80 bg-base-100 flex-shrink-0">
          <Search className="w-5 h-5 text-success mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm text-base-content placeholder:text-base-content/40 focus:outline-none"
            placeholder="Search pages, farms, or districts… (e.g. Bogura, Compare)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="p-1 text-base-content/50 hover:text-base-content rounded-md mr-1"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-base-200 text-base-content/60 border border-base-300">
              ESC
            </span>
          )}
        </div>

        {/* Results List: 16px container padding, 8px gap between grouped sections */}
        <div ref={listRef} className="overflow-y-auto p-4 space-y-4 flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 mx-auto text-base-content/30" />
              <div className="text-xs font-semibold text-base-content/75">
                No matching results found
              </div>
              <p className="text-[11px] text-base-content/50 max-w-xs mx-auto">
                Try searching for "Bogura", "Mission", "Planner", or "Compare".
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([groupName, items]) => (
              <div key={groupName} className="space-y-1.5">
                {/* Group Header */}
                <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-base-content/50 px-2 py-0.5">
                  {groupName}
                </div>

                {/* Items in Group (10-12px padding per row) */}
                <div className="space-y-1">
                  {items.map((item) => {
                    currentIndex++
                    const itemIndex = currentIndex
                    const Icon = item.icon
                    const isSelected = itemIndex === selectedIndex

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          router.visit(item.href)
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#15803d] text-white shadow-xs'
                            : 'hover:bg-base-200 text-base-content'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-base-200 text-success'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate leading-tight">
                            {item.title}
                          </div>
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? 'text-white/80' : 'text-base-content/60'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-base-200 text-base-content/70 border border-base-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info tip */}
        <div className="px-4 py-2 bg-base-200/50 border-t border-base-300/60 flex items-center justify-between text-[10px] text-base-content/50 flex-shrink-0">
          <span>Navigate with ↑ and ↓</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  )
}
