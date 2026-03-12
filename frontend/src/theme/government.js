/**
 * Government of Eswatini – Ministry of Labor and Social Security
 * Enterprise-grade design tokens: hierarchy, density, consistency.
 */
export const GOV = {
  /* Primary: headers, buttons, links */
  blue: '#1e3a5f',
  blueHover: '#152a47',
  blueLight: '#e8eef4',
  blueLightAlt: '#f0f4f8',
  /* Text hierarchy – enterprise standard */
  text: '#111827',
  textMuted: '#4b5563',
  textLight: '#6b7280',
  textHint: '#9ca3af',
  /* Borders */
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  /* Semantic */
  error: '#b91c1c',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
};

/**
 * Typography – reduced sizes, clear hierarchy.
 * Use: heading > subheading > body > label > caption > hint.
 */
export const TYPO = {
  /* Level 1: page/section heading */
  pageTitle: 'text-lg font-bold',
  /* Level 2: card/section heading */
  sectionTitle: 'text-base font-bold',
  cardTitle: 'text-sm font-bold',
  /* Level 3: body copy */
  body: 'text-sm',
  bodySmall: 'text-xs',
  /* Level 4: form labels, nav */
  label: 'text-xs font-medium',
  /* Level 5: captions, overlines */
  caption: 'text-xs uppercase tracking-wide',
  ministryBanner: 'text-xs sm:text-sm font-semibold tracking-[0.02em]',
  /* Level 6: hints, tooltips, notes – always pair with GOV.textHint */
  hint: 'text-xs',
};

/** Single logo size and alignment for all auth/onboarding surfaces */
export const LOGO = {
  className: 'h-14 w-auto object-contain',
  marginBottom: 'mb-6',
};

export const MINISTRY_NAME = 'Ministry of Labour and Social Security';
export const KINGDOM = 'Kingdom of Eswatini';
export const LOGO_ALT = 'Government of Eswatini – Coat of Arms';
