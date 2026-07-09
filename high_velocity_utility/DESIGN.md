---
name: High-Velocity Utility
colors:
  surface: '#f8f9ff'
  surface-dim: '#d8dadf'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3f9'
  surface-container: '#eceef3'
  surface-container-high: '#e6e8ed'
  surface-container-highest: '#e1e2e8'
  on-surface: '#191c20'
  on-surface-variant: '#45464d'
  inverse-surface: '#2e3135'
  inverse-on-surface: '#eff0f6'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002109'
  on-tertiary-container: '#009844'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#f8f9ff'
  on-background: '#191c20'
  surface-variant: '#e1e2e8'
typography:
  price-display:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.04em
  price-display-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.04em
  station-name:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  metadata-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  row-padding-x: 1rem
  row-padding-y: 0.75rem
  stack-gap: 0.25rem
  section-gap: 1.5rem
  container-max: 800px
---

## Brand & Style
The design system is engineered for immediate information retrieval and high-frequency utility. It prioritizes the "Ultra-scannable" requirement of a city-dwelling driver who needs to compare gas prices at a glance. 

The aesthetic is a hybrid of **Minimalism** and **Modern Utility**. It avoids heavy shadows, excessive padding, and decorative illustrations in favor of a "data-first" interface. The UI should evoke a sense of speed, accuracy, and reliability. Every visual element serves a functional purpose, utilizing thin dividers and clear typographic hierarchy to organize complex data without visual clutter.

## Colors
The color palette is built for maximum legibility and functional signaling.

- **Primary (Navy - #0F172A):** Used for branding accents and primary navigation elements, maintaining the site's identity with a lighter touch.
- **Secondary (Action Amber - #F59E0B):** Reserved exclusively for interactive "Report" actions and urgent status updates.
- **Tertiary (Gas Station Green - #22C55E):** The hero color of the application. Used for the largest typographic elements representing the lowest prices.
- **Neutral (Deep Charcoal - #1A1D21):** Used for primary body text and station names to ensure high contrast against the white surface.
- **Surface:** A pure white (#FFFFFF) background is used to ensure the green and charcoal elements pop with maximum clarity.

## Typography
Typography is the core of this design system. We use **Geist** for data points and headings due to its technical, precise feel, and **Inter** for body copy and metadata for its legendary legibility at small sizes.

- **Price Display:** The most prominent element. Must be in Gas Station Green (#22C55E) and use the tightest letter spacing.
- **Station Names:** High-contrast charcoal, bold enough to stand out but secondary to the price.
- **Metadata:** Used for addresses, distances, and "time since last update." These should use a mid-grey (#64748B) to recede visually compared to the primary data.

## Layout & Spacing
The layout follows a **High-Density Fluid Grid**. The priority is vertical efficiency to minimize scrolling.

- **Desktop/Tablet:** Content is centered in a 800px max-width container to prevent eye strain during horizontal scanning.
- **Mobile:** Edge-to-edge list items with 16px horizontal margins.
- **Density:** We use a tight spacing rhythm. List items (stations) use 12px vertical padding to fit at least 6-7 stations above the fold on most mobile devices.
- **Dividers:** Use 1px borders (#E2E8F0) rather than gaps or cards to separate list items, maintaining a continuous flow of data.

## Elevation & Depth
This design system utilizes a **Flat / Low-Contrast Outline** approach. 

- **No Shadows:** Shadows are eliminated to keep the interface feeling fast and "unweighted."
- **Tonal Separation:** Different gas grades (Regular, Midgrade, Premium) are separated by subtle tonal shifts in background color (e.g., a very light grey #F8FAFC) rather than raised surfaces.
- **Focus States:** High-contrast 2px solid Action Amber borders are used for keyboard navigation and active input states.

## Shapes
The shape language is **Soft (0.25rem)**. While the system is utility-focused, slight rounding on buttons and input fields prevents the UI from feeling "hostile" or overly industrial. 

- **Buttons:** 4px (0.25rem) corner radius.
- **Selection Chips:** 2px corner radius for a sharper, more precise look.
- **Inputs:** 4px corner radius with a 1px border.

## Components

- **Station Row:** The primary component. Features the Price Display on the far left, Station Name and Address in the center, and the "Report" Action Amber button on the far right.
- **Action Buttons:** Primary buttons use the Action Amber (#F59E0B) with white text. Secondary buttons use a ghost style with a 1px Navy border.
- **Price Chips:** Small, rectangular indicators for different gas types. The active type is filled with Navy; inactive types have a light grey border.
- **Data Labels:** Use the `label-caps` typography for headers like "LAST UPDATED" or "DISTANCE" to distinguish them from the data itself.
- **Utility Filters:** A horizontal scrolling bar of chips at the top of the list for quick filtering by fuel type or brand.