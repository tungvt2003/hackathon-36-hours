// apps/mobile/src/theme/theme.ts

export const theme = {
  colors: {
    // ── Core brand ──────────────────────────────────────
    primary:        '#00B14F',   // Grab green
    primaryDark:    '#009040',   // Pressed state
    primaryDeep:    '#007A35',   // Deep variant
    primarySoft:    '#E8F8EF',   // Light tint (card bg, AI bubble)
    primaryXSoft:   '#F0FAF5',   // Ultra light tint (backgrounds)
    primaryGlow:    'rgba(0,177,79,0.16)',  // Shadow / glow

    // ── Semantic ─────────────────────────────────────────
    error:          '#E11900',
    errorBg:        '#FEE2E2',
    errorText:      '#991B1B',
    warning:        '#F59E0B',
    warningBg:      '#FEF3C7',
    warningText:    '#92400E',
    info:           '#3B82F6',
    infoBg:         '#EFF6FF',
    infoText:       '#1E40AF',
    success:        '#00B14F',
    successBg:      '#E8F8EF',

    // ── Surfaces ─────────────────────────────────────────
    background:     '#F5F6FA',   // App-wide canvas (slight cool-gray)
    surface:        '#FFFFFF',   // Card / sheet backgrounds
    surfaceElevated:'#FFFFFF',
    surfaceVoice:   '#F0FAF5',   // Voice zone tint

    // ── Text ─────────────────────────────────────────────
    textPrimary:    '#111827',   // Was #151C27 — preserved as alias below
    textSecondary:  '#6B7280',   // Was #575E70 — preserved as alias below
    textMuted:      '#9CA3AF',
    textOnPrimary:  '#FFFFFF',

    // ── Borders ──────────────────────────────────────────
    border:         '#E5E7EB',   // Was #DCE2F3
    borderStrong:   '#D1D5DB',
    borderSoft:     '#F3F4F6',

    // ── Overlay ──────────────────────────────────────────
    scrim:          'rgba(17,24,39,0.55)',
    toastBg:        '#111827',

    // ── Ripple rings (voice animations) ──────────────────
    ripple1:        'rgba(0,177,79,0.32)',
    ripple2:        'rgba(0,177,79,0.18)',
    ripple3:        'rgba(0,177,79,0.08)',

    // ── Disability toggle accents ─────────────────────────
    toggleVisual:   '#8B5CF6',
    toggleMotor:    '#F59E0B',
    toggleHandsfree:'#3B82F6',

    // ── Backwards-compat aliases (keep these forever) ────
    primaryContainer: '#00B14F',   // legacy Tailwind token
  },

  typography: {
    // Mobile-scaled sizes (18px minimum for body, per accessibility spec)
    displayXL: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -0.5 },
    displayLG: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -0.3 },
    heading1:  { fontSize: 30, fontWeight: '700' as const },
    heading2:  { fontSize: 26, fontWeight: '700' as const },
    heading3:  { fontSize: 22, fontWeight: '600' as const },
    heading4:  { fontSize: 20, fontWeight: '600' as const },
    heading5:  { fontSize: 18, fontWeight: '600' as const },
    bodyLG:    { fontSize: 18, fontWeight: '400' as const, lineHeight: 28 },
    bodyMD:    { fontSize: 16, fontWeight: '400' as const, lineHeight: 25 },
    bodySM:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
    // Voice transcript — oversized for hands-free readability
    transcript: { fontSize: 26, fontWeight: '600' as const, lineHeight: 38, letterSpacing: 0.15 },
    transcriptBody: { fontSize: 20, fontWeight: '400' as const, lineHeight: 32 },
    caption:   { fontSize: 13, fontWeight: '400' as const },
    captionBold:{ fontSize: 13, fontWeight: '600' as const },
    micro:     { fontSize: 12, fontWeight: '500' as const },
    microUpper:{ fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.9, textTransform: 'uppercase' as const },
    buttonLG:  { fontSize: 18, fontWeight: '700' as const },
    buttonMD:  { fontSize: 16, fontWeight: '600' as const },
    buttonSM:  { fontSize: 14, fontWeight: '600' as const },
  },

  radius: {
    xs:   4,
    sm:   8,
    md:   12,
    lg:   16,
    xl:   20,
    xxl:  28,
    card: 24,
    sheet:32,
    full: 9999,
  },

  spacing: [4, 8, 12, 16, 24, 32, 48, 64] as const,

  shadow: {
    // Use these with elevation on Android + shadow* props on iOS
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
    },
    green: {
      shadowColor: '#00B14F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 20,
      elevation: 6,
    },
  },

  touchTarget: 48,   // WCAG minimum touch target

  // Backwards-compat: old consumers access theme.fontSize.*
  fontSize: {
    body:    16,
    label:   18,
    heading: 28,
  },
} as const;

export type Theme = typeof theme;
