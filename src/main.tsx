/**
 * main.tsx - Application Entry Point
 * 
 * INDEX:
 * main - Renders the root React component with theme provider
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from 'styled-components'
import theme, { GlobalStyle } from './styles/theme'

/**
 * Renders the root React component with theme provider and global styles
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </React.StrictMode>
) 