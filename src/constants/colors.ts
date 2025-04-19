import { HSLColor } from '../types/color';

// Base color palette in HSL format
export const ADS_COLORS = {
  blue: {
    '100': { h: 201, s: 96, l: 91 },
    '200': { h: 201, s: 96, l: 82 },
    '300': { h: 201, s: 96, l: 73 },
    '400': { h: 201, s: 96, l: 64 },
    '500': { h: 201, s: 96, l: 55 },
    '600': { h: 201, s: 96, l: 46 },
    '700': { h: 201, s: 96, l: 37 },
    '800': { h: 201, s: 96, l: 28 },
    '900': { h: 201, s: 96, l: 19 },
    '1000': { h: 201, s: 96, l: 10 }
  },
  purple: {
    '100': { h: 250, s: 96, l: 91 },
    '200': { h: 250, s: 96, l: 82 },
    '300': { h: 250, s: 96, l: 73 },
    '400': { h: 250, s: 96, l: 64 },
    '500': { h: 250, s: 96, l: 55 },
    '600': { h: 250, s: 96, l: 46 },
    '700': { h: 250, s: 96, l: 37 },
    '800': { h: 250, s: 96, l: 28 },
    '900': { h: 250, s: 96, l: 19 },
    '1000': { h: 250, s: 96, l: 10 }
  },
  magenta: {
    '100': { h: 320, s: 96, l: 91 },
    '200': { h: 320, s: 96, l: 82 },
    '300': { h: 320, s: 96, l: 73 },
    '400': { h: 320, s: 96, l: 64 },
    '500': { h: 320, s: 96, l: 55 },
    '600': { h: 320, s: 96, l: 46 },
    '700': { h: 320, s: 96, l: 37 },
    '800': { h: 320, s: 96, l: 28 },
    '900': { h: 320, s: 96, l: 19 },
    '1000': { h: 320, s: 96, l: 10 }
  },
  teal: {
    '100': { h: 185, s: 96, l: 91 },
    '200': { h: 185, s: 96, l: 82 },
    '300': { h: 185, s: 96, l: 73 },
    '400': { h: 185, s: 96, l: 64 },
    '500': { h: 185, s: 96, l: 55 },
    '600': { h: 185, s: 96, l: 46 },
    '700': { h: 185, s: 96, l: 37 },
    '800': { h: 185, s: 96, l: 28 },
    '900': { h: 185, s: 96, l: 19 },
    '1000': { h: 185, s: 96, l: 10 }
  },
  red: {
    '100': { h: 0, s: 96, l: 91 },
    '200': { h: 0, s: 96, l: 82 },
    '300': { h: 0, s: 96, l: 73 },
    '400': { h: 0, s: 96, l: 64 },
    '500': { h: 0, s: 96, l: 55 },
    '600': { h: 0, s: 96, l: 46 },
    '700': { h: 0, s: 96, l: 37 },
    '800': { h: 0, s: 96, l: 28 },
    '900': { h: 0, s: 96, l: 19 },
    '1000': { h: 0, s: 96, l: 10 }
  },
  orange: {
    '100': { h: 30, s: 96, l: 91 },
    '200': { h: 30, s: 96, l: 82 },
    '300': { h: 30, s: 96, l: 73 },
    '400': { h: 30, s: 96, l: 64 },
    '500': { h: 30, s: 96, l: 55 },
    '600': { h: 30, s: 96, l: 46 },
    '700': { h: 30, s: 96, l: 37 },
    '800': { h: 30, s: 96, l: 28 },
    '900': { h: 30, s: 96, l: 19 },
    '1000': { h: 30, s: 96, l: 10 }
  },
  yellow: {
    '100': { h: 45, s: 96, l: 91 },
    '200': { h: 45, s: 96, l: 82 },
    '300': { h: 45, s: 96, l: 73 },
    '400': { h: 45, s: 96, l: 64 },
    '500': { h: 45, s: 96, l: 55 },
    '600': { h: 45, s: 96, l: 46 },
    '700': { h: 45, s: 96, l: 37 },
    '800': { h: 45, s: 96, l: 28 },
    '900': { h: 45, s: 96, l: 19 },
    '1000': { h: 45, s: 96, l: 10 }
  },
  green: {
    '100': { h: 145, s: 96, l: 91 },
    '200': { h: 145, s: 96, l: 82 },
    '300': { h: 145, s: 96, l: 73 },
    '400': { h: 145, s: 96, l: 64 },
    '500': { h: 145, s: 96, l: 55 },
    '600': { h: 145, s: 96, l: 46 },
    '700': { h: 145, s: 96, l: 37 },
    '800': { h: 145, s: 96, l: 28 },
    '900': { h: 145, s: 96, l: 19 },
    '1000': { h: 145, s: 96, l: 10 }
  },
  lime: {
    '100': { h: 90, s: 96, l: 91 },
    '200': { h: 90, s: 96, l: 82 },
    '300': { h: 90, s: 96, l: 73 },
    '400': { h: 90, s: 96, l: 64 },
    '500': { h: 90, s: 96, l: 55 },
    '600': { h: 90, s: 96, l: 46 },
    '700': { h: 90, s: 96, l: 37 },
    '800': { h: 90, s: 96, l: 28 },
    '900': { h: 90, s: 96, l: 19 },
    '1000': { h: 90, s: 96, l: 10 }
  },
  neutral: {
    '-100': { h: 0, s: 0, l: 100 },
    '0': { h: 0, s: 0, l: 98 },
    '100': { h: 0, s: 0, l: 95 },
    '200': { h: 0, s: 0, l: 90 },
    '300': { h: 0, s: 0, l: 80 },
    '400': { h: 0, s: 0, l: 70 },
    '500': { h: 0, s: 0, l: 60 },
    '600': { h: 0, s: 0, l: 50 },
    '700': { h: 0, s: 0, l: 40 },
    '800': { h: 0, s: 0, l: 30 },
    '900': { h: 0, s: 0, l: 20 },
    '1000': { h: 0, s: 0, l: 10 },
    '1100': { h: 0, s: 0, l: 0 }
  },
  'neutral-alpha': {
    '100': { h: 0, s: 0, l: 100, a: 0.9 },
    '200': { h: 0, s: 0, l: 100, a: 0.8 },
    '300': { h: 0, s: 0, l: 100, a: 0.7 },
    '400': { h: 0, s: 0, l: 100, a: 0.6 },
    '500': { h: 0, s: 0, l: 100, a: 0.5 }
  },
  'dark-neutral': {
    '-100': { h: 0, s: 0, l: 100 },
    '0': { h: 0, s: 0, l: 95 },
    '100': { h: 0, s: 0, l: 90 },
    '200': { h: 0, s: 0, l: 85 },
    '250': { h: 0, s: 0, l: 80 },
    '300': { h: 0, s: 0, l: 75 },
    '350': { h: 0, s: 0, l: 70 },
    '400': { h: 0, s: 0, l: 65 },
    '500': { h: 0, s: 0, l: 55 },
    '600': { h: 0, s: 0, l: 45 },
    '700': { h: 0, s: 0, l: 35 },
    '800': { h: 0, s: 0, l: 25 },
    '900': { h: 0, s: 0, l: 15 },
    '1000': { h: 0, s: 0, l: 10 },
    '1100': { h: 0, s: 0, l: 5 }
  },
  'dark-neutral-alpha': {
    '-100': { h: 0, s: 0, l: 0, a: 1.0 },
    '100': { h: 0, s: 0, l: 0, a: 0.9 },
    '200': { h: 0, s: 0, l: 0, a: 0.8 },
    '250': { h: 0, s: 0, l: 0, a: 0.75 },
    '300': { h: 0, s: 0, l: 0, a: 0.7 },
    '350': { h: 0, s: 0, l: 0, a: 0.65 },
    '400': { h: 0, s: 0, l: 0, a: 0.6 },
    '500': { h: 0, s: 0, l: 0, a: 0.5 }
  }
} as const;

// Elevation colors based on ADS
export const ELEVATION_COLORS = {
  light: {
    surface: {
      default: ADS_COLORS.neutral['0'],
      raised: ADS_COLORS.neutral['0'],
      sunken: ADS_COLORS.neutral['200'],
      overlay: { ...ADS_COLORS.neutral['0'], a: 0.9 }
    },
    shadow: {
      default: { ...ADS_COLORS['dark-neutral']['100'], a: 0.15 },
      raised: { ...ADS_COLORS['dark-neutral']['100'], a: 0.2 },
      sunken: { ...ADS_COLORS['dark-neutral']['200'], a: 0.1 }
    }
  },
  dark: {
    surface: {
      default: ADS_COLORS['dark-neutral']['800'],
      raised: ADS_COLORS['dark-neutral']['700'],
      sunken: ADS_COLORS['dark-neutral']['900'],
      overlay: { ...ADS_COLORS['dark-neutral']['800'], a: 0.9 }
    },
    shadow: {
      default: { ...ADS_COLORS['dark-neutral']['900'], a: 0.25 },
      raised: { ...ADS_COLORS['dark-neutral']['900'], a: 0.3 },
      sunken: { ...ADS_COLORS['dark-neutral']['900'], a: 0.2 }
    }
  }
} as const;

// Semantic color roles based on ADS
export const COLOR_ROLES = {
  light: {
    brand: ADS_COLORS.blue['400'],
    information: ADS_COLORS.blue['400'],
    success: ADS_COLORS.green['400'],
    warning: ADS_COLORS.yellow['300'],
    danger: ADS_COLORS.red['400'],
    discovery: ADS_COLORS.purple['400'],
    accent: {
      red: ADS_COLORS.red['500'],
      orange: ADS_COLORS.orange['500'],
      yellow: ADS_COLORS.yellow['500'],
      green: ADS_COLORS.green['500'],
      teal: ADS_COLORS.teal['500'],
      blue: ADS_COLORS.blue['500'],
      purple: ADS_COLORS.purple['500'],
      magenta: ADS_COLORS.magenta['500'],
      lime: ADS_COLORS.lime['500']
    },
    surface: {
      default: ADS_COLORS.neutral['0'],
      raised: ADS_COLORS.neutral['0'],
      sunken: ADS_COLORS.neutral['200'],
      overlay: { ...ADS_COLORS.neutral['0'], a: 0.9 }
    },
    text: {
      default: ADS_COLORS['dark-neutral']['800'],
      subtle: ADS_COLORS['dark-neutral']['500'],
      disabled: ADS_COLORS['dark-neutral']['300'],
      inverse: ADS_COLORS.neutral['0'],
      brand: ADS_COLORS.blue['400'],
      danger: ADS_COLORS.red['400'],
      warning: ADS_COLORS.yellow['400'],
      success: ADS_COLORS.green['400'],
      discovery: ADS_COLORS.purple['400'],
      information: ADS_COLORS.blue['400']
    },
    shadow: {
      default: { ...ADS_COLORS['dark-neutral']['100'], a: 0.15 },
      raised: { ...ADS_COLORS['dark-neutral']['100'], a: 0.2 },
      sunken: { ...ADS_COLORS['dark-neutral']['200'], a: 0.1 }
    }
  },
  dark: {
    brand: ADS_COLORS.blue['400'],
    information: ADS_COLORS.blue['400'],
    success: ADS_COLORS.green['400'],
    warning: ADS_COLORS.yellow['300'],
    danger: ADS_COLORS.red['400'],
    discovery: ADS_COLORS.purple['400'],
    accent: {
      red: ADS_COLORS.red['400'],
      orange: ADS_COLORS.orange['400'],
      yellow: ADS_COLORS.yellow['400'],
      green: ADS_COLORS.green['400'],
      teal: ADS_COLORS.teal['400'],
      blue: ADS_COLORS.blue['400'],
      purple: ADS_COLORS.purple['400'],
      magenta: ADS_COLORS.magenta['400'],
      lime: ADS_COLORS.lime['400']
    },
    surface: {
      default: ADS_COLORS['dark-neutral']['800'],
      raised: ADS_COLORS['dark-neutral']['700'],
      sunken: ADS_COLORS['dark-neutral']['900'],
      overlay: { ...ADS_COLORS['dark-neutral']['800'], a: 0.9 }
    },
    text: {
      default: ADS_COLORS.neutral['0'],
      subtle: ADS_COLORS['dark-neutral']['300'],
      disabled: ADS_COLORS['dark-neutral']['500'],
      inverse: ADS_COLORS['dark-neutral']['800'],
      brand: ADS_COLORS.blue['400'],
      danger: ADS_COLORS.red['400'],
      warning: ADS_COLORS.yellow['400'],
      success: ADS_COLORS.green['400'],
      discovery: ADS_COLORS.purple['400'],
      information: ADS_COLORS.blue['400']
    },
    shadow: {
      default: { ...ADS_COLORS['dark-neutral']['900'], a: 0.25 },
      raised: { ...ADS_COLORS['dark-neutral']['900'], a: 0.3 },
      sunken: { ...ADS_COLORS['dark-neutral']['900'], a: 0.2 }
    }
  }
} as const; 