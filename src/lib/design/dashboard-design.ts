// Modern dashboard design system with intentional aesthetic
export const DASHBOARD_DESIGN = {
  // Design direction: "Industrial Minimal" with subtle tech aesthetic
  aesthetic: {
    name: "Industrial Minimal",
    dfii: 12, // High impact, feasible, consistent
    anchor: "Asymmetrical grid with metallic accents",
  },

  // Typography system - avoid system fonts
  typography: {
    display: "'Space Grotesk', sans-serif", // Modern, technical
    body: "'Inter', sans-serif", // Clean, readable
    mono: "'JetBrains Mono', monospace", // Code/data display
  },

  // Color story - dominant cool blue with warm accent
  colors: {
    // Primary system - cool, technical blue
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe", 
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // Dominant primary
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },

    // Accent - warm coral for energy
    accent: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316", // Energy accent
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
    },

    // Neutral system - warm grays for depth
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },

    // Semantic colors
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },

  // Spatial rhythm - intentional asymmetry
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem", 
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
    // Asymmetric spacing for visual interest
    section: "6rem",
    card: "2rem",
    micro: "0.125rem",
  },

  // Motion philosophy - sparse, purposeful
  motion: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
    easing: {
      enter: "cubic-bezier(0.16, 1, 0.3, 1)",
      exit: "cubic-bezier(0.7, 0, 0.84, 0)",
    },
  },

  // Visual hierarchy
  hierarchy: {
    container: "max-w-7xl mx-auto",
    section: "py-section",
    card: "bg-white/80 backdrop-blur-sm border border-neutral-200/50",
    cardHover: "hover:bg-white/90 hover:border-primary-200/50",
  },

  // Component-specific design tokens
  components: {
    stats: {
      container: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
      card: "relative overflow-hidden rounded-2xl border border-neutral-200/50 bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-sm p-6",
      cardHover: "hover:border-primary-300/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-normal",
      value: "text-3xl font-bold font-mono text-neutral-900",
      label: "text-sm font-medium text-neutral-600 uppercase tracking-wider",
      icon: "w-5 h-5 text-primary-500",
    },

    registry: {
      container: "flex flex-col gap-4 p-6 min-h-[320px]",
      item: "group relative p-6 rounded-xl border border-neutral-200/50 bg-gradient-to-r from-white/80 to-white/40 backdrop-blur-sm transition-all duration-normal hover:border-primary-300/50 hover:shadow-md",
      itemHover: "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
      name: "font-semibold text-lg text-neutral-900 group-hover:text-primary-600 transition-colors",
      badge: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200",
    },

    activity: {
      container: "flex flex-col gap-3 p-4 max-h-96 overflow-y-auto",
      item: "flex items-start gap-3 p-3 rounded-lg border border-neutral-100/50 hover:bg-neutral-50/50 transition-colors",
      icon: "w-4 h-4 mt-0.5 text-neutral-500",
      content: "flex-1 min-w-0",
      timestamp: "text-xs text-neutral-500 font-mono",
    },

    chart: {
      container: "h-80 w-full bg-gradient-to-br from-white/90 to-white/50 rounded-2xl border border-neutral-200/50 p-6",
      title: "text-lg font-semibold text-neutral-900 mb-4",
    },
  },
} as const
