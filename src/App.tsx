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
import styled, { ThemeProvider } from 'styled-components'
import { GlobalStyle } from './styles/GlobalStyle'
import { theme } from './styles/theme'
import { ColorPalette } from './components/color/ColorPalette'

/**
 * Root container component that wraps the entire application
 */
const AppContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background.secondary};
`

/**
 * Header section component containing the application title
 */
const Header = styled.header`
  margin-bottom: 2rem;
`

/**
 * Main title component for the application
 */
const Title = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

/**
 * Main App component that sets up theme provider and renders the app structure
 */
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <Title>Design Foundation Generator</Title>
        </Header>
        <main>
          <ColorPalette />
        </main>
      </AppContainer>
    </ThemeProvider>
  )
}

export default App 