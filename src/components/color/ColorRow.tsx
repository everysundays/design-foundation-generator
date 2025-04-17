import React from 'react';
import styled from 'styled-components';
import { calculateWCAGRatio } from '../../utils/colorUtils';

// Define all possible scales
const ALL_SCALES = ['-100', '0', '100', '200', '250', '300', '350', '400', '500', '600', '700', '800', '900', '1000', '1100'];

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ScaleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 40px;
  padding-right: ${({ theme }) => theme.spacing.sm};
  text-align: right;
`;

const ScaleLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  height: 48px; // Match ColorCell height
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const ColorColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ColorCell = styled.div<{ $color: string }>`
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

interface ColorRowProps {
  name: string;
  colors: Record<string, string>;
  onNameChange?: (name: string) => void;
}

export const ColorRow: React.FC<ColorRowProps> = ({ colors }) => {
  const getWcagCompliance = (color: string) => {
    const whiteRatio = calculateWCAGRatio(color, '#FFFFFF');
    const blackRatio = calculateWCAGRatio(color, '#000000');
    
    return {
      white: whiteRatio >= 4.5 ? 'AA' : null,
      black: blackRatio >= 4.5 ? 'AA' : null
    };
  };

  // Create an array of colors for each scale
  const colorCells = ALL_SCALES.map(scale => {
    const normalKey = scale;
    const alphaKey = `${scale}a`;
    const color = colors[normalKey] || colors[alphaKey] || null;
    return { scale, color };
  });

  return (
    <Row>
      <ScaleColumn>
        {ALL_SCALES.map(scale => (
          <ScaleLabel key={scale}>{scale}</ScaleLabel>
        ))}
      </ScaleColumn>
      <ColorColumn>
        {colorCells.map(({ scale, color }) => (
          <ColorCell 
            key={scale} 
            $color={color || 'transparent'}
          >
            {color && (() => {
              const wcag = getWcagCompliance(color);
              return (
                <>
                  {wcag.white && <WcagText $color="white">AA</WcagText>}
                  {wcag.black && <WcagText $color="black">AA</WcagText>}
                </>
              );
            })()}
          </ColorCell>
        ))}
      </ColorColumn>
    </Row>
  );
}; 