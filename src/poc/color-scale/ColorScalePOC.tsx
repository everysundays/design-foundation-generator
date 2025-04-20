import React, { useState } from 'react';
import styled from 'styled-components';
import { HSBColor } from '../../types/color';
import { generateColorScale, generateNeutralScale } from '../../utils/colorScale';
import { hsbToHex, getContrastColor } from '../../utils/colorConversion';

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
`;

const Description = styled.p`
  color: #666;
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
`;

const Slider = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Value = styled.span`
  font-family: monospace;
  color: #666;
`;

const ScalesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const ScaleSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScaleTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 1rem;
`;

const ColorSwatch = styled.div<{ color: string }>`
  height: 48px;
  background-color: ${props => props.color};
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  color: ${props => getContrastColor(props.color)};
  font-family: monospace;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateX(4px);
    transition: transform 0.2s ease;
  }
`;

const ColorInfo = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const LevelIndicator = styled.span`
  font-weight: bold;
`;

/**
 * Color Scale POC Component
 * 
 * แสดงตัวอย่างการใช้ color scale algorithm ใหม่ที่ใช้:
 * - HSB color model
 * - Logarithmic scaling
 * - Perceptual brightness
 * - Dynamic saturation adjustment
 */
export function ColorScalePOC() {
  const [baseColor, setBaseColor] = useState<HSBColor>({
    hue: 220,        // สีน้ำเงิน
    saturation: 90,  // ใช้ค่าจาก ADS
    brightness: 65,  // ค่ากลางจาก algorithm
  });

  // สร้าง color scales
  const normalScale = generateColorScale(baseColor);
  const neutralScale = generateNeutralScale(baseColor);

  return (
    <Container>
      <Header>
        <Title>Color Scale POC</Title>
        <Description>
          ทดสอบ algorithm สำหรับสร้าง color scale โดยใช้ HSB color model
          และ logarithmic scaling เพื่อให้ได้การเปลี่ยนแปลงที่เป็นธรรมชาติ
        </Description>
      </Header>

      <Controls>
        <Slider>
          <Label>
            Hue
            <Value>{baseColor.hue}°</Value>
          </Label>
          <input
            type="range"
            min="0"
            max="360"
            value={baseColor.hue}
            onChange={e => setBaseColor({ ...baseColor, hue: Number(e.target.value) })}
          />
        </Slider>
        <Slider>
          <Label>
            Saturation
            <Value>{baseColor.saturation}%</Value>
          </Label>
          <input
            type="range"
            min="0"
            max="100"
            value={baseColor.saturation}
            onChange={e => setBaseColor({ ...baseColor, saturation: Number(e.target.value) })}
          />
        </Slider>
        <Slider>
          <Label>
            Brightness
            <Value>{baseColor.brightness}%</Value>
          </Label>
          <input
            type="range"
            min="0"
            max="100"
            value={baseColor.brightness}
            onChange={e => setBaseColor({ ...baseColor, brightness: Number(e.target.value) })}
          />
        </Slider>
      </Controls>

      <ScalesContainer>
        <ScaleSection>
          <ScaleTitle>Normal Scale</ScaleTitle>
          {Object.entries(normalScale).map(([level, color]) => (
            <ColorSwatch key={level} color={hsbToHex(color)}>
              <ColorInfo>
                <LevelIndicator>{level}</LevelIndicator>
                <span>{hsbToHex(color)}</span>
              </ColorInfo>
            </ColorSwatch>
          ))}
        </ScaleSection>

        <ScaleSection>
          <ScaleTitle>Neutral Scale</ScaleTitle>
          {Object.entries(neutralScale).map(([level, color]) => (
            <ColorSwatch key={level} color={hsbToHex(color)}>
              <ColorInfo>
                <LevelIndicator>{level}</LevelIndicator>
                <span>{hsbToHex(color)}</span>
              </ColorInfo>
            </ColorSwatch>
          ))}
        </ScaleSection>
      </ScalesContainer>
    </Container>
  );
} 