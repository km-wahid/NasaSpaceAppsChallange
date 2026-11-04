---
name: Orbital Agriscience System
colors:
  surface: '#f8faf7'
  surface-dim: '#d8dbd8'
  surface-bright: '#f8faf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f1'
  surface-container: '#eceeeb'
  surface-container-high: '#e7e9e6'
  surface-container-highest: '#e1e3e0'
  on-surface: '#191c1b'
  on-surface-variant: '#44474c'
  inverse-surface: '#2e312f'
  inverse-on-surface: '#eff1ee'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#535f74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0f1c2e'
  on-primary-container: '#78849b'
  inverse-primary: '#bbc7e0'
  secondary: '#005bbe'
  on-secondary: '#ffffff'
  secondary-container: '#5b97fd'
  on-secondary-container: '#002f68'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002112'
  on-tertiary-container: '#45926c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3fc'
  primary-fixed-dim: '#bbc7e0'
  on-primary-fixed: '#0f1c2e'
  on-primary-fixed-variant: '#3b475c'
  secondary-fixed: '#d7e2ff'
  secondary-fixed-dim: '#acc7ff'
  on-secondary-fixed: '#001a40'
  on-secondary-fixed-variant: '#004491'
  tertiary-fixed: '#a4f3c6'
  tertiary-fixed-dim: '#89d7ab'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005234'
  background: '#f8faf7'
  on-background: '#191c1b'
  surface-variant: '#e1e3e0'
typography:
  display-hero:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  display-hero-mobile:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  data-mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system bridges remote-sensing aerospace technology and grounded agronomical fieldwork. The brand personality is authoritative, rigorously scientific, and accessible. It delivers mission-critical geospatial telemetry to agronomists, regional planners, and grassroots farming collectives.

The visual style employs a high-contrast editorial-technical framework:
- **Scientific Precision:** Crisp modular structures, unambiguous data visualization scales, and telemetry-inspired HUD metadata indicators.
- **Human Warmth:** Terrestrial accents (foliar greens and loamy earth tones) temper deep-space blues, ensuring the interface feels connected to living soil rather than an abstract operational console.
- **Functional Clarity:** Dense data displays prioritize visual legibility in direct sunlight or field conditions, utilizing explicit borders, clear typographic hierarchy, and purposeful chromatic status mapping.

## Colors
The palette balances planetary observational depths with practical agricultural field indicators:

- **Deep Space Navy (`#071426`):** The primary brand foundation. Used for key action items, high-hierarchy headings, and high-contrast structural anchoring.
- **Midnight Blue (`#10243A`):** Secondary structural base. Applied to secondary navigation bars, contextual operational sidebars, and critical grouping elements.
- **Satellite Blue (`#246BCE`):** Primary interactive accent and sensor state indicator. Directs user focus to interactive telemetry, satellite pass status, active filters, and temporal toggles.
- **Earth Green (`#3E8B65`):** Tertiary operational hue representing optimal crop vitality, confirmed recommendations, and successful validation metrics.
- **Agriculture Green (`#72A67A`):** Soft vegetative tone used for NDVI indices, canopy density scales, and secondary positive status tags.
- **Soil Brown (`#A77B54`):** Earth-anchored accent representing soil moisture anomalies, drought advisories, tillage parameters, and harvest planning.
- **Neutral Off-white (`#F6F8F5`):** Default canvas background, reducing visual fatigue under prolonged sun exposure and mitigating harsh contrast.
- **Pure White (`#FFFFFF`):** High-level card backgrounds, data tiles, and popover container surfaces.
- **Slate Gray (`#667085`):** Secondary text, units of measure, metadata annotations, and inactive controls.
- **Border Gray (`#E3E8ED`):** Grid dividers, data table rows, panel borders, and structural keylines.

## Typography
Typographic scale and rendering principles ensure functional clarity across Latin scripts and Indic/Bengali scripts:

- **Primary Structure:** Latin headlines use Manrope for structural geometric stability, combined with Inter for high-density tabular and textual scanning.
- **Multilingual Support:** For Bengali locales, **Hind Siliguri** maps directly to these sizing levels. When rendering Bengali text, increase the nominal line-height by 15–20% to account for complex matras and conjuncts without vertical collision.
- **Tabular & Telemetry Rules:** All spatial coordinates, spectral reflectance rates, moisture percentages, and timestamp metrics must use `font-variant-numeric: tabular-nums` to maintain vertical alignment across dynamically updating rows.

## Layout & Spacing
The layout follows a fluid-grid structure optimized for geospatial maps, imagery split-views, and diagnostic charts.

### Grid Breakpoints
- **Mobile (< 768px):** 4-column layout. Margin: `1rem`, Gutter: `0.75rem`. Map controls switch to bottom-sheet draw-drawers; sidebars collapse entirely to full-bleed tabs.
- **Tablet (768px – 1024px):** 8-column layout. Margin: `1.5rem`, Gutter: `1rem`. Secondary telemetry stacks below imagery viewports.
- **Desktop (> 1024px):** 12-column layout. Margin: `2rem`, Gutter: `1.5rem`. Enables persistent telemetry panels alongside full-height GIS canvas viewports.

### Spacing Principles
- Component layout uses strict multiples of 4px.
- Use `space-xs` and `space-sm` for inline metadata pairings, badge groupings, and micro-metric comparisons.
- Use `space-md` for standard card interiors, list row separation, and form field stacks.
- Use `space-lg` and `space-xl` between major metric groupings, chart controls, and section-level containers.

## Elevation & Depth
Depth is created through calibrated surface shifts and high-contrast structural outlines rather than heavy blurred drop shadows. This preserves high-contrast readability under bright daylight.

- **Level 0 (Base Canvas):** Off-white `#F6F8F5`. Flat, unadorned structural ground.
- **Level 1 (Cards & Data Panels):** Pure White `#FFFFFF` with a crisp 1px solid border of `#E3E8ED`. No shadow is cast by default; elevation is reinforced purely by background differentiation and hairline bounding.
- **Level 2 (HUD Overlays & Pinned Controls):** Applied to floating map controls, polygon drawing tools, and floating metric pills. White `#FFFFFF` with border `#E3E8ED` and an ambient shadow: `box-shadow: 0 4px 12px rgba(7, 20, 38, 0.08)`.
- **Level 3 (Modal Alerts & Decision Diagnostic Sheets):** Deep operational clarity. Surface `#FFFFFF` encased in a 1px border of `#667085`, backed by a darkened viewport veil: `background-color: rgba(7, 20, 38, 0.6)`.

## Shapes
The design system adopts a **Soft (Level 1)** geometric form language:
- Standard components (buttons, input fields, badges, data modules) use a radius of `0.25rem` (4px).
- Larger containers, slide-in panels, and surface cards use `rounded-lg` of `0.5rem` (8px).
- System alerts, advisory dialogs, and primary viewport windows use `rounded-xl` of `0.75rem` (12px).
- Completely round/pill geometry is reserved solely for contextual status indicators, coordinate beacons, and live satellite connection pulses.
This tight curvature reflects navigational and scientific tooling while remaining visually approachable to agricultural field agents.

## Components

### Buttons
- **Primary:** Background Deep Space Navy (`#071426`), text Pure White (`#FFFFFF`). Padding: `0.625rem 1.25rem`. Radius: `0.25rem`. Hover: Midnight Blue (`#10243A`). Active: Satellite Blue (`#246BCE`).
- **Satellite Action:** Background Satellite Blue (`#246BCE`), text Pure White (`#FFFFFF`). Reserved for running satellite sweeps, index recalculations, and telemetry sync.
- **Secondary / Ghost:** Transparent background, 1px border Border Gray (`#E3E8ED`), text Deep Space Navy (`#071426`). Hover: Background `#F6F8F5`.

### Chips & Badges
- Compact markers displaying sensor types, plant health states, or field zones.
- Height: 24px, radius: `0.25rem`, typography: `label-sm`.
- **NDVI / Optimal:** Background `#EBF4EF`, text Earth Green (`#3E8B65`), border `1px solid rgba(62, 139, 101, 0.3)`.
- **Moisture Alert / Soil:** Background `#F7F2EE`, text Soil Brown (`#A77B54`), border `1px solid rgba(167, 123, 84, 0.3)`.
- **Orbital Pass / Pending:** Background `#EEF4FB`, text Satellite Blue (`#246BCE`), border `1px solid rgba(36, 107, 206, 0.3)`.

### Form Controls (Inputs, Checkboxes, Radios)
- **Input Fields:** Pure White background, 1px solid Border Gray (`#E3E8ED`), height 40px, padding `0 0.75rem`. Focus: 1.5px border Satellite Blue (`#246BCE`) with no fuzzy outer glow. Bengali and Latin placeholder text rendered in Slate Gray (`#667085`).
- **Checkboxes & Radios:** 18px bounding box, 1px border Slate Gray (`#667085`). Checked state: Deep Space Navy (`#071426`) with a crisp Pure White checkmark/dot.

### Cards & Telemetry Tiles
- Background: Pure White (`#FFFFFF`).
- Border: 1px solid Border Gray (`#E3E8ED`).
- Radius: `0.5rem`.
- Padding: `1rem` desktop, `0.75rem` mobile.
- Interior composition: Header row includes title in `title-md`, flanked by metadata (e.g., "Updated 12m ago • Sentinel-2") rendered in Slate Gray (`#667085`).

### GIS Map HUD Overlays
- Floating spatial adjustment blocks anchored over map visualizers.
- Solid Pure White surface with 1px border Border Gray (`#E3E8ED`).
- Uses high-contrast icon buttons (24px grid) separated by subtle internal 1px vertical/horizontal divider lines for zoom, spectral band switcher (True Color, NDVI, NDWI), and temporal timeline sliders.