import React from 'react';
import styled from 'styled-components';
import chroma from 'chroma-js';

const TooltipContainer = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: ${({ theme }) => theme.spacing.xs};
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 1000;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  display: none;  // Hidden by default

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: ${({ theme }) => theme.colors.border.default} transparent transparent transparent;
  }
`;

const ValueRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Value = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: monospace;
`;

interface ColorTooltipProps {
  color: string;
}

export const ColorTooltip: React.FC<ColorTooltipProps> = ({ color }) => {
  const chromaColor = chroma(color);
  const rgba = chromaColor.rgba();
  
  return (
    <TooltipContainer>
      <ValueRow>
        <Label>HEX:</Label>
        <Value>{color.toUpperCase()}</Value>
      </ValueRow>
      <ValueRow>
        <Label>RGBA:</Label>
        <Value>
          {`${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3].toFixed(2)}`}
        </Value>
      </ValueRow>
    </TooltipContainer>
  );
}; 