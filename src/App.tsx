import React from 'react'
import styled from 'styled-components'
import { ColorPalette } from './components/color/ColorPalette'

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
    <AppContainer>
      <Header>
        <Title>Design Foundation Generator</Title>
      </Header>
      <main>
        <ColorPalette />
      </main>
    </AppContainer>
  )
}

export default App 