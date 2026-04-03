// RankIT ZM - Color Theme System
// Light and Dark theme colors for the school management system

export interface Theme {
  // Background colors
  bg: string;
  surface: string;
  surfaceAlt: string;
  topbar: string;

  // Border colors
  border: string;
  borderSub: string;

  // Text colors
  text: string;
  textSub: string;
  textMuted: string;

  // Accent colors (Primary Green)
  accent: string;
  accentBg: string;
  accentText: string;
  accentLighter: string;   // Light accent background for premium screens
  accentDark: string;      // Dark accent for hover/active states

  // Status colors
  red: string;
  redBg: string;
  redText: string;
  orange: string;
  orangeBg: string;
  orangeText: string;
  green: string;
  greenBg: string;
  greenText: string;

  // Secondary Navy Blue
  navy: string;
  navyBg: string;
  navyText: string;

  // Shadow
  shadow: string;
  shadowMd: string;        // Medium shadow for premium screens
  shadowLg: string;        // Large shadow for premium screens

  // Table colors
  tableHead: string;
}

// Light Theme
export const LIGHT: Theme = {
  // Background
  bg: '#F2F5F2',
  surface: '#FFFFFF',
  surfaceAlt: '#EFF4EF',
  topbar: '#FFFFFF',

  // Border
  border: '#DDE8DD',
  borderSub: '#EEF4EE',

  // Text
  text: '#0D1A0D',
  textSub: '#3A5A3A',
  textMuted: '#7A9A7A',

  // Accent (Primary Green)
  accent: '#198A00',
  accentBg: '#E4F5E0',
  accentText: '#0A5000',
  accentLighter: '#D4EFF5',    // Light cyan/blue for premium screens
  accentDark: '#126B00',       // Dark green for hover/active

  // Status colors
  red: '#EF3340',
  redBg: '#FDECEE',
  redText: '#8A0010',
  orange: '#E07200',
  orangeBg: '#FFF0E0',
  orangeText: '#7A3A00',
  green: '#198A00',
  greenBg: '#E4F5E0',
  greenText: '#0A5000',

  // Secondary Navy Blue
  navy: '#1A3A52',
  navyBg: 'rgba(26, 58, 82, 0.1)',
  navyText: '#1A3A52',

  // Shadow
  shadow: 'rgba(25, 138, 0, 0.10)',
  shadowMd: 'rgba(13, 27, 42, 0.12)',    // Medium shadow
  shadowLg: 'rgba(13, 27, 42, 0.16)',    // Large shadow

  // Table colors
  tableHead: '#F5FAF5',
};

// Dark Theme
export const DARK: Theme = {
  // Background
  bg: '#0A140A',
  surface: '#121E12',
  surfaceAlt: '#182418',
  topbar: '#121E12',

  // Border
  border: '#243024',
  borderSub: '#1A241A',

  // Text
  text: '#E0EEE0',
  textSub: '#80A880',
  textMuted: '#4A6A4A',

  // Accent (Primary Green - Brighter for dark)
  accent: '#34C000',
  accentBg: '#0A2008',
  accentText: '#80E060',
  accentLighter: '#1A4D5C',    // Dark cyan background for premium screens
  accentDark: '#2BA5B5',       // Light cyan for hover/active

  // Status colors
  red: '#FF5060',
  redBg: '#280A0E',
  redText: '#FF9098',
  orange: '#FF9030',
  orangeBg: '#281600',
  orangeText: '#FFB870',
  green: '#34C000',
  greenBg: '#0A2008',
  greenText: '#80E060',

  // Secondary Navy Blue
  navy: '#2D5A7B',
  navyBg: 'rgba(45, 90, 123, 0.15)',
  navyText: '#2D5A7B',

  // Shadow
  shadow: 'rgba(52, 192, 0, 0.14)',
  shadowMd: 'rgba(0, 0, 0, 0.4)',        // Medium shadow
  shadowLg: 'rgba(0, 0, 0, 0.5)',        // Large shadow

  // Table colors
  tableHead: '#182418',
};

// Zambia Flag Colors (Green, Black, Red, Orange)
export const ZAMBIA_FLAG: string[] = ['#198A00', '#1A1A1A', '#EF3340', '#FF8200'];