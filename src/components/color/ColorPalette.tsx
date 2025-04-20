/**
 * ColorPalette Component
 * 
 * A comprehensive color management system that provides:
 * - Interactive color palette generation and editing
 * - WCAG compliance checking
 * - Color scale management
 * - Alpha color support
 * - Color duplication and customization
 */

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { calculateWCAGRatio } from '../../utils/colorUtils';
import { ADS_COLORS, NEUTRAL_COLORS, DARK_NEUTRAL_COLORS, HSLColor } from '../../constants/adsColors';
import { ColorTooltip } from '../color/ColorTooltip';
import { HSLToHex, hexToHSL } from '../../utils/colorUtils';

/**
 * Main wrapper component for the color palette
 * Provides border, background, and positioning context
 */
const Wrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.lg};
  background: #FFFFFF;
  display: inline-flex;
  position: relative;
  overflow: visible;
`;

/**
 * Container for scrollable color palette content
 * Handles horizontal scrolling for wide color sets
 */
const Container = styled.div`
  display: flex;
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.small};
`;

/**
 * Layout component for the main palette sections
 * Provides consistent spacing between palette sections
 */
const PaletteLayout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
`;

/**
 * Container for the main color palettes
 * Organizes colors in a vertical layout
 */
const MainPalettes = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * Section for dark neutral colors
 * Separated from main palettes with a border
 */
const DarkNeutralSection = styled.div`
  display: flex;
  flex-direction: column;
  border-left: 1px solid ${({ theme }) => theme.colors.border.default};
  padding-left: ${({ theme }) => theme.spacing.lg};
`;

/**
 * Generic section container for color groups
 * Provides consistent layout for color sections
 */
const Section = styled.div`
  display: flex;
`;

/**
 * Title component for color sections
 * Uses secondary text color for visual hierarchy
 */
const SectionTitle = styled.h2`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const ScaleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 32px;
  padding-right: ${({ theme }) => theme.spacing.md};
  text-align: right;
  border-right: 1px solid ${({ theme }) => theme.colors.border.default};
  margin-right: ${({ theme }) => theme.spacing.md};
`;

const ScaleLabel = styled.div`
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: ${({ theme }) => theme.spacing.xs};
`;

const ColorGrid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ColorColumn = styled.div<{ $isSelected: boolean }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  opacity: 1;
  background: ${({ $isSelected, theme }) => $isSelected ? theme.colors.background.hover : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.xs};
  transition: background 0.2s ease;
  cursor: pointer;
  position: relative;
`;

const ColorScales = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ColorCell = styled.div<{ $color: string; $showTooltip?: boolean }>`
  width: 40px;
  height: 40px;
  background-color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;

  ${({ $showTooltip }) => $showTooltip && `
    &:hover > div {
      display: block;
    }
  `}
`;

const WcagText = styled.div<{ $color: 'white' | 'black' }>`
  color: ${({ $color }) => $color};
  font-size: 0.65rem;
  font-weight: 500;
  text-shadow: ${({ $color }) => 
    $color === 'white' 
      ? '0 1px 2px rgba(0, 0, 0, 0.3)' 
      : '0 1px 2px rgba(255, 255, 255, 0.3)'};
`;

const AlphaIndicator = styled.div`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  opacity: 0.8;
`;

const ControlPanel = styled.div<{ $position: 'left' | 'right' }>`
  position: absolute;
  ${({ $position }) => $position === 'left' ? 'right: 100%;' : 'left: 100%;'}
  top: 0;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  width: 280px;
  margin: 0 ${({ theme }) => theme.spacing.xs};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const ControlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ControlTitle = styled.h3`
  font-size: 0.875rem;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  text-transform: capitalize;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.xs};
  right: ${({ theme }) => theme.spacing.xs};
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 4px;
  border-radius: ${({ theme }) => theme.borderRadius.small};

  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
  }
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
`;

const SliderContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SliderLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SliderValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  font-size: 0.75rem;
`;

const Slider = styled.input`
  width: 100%;
`;

const Button = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
  }
`;

const HexInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// Define scale sets for each type
const ALL_SCALES = ['0', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100'] as const;
const FOUNDATION_SCALES = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100'] as const;
const NEUTRAL_SCALES = ['0', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100'] as const;
const DARK_NEUTRAL_SCALES = ['-100', '0', '100', '200', '250', '300', '350', '400', '500', '600', '700', '800', '900', '1000', '1100'] as const;

// Define hue ranges for each color with center points
const HUE_RANGES = {
  lime: { min: 60, max: 90, center: 75 },
  red: { min: -20, max: 10, center: -5 },
  orange: { min: 20, max: 40, center: 30 },
  yellow: { min: 40, max: 60, center: 50 },
  green: { min: 90, max: 150, center: 120 },
  teal: { min: 150, max: 200, center: 175 },
  blue: { min: 200, max: 240, center: 220 },
  purple: { min: 240, max: 300, center: 270 },
  magenta: { min: 300, max: 340, center: 320 },
  neutral: { min: 0, max: 360, center: 180 },
  'dark-neutral': { min: 0, max: 360, center: 180 }
} as const;

// Define saturation limits for each color
const NEUTRAL_SATURATION = {
  lime: 85,
  red: 90,
  orange: 95,
  yellow: 90,
  green: 85,
  teal: 80,
  blue: 85,
  purple: 80,
  magenta: 85,
  neutral: 15,
  'dark-neutral': 20
} as const;

// Define lightness levels for each scale relative to level 700
const LIGHTNESS_LEVELS = {
  // Foundation and Neutral colors (lighter to darker)
  '100': 96,
  '200': 93,
  '300': 90,
  '400': 85,
  '500': 75,
  '600': 65,
  '700': 55, // Base level
  '800': 45,
  '900': 35,
  '1000': 25,
  // Special levels for neutral
  '0': 100,
  // Dark neutral specific scales (darker to lighter)
  '-100': 100,
  '250': 87.5,
  '350': 82.5,
} as const;

// Store original ADS colors lightness values
const ADS_LIGHTNESS: Record<string, Record<string, number>> = {
  lime: {},
  red: {},
  orange: {},
  yellow: {},
  green: {},
  teal: {},
  blue: {},
  purple: {},
  magenta: {},
  neutral: {},
  'dark-neutral': {},
};

// Initialize ADS lightness values
Object.entries(ADS_COLORS).forEach(([color, scales]) => {
  Object.entries(scales).forEach(([scale, hslColor]) => {
    if (!ADS_LIGHTNESS[color]) ADS_LIGHTNESS[color] = {};
    const hex = HSLToHex(hslColor.h, hslColor.s, hslColor.l);
    ADS_LIGHTNESS[color][scale] = hexToHSL(hex).l;
  });
});

Object.entries(NEUTRAL_COLORS.solid).forEach(([scale, hslColor]) => {
  const color = hslColor as HSLColor;
  const hex = HSLToHex(color.h, color.s, color.l);
  ADS_LIGHTNESS.neutral[scale] = hexToHSL(hex).l;
});

Object.entries(DARK_NEUTRAL_COLORS.solid).forEach(([scale, hslColor]) => {
  const color = hslColor as HSLColor;
  const hex = HSLToHex(color.h, color.s, color.l);
  ADS_LIGHTNESS['dark-neutral'][scale] = hexToHSL(hex).l;
});

/**
 * Type definition for hue ranges in the color system
 */
type HueRange = typeof HUE_RANGES[keyof typeof HUE_RANGES];

/**
 * Type for color values that can be either string or HSL object
 */
type ColorValue = string | HSLColor;

/**
 * Type definition for a color scale with string keys and values
 */
interface ColorScale {
  [key: string]: HSLColor;
}

/**
 * Type definition for a map of color scales
 */
interface ColorMap {
  [key: string]: ColorScale;
}

/**
 * Type definition for foundation colors including neutral variants
 */
interface FoundationColors {
  [key: string]: ColorScale;
}

/**
 * Type definition for dark neutral colors and their alpha variants
 */
interface DarkNeutralColors {
  [key: string]: ColorScale;
}

/**
 * Converts HSL color object to hex string
 */
const convertHSLToHex = (color: HSLColor): string => {
  return HSLToHex(color.h, color.s, color.l);
};

/**
 * Main ColorPalette component for managing and displaying color system
 * Manages the entire color palette system and user interactions
 */
export const ColorPalette: React.FC = () => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [controlPosition, setControlPosition] = useState<'left' | 'right'>('right');
  const [colorName, setColorName] = useState<string>('');
  const [hue, setHue] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(100);
  const [editedColors, setEditedColors] = useState<ColorMap>({});
  const [foundationColors, setFoundationColors] = useState<FoundationColors>(() => {
    return {
      ...ADS_COLORS,
      'neutral': NEUTRAL_COLORS.solid,
      'neutral-alpha': NEUTRAL_COLORS.alpha,
    };
  });
  const [darkNeutralColors, setDarkNeutralColors] = useState<DarkNeutralColors>(() => {
    return {
      'dark-neutral': DARK_NEUTRAL_COLORS.solid,
      'dark-neutral-alpha': DARK_NEUTRAL_COLORS.alpha,
    };
  });
  const [currentHSL, setCurrentHSL] = useState<HSLColor>({ h: 0, s: 100, l: 50 });
  const colorGridRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);

  // Update state when selecting a column
  useEffect(() => {
    if (selectedColumn) {
      setColorName(selectedColumn);
      const baseColor = getBaseColor(selectedColumn);
      if (baseColor) {
        const range = getHueRange(selectedColumn);
        setHue(baseColor.h);
        setSaturation(baseColor.s);
        setCurrentHSL(baseColor);
      }
    }
  }, [selectedColumn, darkNeutralColors, foundationColors]);

  const getColorString = (color: HSLColor): string => {
    return HSLToHex(color.h, color.s, color.l);
  };

  const getColorValue = (colorScale: ColorScale | undefined, scale: string): HSLColor | undefined => {
    if (!colorScale) return undefined;
    
    const color = colorScale[scale];
    if (!color) {
      const alphaScale = scale + 'a';
      const alphaColor = colorScale[alphaScale];
      if (!alphaColor) return undefined;
      return alphaColor;
    }
    
    return color;
  };

  const getBaseColor = (colorKey: string): HSLColor | undefined => {
    const colors = colorKey.includes('dark-neutral') 
      ? (darkNeutralColors as unknown as ColorMap)[colorKey]
      : (foundationColors as unknown as ColorMap)[colorKey];
    
    if (!colors) return undefined;
    
    const color = colors['500'] || colors['500a'] || Object.values(colors)[0];
    return color;
  };

  const handleNameChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && selectedColumn) {
      const newName = event.currentTarget.value;
      setColorName(newName);
    }
  };

  const getHueRange = (colorName: string): HueRange => {
    const key = colorName.toLowerCase().replace('-alpha', '').split('-')[0];
    return HUE_RANGES[key as keyof typeof HUE_RANGES] || HUE_RANGES.neutral;
  };

  const getNeutralSaturation = (colorName: string): number => {
    const key = colorName.toLowerCase().replace('-alpha', '').split('-')[0];
    return NEUTRAL_SATURATION[key as keyof typeof NEUTRAL_SATURATION] || NEUTRAL_SATURATION.neutral;
  };

  const normalizeHue = (hue: number): number => {
    if (hue < 0) return 360 + hue;
    if (hue >= 360) return hue - 360;
    return hue;
  };

  const handleHueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(event.target.value);
    setHue(newHue);
    updateColors(newHue, saturation);
  };

  const handleSaturationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseInt(event.target.value);
    setSaturation(newSaturation);
    updateColors(hue, newSaturation);
  };

  const getScalesForType = (colorType: string): readonly string[] => {
    if (colorType === 'neutral') {
      return NEUTRAL_SCALES;
    }
    if (colorType === 'dark-neutral') {
      return DARK_NEUTRAL_SCALES;
    }
    return FOUNDATION_SCALES;
  };

  const updateColors = (h: number, s: number) => {
    if (!selectedColumn || selectedColumn.includes('-alpha')) return;

    const colors = { ...editedColors };
    if (!colors[selectedColumn]) {
      colors[selectedColumn] = {};
    }

    // Get the appropriate scales for this color type
    const scales = getScalesForType(selectedColumn);
    
    // Special case: neutral level 0 is always white
    if (selectedColumn.includes('neutral') && scales.includes('0')) {
      colors[selectedColumn]['0'] = { h: 0, s: 0, l: 100 };
    }

    // Calculate new colors using HSL values directly
    scales.forEach(scale => {
      if (scale !== '0' || !selectedColumn.includes('neutral')) {
        const l = LIGHTNESS_LEVELS[scale as keyof typeof LIGHTNESS_LEVELS];
        colors[selectedColumn][scale] = { h, s, l };
      }
    });

    setCurrentHSL({ h, s, l: LIGHTNESS_LEVELS['700'] });
    setEditedColors(colors);
  };

  const updateColorsFromHex = (hex: string) => {
    if (!selectedColumn || selectedColumn.includes('-alpha') || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;

    const { h, s } = hexToHSL(hex);
    setHue(h);
    setSaturation(s);
    updateColors(h, s);
  };

  const handleHexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = event.target.value;
    setCurrentHSL(hexToHSL(newHex));
    
    if (newHex.length === 7) {  // Full hex color (#RRGGBB)
      updateColorsFromHex(newHex);
    }
  };

  const handleDuplicatePalette = () => {
    if (!selectedColumn || selectedColumn.includes('-alpha')) return;

    const currentColors = editedColors[selectedColumn] || 
      (selectedColumn.includes('dark-neutral') 
        ? darkNeutralColors[selectedColumn]
        : foundationColors[selectedColumn]);

    const newColors = { ...editedColors };
    const newKey = `${selectedColumn}-copy`;
    newColors[newKey] = {};

    Object.entries(currentColors).forEach(([scale, color]) => {
      newColors[newKey][scale] = { ...color };
    });

    setEditedColors(newColors);
  };

  const handleColumnClick = (key: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Prevent interaction with alpha columns
    if (key.includes('-alpha')) return;

    // If clicking the same column, toggle the panel
    if (selectedColumn === key) {
      setSelectedColumn(null);
      return;
    }

    // If clicking a different column, show its panel
    setSelectedColumn(key);
    
    if (colorGridRef.current && wrapperRef.current) {
      const columnElement = event.currentTarget;
      const columnRect = columnElement.getBoundingClientRect();
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      
      const spaceOnRight = wrapperRect.right - columnRect.right;
      const spaceOnLeft = columnRect.left - wrapperRect.left;
      const requiredSpace = 300;
      
      setControlPosition(spaceOnRight >= requiredSpace ? 'right' : 'left');
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedColumn(null);
  };

  const getWcagCompliance = (color: string) => {
    const whiteRatio = calculateWCAGRatio(color, '#FFFFFF');
    const blackRatio = calculateWCAGRatio(color, '#000000');
    
    return {
      white: whiteRatio >= 7.0 ? 'AAA' : whiteRatio >= 4.5 ? 'AA' : null,
      black: blackRatio >= 7.0 ? 'AAA' : blackRatio >= 4.5 ? 'AA' : null
    };
  };

  const isAlphaColor = (key: string) => {
    return key.includes('alpha');
  };

  const renderColorGrid = (colors: Record<string, ColorScale>, scales: readonly string[]) => (
    <ColorGrid ref={colorGridRef}>
      {Object.entries(colors).map(([key, colorScale]) => {
        const isAlpha = key.includes('-alpha');
        const isDarkNeutral = key.includes('dark-neutral');
        const isNeutral = key === 'neutral';
        
        // Calculate empty cells needed at the top
        const startIndex = isNeutral ? 0 : (isDarkNeutral ? 0 : 1);
        
        return (
          <ColorColumn 
            key={key}
            data-key={key}
            $isSelected={selectedColumn === key}
            onClick={(e) => handleColumnClick(key, e)}
            style={{ cursor: isAlpha ? 'default' : 'pointer' }}
          >
            <ColorScales>
              {/* Add empty cells at the top if needed */}
              {Array.from({ length: startIndex }, (_, i) => (
                <ColorCell key={`empty-${i}`} $color="transparent" />
              ))}
              {scales.map(scale => {
                const hslColor = getColorValue(colorScale, scale);
                const colorHex = hslColor ? getColorString(hslColor) : 'transparent';
                return (
                  <ColorCell 
                    key={scale} 
                    $color={colorHex}
                    $showTooltip={true}
                  >
                    {hslColor && (
                      <>
                        <ColorTooltip color={colorHex} />
                        {isAlpha ? (
                          <AlphaIndicator>α</AlphaIndicator>
                        ) : (
                          (() => {
                            const wcag = getWcagCompliance(colorHex);
                            return (
                              <>
                                {wcag.white && <WcagText $color="white">{wcag.white}</WcagText>}
                                {wcag.black && <WcagText $color="black">{wcag.black}</WcagText>}
                              </>
                            );
                          })()
                        )}
                      </>
                    )}
                  </ColorCell>
                );
              })}
            </ColorScales>
            {selectedColumn === key && !isAlpha && (
              <ControlPanel 
                ref={controlPanelRef}
                $position={controlPosition}
                onClick={(e) => e.stopPropagation()}
              >
                <ControlHeader>
                  <ControlTitle>{colorName}</ControlTitle>
                  <CloseButton onClick={handleCloseClick}>✕</CloseButton>
                </ControlHeader>
                <Input 
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  onKeyDown={handleNameChange}
                />
                <HexInput
                  type="text"
                  value={getColorString(currentHSL)}
                  onChange={handleHexChange}
                  placeholder="#000000"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
                <SliderContainer>
                  <SliderLabel>
                    Hue
                    <SliderValue>{Math.round(hue)}°</SliderValue>
                  </SliderLabel>
                  <Slider 
                    type="range"
                    min={getHueRange(key).min}
                    max={getHueRange(key).max}
                    value={hue}
                    onChange={handleHueChange}
                  />
                </SliderContainer>
                <SliderContainer>
                  <SliderLabel>
                    Saturation
                    <SliderValue>{Math.round(saturation)}%</SliderValue>
                  </SliderLabel>
                  <Slider 
                    type="range"
                    min={0}
                    max={getNeutralSaturation(key)}
                    value={saturation}
                    onChange={handleSaturationChange}
                  />
                </SliderContainer>
                <Button onClick={handleDuplicatePalette}>
                  Duplicate Palette
                </Button>
              </ControlPanel>
            )}
          </ColorColumn>
        );
      })}
    </ColorGrid>
  );

  const renderScaleColumn = (scales: readonly string[]) => (
    <ScaleColumn>
      {ALL_SCALES.map(scale => (
        <ScaleLabel key={scale}>{scale}</ScaleLabel>
      ))}
    </ScaleColumn>
  );

  return (
    <Wrapper ref={wrapperRef}>
      <Container onClick={handleCloseClick}>
        <PaletteLayout>
          {/* Foundation Colors */}
          <MainPalettes>
            <SectionTitle>Foundation Colors</SectionTitle>
            <Section>
              {renderScaleColumn(FOUNDATION_SCALES)}
              {renderColorGrid(foundationColors, FOUNDATION_SCALES)}
            </Section>
          </MainPalettes>

          {/* Dark Neutral Colors */}
          <DarkNeutralSection>
            <SectionTitle>Dark Neutral Colors</SectionTitle>
            <Section>
              {renderScaleColumn(DARK_NEUTRAL_SCALES)}
              {renderColorGrid(darkNeutralColors, DARK_NEUTRAL_SCALES)}
            </Section>
          </DarkNeutralSection>
        </PaletteLayout>
      </Container>
    </Wrapper>
  );
}; 