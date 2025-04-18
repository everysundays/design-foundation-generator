import { createGlobalStyle, DefaultTheme } from 'styled-components'

export const theme = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      hover: 'rgba(0, 0, 0, 0.04)'
    },
    text: {
      primary: '#1F1F1F',
      secondary: '#6B6B6B'
    },
    border: {
      default: '#E0E0E0'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px'
  },
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
};

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

// Add theme type declaration
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: {
        primary: string
        secondary: string
        hover: string
      }
      text: {
        primary: string
        secondary: string
        inverse: string
      }
      border: {
        default: string
        focus: string
      }
    }
    spacing: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
    }
    borderRadius: {
      small: string
      medium: string
      large: string
    }
    typography: {
      fontFamily: {
        base: string
        mono: string
      }
      fontSize: {
        xs: string
        sm: string
        md: string
        lg: string
        xl: string
        xxl: string
      }
      fontWeight: {
        regular: string
        medium: string
        semibold: string
        bold: string
      }
      lineHeight: {
        tight: string
        normal: string
        relaxed: string
      }
    }
  }
} 