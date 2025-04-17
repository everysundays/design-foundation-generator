export interface ColorValue {
  hex: string;
  name: string;
  wcag: {
    whiteText: number;
    blackText: number;
    passes: {
      white: {
        aa: boolean;
        aaa: boolean;
      };
      black: {
        aa: boolean;
        aaa: boolean;
      };
    };
  };
}

export interface ColorRow {
  id: string;
  baseColor: string;
  name: string;
  hue: number;
  saturation: number;
  values: ColorValue[];
}

export type ColorType = 'saturated' | 'neutral' | 'alpha';

// ADS color scale values (0-100)
export const COLOR_SCALE = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 92, 94, 96, 98, 99, 100];

// WCAG contrast ratios
export const WCAG = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
}; 