/**
 * Color Utility Functions
 */
import { ColorHSB, ColorHSL, ColorRGB } from '@/types/color';

/**
 * Converts a hex color string to RGB
 */
export function hexToRgb(hex: string): ColorRGB {
  // Remove # if present
  const hexColor = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Parse the hex values
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Converts RGB to hex string
 */
export function rgbToHex(rgb: ColorRGB): string {
  const toHex = (value: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(value))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Converts RGB to HSL
 */
export function rgbToHsl(rgb: ColorRGB): ColorHSL {
  // Convert RGB to [0,1] range
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  // Calculate lightness
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (delta !== 0) {
    // Calculate saturation
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    // Calculate hue
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else { // max === b
      h = ((r - g) / delta + 4) / 6;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts HSL to RGB
 */
export function hslToRgb(hsl: ColorHSL): ColorRGB {
  // Convert to [0,1] range
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  if (s === 0) {
    // Achromatic (gray)
    const rgbValue = Math.round(l * 255);
    return { r: rgbValue, g: rgbValue, b: rgbValue };
  }
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = hue2rgb(p, q, h + 1/3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1/3);
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Converts HSB/HSV to HSL
 */
export function hsbToHsl(hsb: ColorHSB): ColorHSL {
  const { hue, saturation, brightness } = hsb;
  
  // Convert to [0,1] range
  const s = saturation / 100;
  const v = brightness / 100;
  
  // Calculate lightness
  const l = v * (1 - s/2);
  
  // Calculate saturation (avoid division by zero)
  const newS = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  
  return {
    h: hue,
    s: Math.round(newS * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts HSL to HSB/HSV
 */
export function hslToHsb(hsl: ColorHSL): ColorHSB {
  const { h, s, l } = hsl;
  
  // Convert to [0,1] range
  const slNormalized = s / 100;
  const lNormalized = l / 100;
  
  // Calculate brightness
  const v = lNormalized + slNormalized * Math.min(lNormalized, 1 - lNormalized);
  
  // Calculate saturation (avoid division by zero)
  const newS = v === 0 ? 0 : 2 * (1 - lNormalized / v);
  
  return {
    hue: h,
    saturation: Math.round(newS * 100),
    brightness: Math.round(v * 100)
  };
}

/**
 * Converts a color to CSS string representation
 */
export function colorToCssString(color: ColorHSB | ColorHSL | ColorRGB | string): string {
  if (typeof color === 'string') {
    return color; // Already a string (hex or named color)
  }
  
  if ('r' in color) {
    // RGB format
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
  
  if ('l' in color) {
    // HSL format
    return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
  }
  
  if ('brightness' in color) {
    // Convert HSB to HSL first
    const hsl = hsbToHsl(color);
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }
  
  throw new Error('Unsupported color format');
} 