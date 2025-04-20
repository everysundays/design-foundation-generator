/**
 * theme.ts - Theme Configuration
 * 
 * INDEX:
 * theme - Main theme configuration object
 * DefaultTheme - Type definition for theme
 * 
 * SECTIONS:
 * colors - Color palette definitions
 * spacing - Spacing scale definitions
 * borderRadius - Border radius definitions
 * typography - Typography scale definitions
 */

import { createGlobalStyle, DefaultTheme } from 'styled-components'
import { Theme, BackgroundColors } from '../types/theme'

/**
 * Global theme object containing all design tokens
 */
export const theme: Theme = {
  /**
   * Color palette definitions
   */
  colors: {
    primary: '#2196F3',
    secondary: '#9C27B0',
    success: '#4CAF50',
    danger: '#F44336',
    warning: '#FF9800',
    info: '#00BCD4',
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      hover: '#E5E5E5',
      surface: '#FFFFFF'
    } as BackgroundColors,
    text: {
      primary: '#1F1F1F',
      secondary: '#6B6B6B',
      inverse: '#FFFFFF'
    },
    border: {
      default: '#E0E0E0',
      focus: '#2196F3'
    }
  },

  /**
   * Spacing scale
   */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },

  /**
   * Border radius scale
   */
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px'
  },

  /**
   * Typography system
   */
  typography: {
    fontFamily: {
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      mono: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px'
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  }
}

export default theme;

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily.base};
    background-color: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }
` 