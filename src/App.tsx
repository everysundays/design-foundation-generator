import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { GlobalStyle } from './styles/GlobalStyle'
import { theme } from './styles/theme'
import { ColorPalette } from './components/color/ColorPalette'

const AppContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.background.secondary};
`

const Header = styled.header`
  margin-bottom: 2rem;
`

const Title = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
`

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