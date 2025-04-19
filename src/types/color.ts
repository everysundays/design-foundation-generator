/**
 * color.ts - Color Type Definitions and Constants
 * 
 * INDEX:
 * ColorValue - Color value with WCAG compliance data
 * ColorRow - Color row with base color and variants
 * ColorType - Color categories
 * COLOR_SCALE - Scale values for color generation
 * WCAG - WCAG compliance ratio constants
 */

/**
 * Interface for a color value with WCAG compliance information
 */
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

/**
 * Interface for a color row containing base color and its variants
 */
export interface ColorRow {
  id: string;
  baseColor: string;
  name: string;
  hue: number;
  saturation: number;
  values: ColorValue[];
}

/**
 * Type definition for color categories
 */
export type ColorType = 'saturated' | 'neutral' | 'alpha';

/**
 * ADS color scale values (0-100)
 * Used for generating color variations
 */
export const COLOR_SCALE = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 92, 94, 96, 98, 99, 100];

/**
 * WCAG contrast ratio requirements for different compliance levels
 */
export const WCAG = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
}; 