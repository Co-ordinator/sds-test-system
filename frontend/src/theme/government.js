/**
 * Government of Eswatini – Ministry of Labor and Social Security
 * Brand tricolor: red (data/accents), yellow (accent), sky blue (surfaces).
 * Interactive links and buttons use BRAND_SKY_DEEP (`GOV.blue`).
 * Enterprise-grade design tokens: hierarchy, density, consistency.
 */

/** Official palette — use these hex values across UI, charts, and exports where practical */
export const BRAND = {
  red: '#F44336',
  redHover: '#D32F2F',
  yellow: '#FFEB3B',
  skyBlue: '#7FBEEB',
};

/** Readable blue derived from sky stripe — default for links, buttons, and focus */
export const BRAND_SKY_DEEP = '#2D8BC4';

/** Darker blue for hover states on filled buttons / links */
export const BRAND_SKY_DEEP_HOVER = '#256B9A';

export const GOV = {
  ...BRAND,
  /* Links, text buttons, filled CTAs, nav active state */
  blue: BRAND_SKY_DEEP,
  blueHover: BRAND_SKY_DEEP_HOVER,
  primary: BRAND_SKY_DEEP,
  /* Sky-blue tints for panels, chips, progress tracks */
  blueLight: '#D6EBF7',
  blueLightAlt: '#EDF6FC',
  /* Accent highlights (badges, callouts — use sparingly) */
  accentYellow: BRAND.yellow,
  /* Thin top strip: ministry line (full width above main chrome) */
  ministryBarBg: BRAND_SKY_DEEP,
  ministryBarText: '#ffffff',
  /* Text hierarchy – enterprise standard */
  text: '#111827',
  textMuted: '#4b5563',
  textLight: '#6b7280',
  textHint: '#9ca3af',
  /* Borders */
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  /* Semantic — darker than CTA red */
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
  ministryBanner: 'text-xs sm:text-sm font-normal tracking-[0.02em]',
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
