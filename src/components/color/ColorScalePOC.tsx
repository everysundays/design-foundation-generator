import React, { useState } from 'react';
import styled from 'styled-components';

type ColorHSB = {
  hue: number;
  saturation: number;
  brightness: number;
};

type ScaleLevel = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;

// ADS Color System Constants
const LIGHTNESS_LEVELS = {
  100: 95,
  200: 90,
  300: 85,
  400: 75,
  500: 65,
  600: 55,
  700: 45,
  800: 35,
  900: 25,
  1000: 15,
} as const;

const COLOR_SATURATIONS = {
  lime: 90,
  red: 95,
  orange: 95,
  yellow: 95,
  green: 90,
  teal: 85,
  blue: 90,
  purple: 85,
  magenta: 90,
  neutral: 15,
  'dark-neutral': 20,
} as const;

const Container = styled.div`
  padding: 2rem;
  display: flex;
  gap: 2rem;
`;

const ScaleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScaleTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 1rem;
`;

const ColorSwatch = styled.div<{ color: string }>`
  width: 200px;
  height: 40px;
  background-color: ${props => props.color};
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: ${props => getContrastColor(props.color)};
  font-family: monospace;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Slider = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

// Helper functions
function hsbToHex({ hue, saturation, brightness }: ColorHSB): string {
  const s = saturation / 100;
  const b = brightness / 100;
  const k = (n: number) => (n + hue / 60) % 6;
  const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  
  const r = Math.round(255 * f(5));
  const g = Math.round(255 * f(3));
  const bl = Math.round(255 * f(1));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function calculateLinearBrightness(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  // ใช้ค่า lightness จาก ADS โดยตรง
  return LIGHTNESS_LEVELS[targetLevel];
}

function calculateExponentialBrightness(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  // ใช้ค่า lightness จาก ADS เป็นฐาน
  return LIGHTNESS_LEVELS[targetLevel];
}

function calculateSaturation(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  // ใช้ค่า saturation คงที่จาก ADS
  return COLOR_SATURATIONS.blue;
}

function generateColorScale(
  baseColor: ColorHSB,
  brightnessCalculator: typeof calculateLinearBrightness
): Record<ScaleLevel, ColorHSB> {
  const levels: ScaleLevel[] = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  
  return levels.reduce((scale, level) => {
    scale[level] = {
      hue: baseColor.hue,
      saturation: calculateSaturation(baseColor, level),
      brightness: brightnessCalculator(baseColor, level)
    };
    return scale;
  }, {} as Record<ScaleLevel, ColorHSB>);
}

export function ColorScalePOC() {
  const [baseColor, setBaseColor] = useState<ColorHSB>({
    hue: 220, // สีน้ำเงิน
    saturation: COLOR_SATURATIONS.blue,
    brightness: LIGHTNESS_LEVELS[500] // ใช้ระดับกลางเป็นค่าเริ่มต้น
  });
  
  const linearScale = generateColorScale(baseColor, calculateLinearBrightness);
  const exponentialScale = generateColorScale(baseColor, calculateExponentialBrightness);
  
  return (
    <div>
      <Controls>
        <Slider>
          <label>Hue: {baseColor.hue}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={baseColor.hue}
            onChange={e => setBaseColor({ ...baseColor, hue: Number(e.target.value) })}
          />
        </Slider>
        <Slider>
          <label>Saturation: {baseColor.saturation}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={baseColor.saturation}
            onChange={e => setBaseColor({ ...baseColor, saturation: Number(e.target.value) })}
          />
        </Slider>
        <Slider>
          <label>Brightness: {baseColor.brightness}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={baseColor.brightness}
            onChange={e => setBaseColor({ ...baseColor, brightness: Number(e.target.value) })}
          />
        </Slider>
      </Controls>
      
      <Container>
        <ScaleContainer>
          <ScaleTitle>Linear Scale</ScaleTitle>
          {Object.entries(linearScale).map(([level, color]) => (
            <ColorSwatch key={level} color={hsbToHex(color)}>
              {level}: {hsbToHex(color)}
            </ColorSwatch>
          ))}
        </ScaleContainer>
        
        <ScaleContainer>
          <ScaleTitle>Exponential Scale</ScaleTitle>
          {Object.entries(exponentialScale).map(([level, color]) => (
            <ColorSwatch key={level} color={hsbToHex(color)}>
              {level}: {hsbToHex(color)}
            </ColorSwatch>
          ))}
        </ScaleContainer>
      </Container>
    </div>
  );
} 