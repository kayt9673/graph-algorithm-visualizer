/**
 * Graph Algorithm Visualizer - Design Tokens & Component Guide
 * 
 * COLORS (Colorblind-Friendly Palette)
 * --graph-normal: #2563eb (Blue - Default edges)
 * --graph-augmenting: #16a34a (Green - Augmenting path edges)
 * --graph-saturated: #dc2626 (Red - Saturated/full capacity edges)
 * --graph-residual: #9ca3af (Gray - Residual graph edges, dashed)
 * --graph-active: #f59e0b (Orange - Currently processing node/edge)
 * 
 * SPACING SYSTEM (8px base)
 * gap-2 = 8px
 * gap-3 = 12px
 * gap-4 = 16px
 * gap-6 = 24px
 * gap-8 = 32px
 * p-3 = 12px padding
 * p-4 = 16px padding
 * p-6 = 24px padding
 * 
 * TYPOGRAPHY HIERARCHY
 * h1: text-xl (20px) - App title
 * h3: text-lg (18px) - Panel titles
 * h4: text-base (16px) - Card titles
 * body: text-sm (14px) - Labels, descriptions
 * small: text-xs (12px) - Legend items, metadata
 * 
 * COMPONENT VARIANTS
 * - Button: default (primary), outline (secondary)
 * - Card: default (white), primary (dark with accent)
 * - Badge: default, outline
 * - Switch: Used for all toggle controls
 * - Slider: Used for progress and speed control
 * 
 * LAYOUT BREAKPOINTS
 * Mobile: < 1024px (lg breakpoint)
 * Desktop: >= 1024px
 * 
 * STATES
 * - empty: No graph loaded
 * - editing: Graph input mode
 * - running: Algorithm executing with playback controls
 * - finished: Algorithm complete, showing final state
 */

export const DESIGN_TOKENS = {
  colors: {
    graphNormal: '#2563eb',
    graphAugmenting: '#16a34a',
    graphSaturated: '#dc2626',
    graphResidual: '#9ca3af',
    graphActive: '#f59e0b',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
} as const;
