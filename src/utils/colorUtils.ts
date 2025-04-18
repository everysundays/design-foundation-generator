import chroma from 'chroma-js';
import { ColorValue, WCAG, COLOR_SCALE } from '../types/color';

export const calculateWCAGRatio = (color1: string, color2: string): number => {
  // Convert colors to relative luminance
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  
  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const getRelativeLuminance = (hex: string): number => {
  const rgb = hexToRGB(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(component => {
    const sRGB = component / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const hexToRGB = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const hexToHSL = (hex: string) => {
  const { r, g, b } = hexToRGB(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

export const HSLToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
};

export const checkWCAGCompliance = (ratio: number) => {
  return {
    aa: ratio >= WCAG.AA_NORMAL,
    aaa: ratio >= WCAG.AAA_NORMAL,
  };
};

export const generateColorValue = (color: string, index: number): ColorValue => {
  const hex = color;
  const whiteTextRatio = calculateWCAGRatio(hex, '#FFFFFF');
  const blackTextRatio = calculateWCAGRatio(hex, '#000000');

  return {
    hex,
    name: `color-${COLOR_SCALE[index]}`,
    wcag: {
      whiteText: whiteTextRatio,
      blackText: blackTextRatio,
      passes: {
        white: checkWCAGCompliance(whiteTextRatio),
        black: checkWCAGCompliance(blackTextRatio),
      },
    },
  };
};

export const generateColorScale = (
  baseColor: string,
  hue: number,
  saturation: number
): string[] => {
  try {
    const base = chroma(baseColor);
    const adjustedBase = base.set('hsl.h', hue).set('hsl.s', saturation);

    return COLOR_SCALE.map((lightness) => {
      return chroma.hsl(
        adjustedBase.get('hsl.h'),
        adjustedBase.get('hsl.s'),
        1 - lightness / 100
      ).hex();
    });
  } catch (error) {
    console.error('Error generating color scale:', error);
    return Array(COLOR_SCALE.length).fill('#FFFFFF');
  }
}; 