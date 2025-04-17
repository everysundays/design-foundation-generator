import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      success: string;
      danger: string;
      warning: string;
      info: string;
      background: {
        primary: string;
        secondary: string;
        hover: string;
      };
      text: {
        primary: string;
        secondary: string;
        inverse: string;
      };
      border: {
        default: string;
        focus: string;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
    };
    typography: {
      fontFamily: {
        base: string;
        mono: string;
      };
      fontSize: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
      };
      fontWeight: {
        regular: string;
        medium: string;
        semibold: string;
        bold: string;
      };
      lineHeight: {
        tight: string;
        normal: string;
        relaxed: string;
      };
    };
  }
} 