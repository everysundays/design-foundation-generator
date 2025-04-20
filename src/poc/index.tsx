import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0 0 2rem;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 1rem;
  color: #333;
`;

const Description = styled.p`
  color: #666;
  margin: 0 0 1rem;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  margin-bottom: 1rem;
`;

const POCLink = styled(Link)`
  display: block;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  color: #333;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e5e5;
    transform: translateX(4px);
  }
`;

const Status = styled.span<{ status: 'in-progress' | 'completed' }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-left: 1rem;
  background: ${props => props.status === 'completed' ? '#e6f4ea' : '#fef7e6'};
  color: ${props => props.status === 'completed' ? '#137333' : '#b95000'};
`;

/**
 * POC Index Page
 * รวบรวมและแสดงรายการ POCs ทั้งหมดในโปรเจค
 */
export function POCIndex() {
  return (
    <Container>
      <Title>Design Foundation Generator POCs</Title>
      
      <Section>
        <SectionTitle>Color System</SectionTitle>
        <Description>
          POCs สำหรับระบบสีต่างๆ ในโปรเจค ทั้ง color scales, color wheel,
          และการจัดการสีอื่นๆ
        </Description>
        <List>
          <ListItem>
            <POCLink to="/poc/color-scale">
              Color Scale
              <Status status="in-progress">In Progress</Status>
            </POCLink>
          </ListItem>
          <ListItem>
            <POCLink to="/poc/color-wheel">
              Color Wheel
              <Status status="in-progress">In Progress</Status>
            </POCLink>
          </ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>Documentation</SectionTitle>
        <Description>
          เอกสารอธิบายแนวคิดและการตัดสินใจต่างๆ ในการพัฒนา
        </Description>
        <List>
          <ListItem>
            <POCLink to="/docs/color-perception">
              Color Perception
              <Status status="completed">Completed</Status>
            </POCLink>
          </ListItem>
          <ListItem>
            <POCLink to="/docs/decisions">
              Design Decisions
              <Status status="completed">Completed</Status>
            </POCLink>
          </ListItem>
        </List>
      </Section>
    </Container>
  );
} 