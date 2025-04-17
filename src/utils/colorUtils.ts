import chroma from 'chroma-js';
import { ColorValue, WCAG, COLOR_SCALE } from '../types/color';

export const calculateWCAGRatio = (color: string, textColor: string): number => {
  const bg = chroma(color);
  const text = chroma(textColor);
  return chroma.contrast(bg, text);
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