import { DefaultTheme } from 'styled-components';

export interface BackgroundColors {
  primary: string;
  secondary: string;
  hover: string;
  surface: string;
}

export interface Theme extends DefaultTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
    background: BackgroundColors;
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
} 