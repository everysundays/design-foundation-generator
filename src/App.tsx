/**
 * App.tsx - Main Application Component
 * 
 * INDEX:
 * App - Main application component that sets up theme provider and renders the app structure
 * AppContainer - Root container with full viewport height and consistent padding
 * Header - Header section containing the application title
 * Title - Main title component with theme-based styling
 */

import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import styled, { ThemeProvider } from 'styled-components'
import { GlobalStyle } from './styles/GlobalStyle'
import { theme } from './styles/theme'
import { ColorPalette } from './components/color/ColorPalette'
import { ColorScalePOC } from './components/color/ColorScalePOC'

/**
 * Root container component that wraps the entire application
 */
const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`

/**
 * Header section component containing the application title
 */
const Header = styled.header`
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.surface};
`

/**
 * Main title component for the application
 */
const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

const Navigation = styled.nav`
  margin-top: 1rem;
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    margin-right: 1rem;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`

const MainContent = styled.main`
  padding: 2rem;
`

/**
 * Main App component that sets up theme provider and renders the app structure
 */
const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AppContainer>
          <Header>
            <Title>Design Foundation Generator</Title>
            <Navigation>
              <Link to="/">Home</Link>
              <Link to="/poc/color-scale">Color Scale POC</Link>
            </Navigation>
          </Header>
          <MainContent>
            <Routes>
              <Route path="/" element={<ColorPalette />} />
              <Route path="/poc/color-scale" element={<ColorScalePOC />} />
            </Routes>
          </MainContent>
        </AppContainer>
      </ThemeProvider>
    </Router>
  )
}

export default App 