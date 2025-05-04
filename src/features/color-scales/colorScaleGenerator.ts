/**
 * Color Scale Generator
 * Handles generation of color scales based on base colors
 */
import { ColorHSB, ColorScale, ScaleLevel } from '@/types/color';

/**
 * Calculates brightness using a linear algorithm
 * Uses color 700 as base and calculates other values using linear proportion
 */
export function calculateLinearBrightness(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  const BASE_LEVEL = 700;
  const MAX_BRIGHTNESS = 100;
  
  // Calculate distance from base level
  const levelDiff = targetLevel - BASE_LEVEL;
  
  // Define brightness change rate per level
  const BRIGHTNESS_STEP = 5; // 5% per level
  
  // Calculate new brightness
  const newBrightness = baseColor.brightness + (levelDiff / 100) * BRIGHTNESS_STEP;
  
  // Limit value to 0-100 range
  return Math.max(0, Math.min(MAX_BRIGHTNESS, newBrightness));
}

/**
 * Calculates brightness using an exponential algorithm
 * Uses exponential function for non-linear change
 */
export function calculateExponentialBrightness(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  const BASE_LEVEL = 700;
  const MAX_BRIGHTNESS = 100;
  
  // Calculate normalized distance from base level (-1 to 1)
  const normalizedDiff = (targetLevel - BASE_LEVEL) / 400; // 400 is max distance from 700 (300 to 1100)
  
  // Use exponential function for non-linear change
  const exponentialFactor = Math.exp(normalizedDiff) - 1;
  
  // Calculate new brightness
  const brightnessChange = exponentialFactor * 20; // 20% is max change
  const newBrightness = baseColor.brightness + brightnessChange;
  
  // Limit value to 0-100 range
  return Math.max(0, Math.min(MAX_BRIGHTNESS, newBrightness));
}

/**
 * Calculates saturation based on scale level
 * Adjusts saturation slightly based on level
 */
export function calculateSaturation(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  const BASE_LEVEL = 700;
  const MAX_SATURATION = 100;
  
  // Calculate distance from base level
  const levelDiff = targetLevel - BASE_LEVEL;
  
  // Adjust saturation:
  // - Increase slightly for darker colors (800-1000)
  // - Decrease slightly for lighter colors (100-600)
  const SATURATION_STEP = 2; // 2% per level
  
  const newSaturation = baseColor.saturation + (levelDiff / 100) * SATURATION_STEP;
  
  // Limit value to 0-100 range
  return Math.max(0, Math.min(MAX_SATURATION, newSaturation));
}

/**
 * Type for brightness calculation functions
 */
export type BrightnessCalculator = typeof calculateLinearBrightness | typeof calculateExponentialBrightness;

/**
 * Generates a complete color scale from a base color
 */
export function generateColorScale(
  baseColor: ColorHSB, 
  brightnessFunction: BrightnessCalculator = calculateLinearBrightness
): ColorScale {
  const levels: ScaleLevel[] = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  
  return levels.reduce((scale, level) => {
    scale[level] = {
      hue: baseColor.hue,
      saturation: calculateSaturation(baseColor, level),
      brightness: brightnessFunction(baseColor, level)
    };
    return scale;
  }, {} as ColorScale);
}

/**
 * Default color presets for testing
 */
export const defaultColors: Record<string, ColorHSB> = {
  blue: { hue: 220, saturation: 70, brightness: 60 },
  red: { hue: 0, saturation: 70, brightness: 60 },
  green: { hue: 120, saturation: 70, brightness: 60 },
  purple: { hue: 280, saturation: 70, brightness: 60 },
  orange: { hue: 30, saturation: 85, brightness: 65 },
  teal: { hue: 180, saturation: 65, brightness: 55 }
}; 