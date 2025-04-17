import React, { useState } from 'react';
import styled from 'styled-components';
import { calculateWCAGRatio } from '../../utils/colorUtils';
import { ADS_COLORS, NEUTRAL_COLORS, DARK_NEUTRAL_COLORS } from '../../constants/adsColors';

const Wrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background.primary};
  max-width: fit-content;
  margin: 0 auto;
`;

const Container = styled.div`
  display: flex;
`;

const ScaleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 40px;
  padding-right: ${({ theme }) => theme.spacing.xl};
  text-align: right;
  border-right: 1px solid ${({ theme }) => theme.colors.border.default};
  margin-right: ${({ theme }) => theme.spacing.xl};
`;

const ScaleLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const ColorGrid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ColorColumn = styled.div<{ $isFocused: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  position: relative;
  padding-bottom: ${({ $isFocused }) => $isFocused ? '120px' : '0'};
  transition: padding-bottom 0.2s ease;
`;

const ColorCell = styled.div<{ $color: string; $isSelected?: boolean }>`
  width: 48px;
  height: 48px;
  background-color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  border: 2px solid transparent;
  
  ${({ $isSelected, theme }) => $isSelected && `
    border-color: ${theme.colors.border.focus};
  `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.focus};
  }
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

const ColumnControls = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing.xs};
  left: 0;
  width: 100%;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  transition: opacity 0.2s ease;
  background: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SliderLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 2px;
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

const ALL_SCALES = ['-100', '0', '100', '200', '250', '300', '350', '400', '500', '600', '700', '800', '900', '1000', '1100'];

// Define hue ranges for each color
const HUE_RANGES = {
  lime: { min: 60, max: 90 },
  red: { min: -20, max: 10 },
  orange: { min: 20, max: 40 },
  yellow: { min: 40, max: 60 },
  green: { min: 90, max: 150 },
  teal: { min: 150, max: 200 },
  blue: { min: 200, max: 240 },
  purple: { min: 240, max: 300 },
  magenta: { min: 300, max: 340 },
};

export const ColorPalette: React.FC = () => {
  const [focusedColumn, setFocusedColumn] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  
  // Combine all color types into one object
  const allColors = {
    ...ADS_COLORS,
    'neutral': NEUTRAL_COLORS.solid,
    'neutral-alpha': NEUTRAL_COLORS.alpha,
    'dark-neutral': DARK_NEUTRAL_COLORS.solid,
    'dark-neutral-alpha': DARK_NEUTRAL_COLORS.alpha,
  };

  const getWcagCompliance = (color: string) => {
    const whiteRatio = calculateWCAGRatio(color, '#FFFFFF');
    const blackRatio = calculateWCAGRatio(color, '#000000');
    
    return {
      white: whiteRatio >= 4.5 ? 'AA' : null,
      black: blackRatio >= 4.5 ? 'AA' : null
    };
  };

  const isAlphaColor = (key: string, colorKey: string) => {
    return key.includes('alpha') || colorKey.includes('a');
  };

  const getHueRange = (colorName: string) => {
    const key = colorName.toLowerCase();
    return HUE_RANGES[key as keyof typeof HUE_RANGES] || { min: 0, max: 360 };
  };

  return (
    <Wrapper>
      <Container>
        <ScaleColumn>
          {ALL_SCALES.map(scale => (
            <ScaleLabel key={scale}>{scale}</ScaleLabel>
          ))}
        </ScaleColumn>
        <ColorGrid>
          {Object.entries(allColors).map(([key, colors]) => {
            const hueRange = getHueRange(key);
            return (
              <ColorColumn 
                key={key}
                $isFocused={focusedColumn === key}
                onMouseEnter={() => setFocusedColumn(key)}
                onMouseLeave={() => setFocusedColumn(null)}
              >
                {ALL_SCALES.map(scale => {
                  const normalKey = scale;
                  const alphaKey = `${scale}a`;
                  const color = colors[normalKey as keyof typeof colors] || 
                              colors[alphaKey as keyof typeof colors] || 
                              'transparent';
                  const isAlpha = isAlphaColor(key, color !== 'transparent' ? (colors[alphaKey as keyof typeof colors] ? alphaKey : normalKey) : '');
                  const cellId = `${key}-${scale}`;
                  
                  return (
                    <ColorCell 
                      key={scale} 
                      $color={color}
                      $isSelected={selectedCell === cellId}
                      onClick={() => setSelectedCell(cellId)}
                    >
                      {color !== 'transparent' && (() => {
                        if (isAlpha) {
                          return <AlphaIndicator>α</AlphaIndicator>;
                        }
                        const wcag = getWcagCompliance(color);
                        return (
                          <>
                            {wcag.white && <WcagText $color="white">AA</WcagText>}
                            {wcag.black && <WcagText $color="black">AA</WcagText>}
                          </>
                        );
                      })()}
                    </ColorCell>
                  );
                })}
                <ColumnControls $visible={focusedColumn === key}>
                  <Input 
                    type="text"
                    placeholder="Color name"
                    defaultValue={key}
                  />
                  <SliderContainer>
                    <SliderLabel>Hue</SliderLabel>
                    <Slider 
                      type="range"
                      min={hueRange.min}
                      max={hueRange.max}
                      defaultValue={(hueRange.min + hueRange.max) / 2}
                    />
                  </SliderContainer>
                  <SliderContainer>
                    <SliderLabel>Saturation</SliderLabel>
                    <Slider 
                      type="range"
                      min={0}
                      max={100}
                      defaultValue={100}
                    />
                  </SliderContainer>
                  <Button>Duplicate Column</Button>
                </ColumnControls>
              </ColorColumn>
            );
          })}
        </ColorGrid>
      </Container>
    </Wrapper>
  );
}; 