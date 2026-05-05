// RankIT ZM - Premium Executive Color Theme System

export interface Theme {
  bg: string;
  surface: string;
  surfaceAlt: string;
  topbar: string;
  border: string;
  borderSub: string;
  text: string;
  textSub: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  accentText: string;
  accentLighter: string;
  accentDark: string;
  accentLight: string;
  red: string;
  redBg: string;
  redText: string;
  orange: string;
  orangeBg: string;
  orangeText: string;
  green: string;
  greenBg: string;
  greenText: string;
  navy: string;
  navyBg: string;
  navyText: string;
  shadow: string;
  shadowMd: string;
  shadowLg: string;
  tableHead: string;
}

// ─── LIGHT THEME ──────────────────────────────────────────────────
export const LIGHT: Theme = {
  // Backgrounds — clean neutral, not green-tinted
  bg:         '#F8FAFC',
  surface:    '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  topbar:     '#FFFFFF',

  // Borders — slate, not green
  border:    '#E2E8F0',
  borderSub: '#F1F5F9',

  // Text — deep slate for executive readability
  text:      '#0F172A',
  textSub:   '#334155',
  textMuted: '#64748B',

  // Accent — vivid Zambian green, readable on white
  accent:       '#16A34A',
  accentBg:     '#F0FDF4',
  accentText:   '#15803D',
  accentLighter:'#DCFCE7',
  accentDark:   '#15803D',
  accentLight:  '#BBF7D0',

  // Status
  red:       '#DC2626',
  redBg:     '#FEF2F2',
  redText:   '#991B1B',
  orange:    '#D97706',
  orangeBg:  '#FFFBEB',
  orangeText:'#92400E',
  green:     '#16A34A',
  greenBg:   '#F0FDF4',
  greenText: '#15803D',

  // Executive Navy — strong secondary
  navy:    '#1E3A5F',
  navyBg:  'rgba(30, 58, 95, 0.08)',
  navyText:'#1E3A5F',

  // Shadows — neutral, not tinted
  shadow:   'rgba(15, 23, 42, 0.04)',
  shadowMd: 'rgba(15, 23, 42, 0.10)',
  shadowLg: 'rgba(15, 23, 42, 0.16)',

  tableHead: '#F8FAFC',
};

// ─── DARK THEME ───────────────────────────────────────────────────
export const DARK: Theme = {
  // Backgrounds — deep slate, premium not murky
  bg:         '#0F172A',
  surface:    '#1E293B',
  surfaceAlt: '#334155',
  topbar:     '#1E293B',

  // Borders — visible but subtle
  border:    '#334155',
  borderSub: '#1E293B',

  // Text — high contrast slate
  text:      '#F1F5F9',
  textSub:   '#CBD5E1',
  textMuted: '#64748B',

  // Accent — brighter green for dark backgrounds
  accent:       '#22C55E',
  accentBg:     '#052E16',
  accentText:   '#86EFAC',
  accentLighter:'#14532D',
  accentDark:   '#4ADE80',
  accentLight:  '#166534',

  // Status
  red:       '#F87171',
  redBg:     '#450A0A',
  redText:   '#FCA5A5',
  orange:    '#FB923C',
  orangeBg:  '#431407',
  orangeText:'#FDBA74',
  green:     '#22C55E',
  greenBg:   '#052E16',
  greenText: '#86EFAC',

  // Executive Navy
  navy:    '#3B82F6',
  navyBg:  'rgba(59, 130, 246, 0.12)',
  navyText:'#93C5FD',

  // Shadows — deep, premium
  shadow:   'rgba(0, 0, 0, 0.20)',
  shadowMd: 'rgba(0, 0, 0, 0.35)',
  shadowLg: 'rgba(0, 0, 0, 0.50)',

  tableHead: '#0F172A',
};

// Zambia Flag Colors
export const ZAMBIA_FLAG: string[] = ['#198A00', '#1A1A1A', '#EF3340', '#FF8200'];