/**
 * Color Types
 * Definitions for color-related functionality
 */

/**
 * Color in HSL format (Hue, Saturation, Lightness)
 */
export interface ColorHSL {
  h: number; // Hue (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}

/**
 * Color in HSB/HSV format (Hue, Saturation, Brightness/Value)
 */
export interface ColorHSB {
  hue: number;        // Hue (0-360)
  saturation: number; // Saturation (0-100)
  brightness: number; // Brightness (0-100)
}

/**
 * Color in RGB format (Red, Green, Blue)
 */
export interface ColorRGB {
  r: number; // Red (0-255)
  g: number; // Green (0-255)
  b: number; // Blue (0-255)
}

/**
 * Color in RGBA format (Red, Green, Blue, Alpha)
 */
export interface ColorRGBA extends ColorRGB {
  a: number; // Alpha (0-1)
}

/**
 * Levels for color scales
 */
export type ScaleLevel = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;

/**
 * Color Scale - A mapping of scale levels to colors
 */
export type ColorScale = Record<ScaleLevel, ColorHSB>;

/**
 * Color Palette - A collection of named color scales
 */
export interface ColorPalette {
  [key: string]: ColorScale;
}

/**
 * Color Role - A design token that maps a semantic role to a specific color
 */
export interface ColorRole {
  name: string;
  description?: string;
  value: string; // Reference to a color in the palette (e.g., "Primary 500")
}

/**
 * Color Scheme - A collection of color roles for a specific theme (light/dark)
 */
export interface ColorScheme {
  name: string;
  roles: ColorRole[];
  isDark: boolean;
} 