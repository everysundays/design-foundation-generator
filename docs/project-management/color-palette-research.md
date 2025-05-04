# Atlassian Design System Color Palette Research

**Date:** May 4, 2023  
**Source:** [Atlassian Design System Color Palette](https://atlassian.design/foundations/color-new/color-palette-new)

## Overview

This document contains research and analysis of the Atlassian Design System (ADS) color palette, which serves as the foundation for our Design Foundation Generator. The analysis covers color structure, special values, and mathematical relationships between light and dark modes.

## Color Palette Structure

### Color Range
The ADS color palette uses an extended range from -100 to 1000:

- **-100**: Ultra light colors, typically near-white
- **0-50**: Very light colors
- **100-400**: Light colors
- **500**: Mid-point colors
- **600-900**: Dark colors
- **1000**: Ultra dark colors, typically near-black

### Special Values
Some color families include special values outside the standard increments:

- **250**: Present in some neutral palettes
- **Alpha variants**: Denoted with an "a" suffix (e.g., "darkneutral -100a")

### Standard Color Families
1. **Blue**
2. **Red**
3. **Yellow**
4. **Green**
5. **Teal** 
6. **Purple**
7. **Magenta**
8. **Neutral**
9. **DarkNeutral**

## Mathematical Relationships

### Light/Dark Mode Relationship
The ADS palette has an elegant mathematical relationship between light and dark mode colors:

- **Formula**: Dark mode color value = 1100 - Light mode color value
  - Example: Blue 200 in light mode corresponds to Blue 900 (1100-200) in dark mode

### Alpha Variants
Alpha variants follow the same hue and saturation as their opaque counterparts but with transparency:

- **Standard alpha values**: 0.64, 0.32, 0.24, 0.16, 0.08
- Alpha variants exist primarily in neutral and darkneutral palettes

## Color Model Considerations

### Color Model Analysis
Based on analysis of the ADS palette:

1. **HSB/HSV**: Preferred for internal calculations
   - More intuitive for designers
   - Better preserves saturation values
   - More direct control over brightness

2. **Conversion Precision Issues**
   - Round-trip conversions between color models can introduce errors
   - HSB → RGB → HSL → RGB → HSB can result in different values, even with no adjustments
   - Precision must be maintained through all calculations

## Implementation Notes

### Color Storage
- Store original HSB values with high precision (floating point)
- Maintain a record of base (700) colors for each palette
- Store alpha values separately from color values

### Tuning Strategy
- Adjust hue and saturation of the 700 color as the base
- Recalculate entire column using mathematical formulas that preserve the relationships
- Apply the same hue/saturation adjustments to all colors in the column, including alpha variants

### Export Format
The export format must map to Figma variables, which requires:

- Structured JSON format
- Distinct sections for light and dark mode colors
- Proper naming conventions
- Hexadecimal color values with alpha information

## References

1. [Atlassian Design System Color Palette](https://atlassian.design/foundations/color-new/color-palette-new)
2. [Figma Variables Documentation](https://help.figma.com/hc/en-us/articles/15339657135383-Variables-in-Figma)

---

This research document will be continuously updated as we gain more insights into the Atlassian Design System color palette and refine our implementation strategy. 