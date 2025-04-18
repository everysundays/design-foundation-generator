# Data Structure Documentation

## Color System Data Structure

### Types

```typescript
interface ColorValue {
  hex: string;
  name?: string;
  wcag: {
    white: boolean;  // AA compliance with white text
    black: boolean;  // AA compliance with black text
  };
}

interface ColorScale {
  '-100': ColorValue;
  '0': ColorValue;
  '100': ColorValue;
  // ... other scale values
  '1100': ColorValue;
}

interface ColorDefinition {
  id: string;
  name: string;
  baseColor: string;  // HEX value
  hue: number;
  saturation: number;
  scales: ColorScale;
}

interface ColorPaletteState {
  colors: {
    [key: string]: {  // e.g., 'lime', 'red', etc.
      solid: ColorDefinition;
      alpha?: ColorDefinition;
    };
  };
  neutrals: {
    solid: ColorDefinition;
    alpha: ColorDefinition;
  };
  darkNeutrals: {
    solid: ColorDefinition;
    alpha: ColorDefinition;
  };
}
```

### State Management

We'll use React's Context API for state management with the following structure:

```typescript
interface ColorPaletteContext {
  state: ColorPaletteState;
  actions: {
    updateColorName: (colorId: string, newName: string) => void;
    updateColorHue: (colorId: string, newHue: number) => void;
    updateColorSaturation: (colorId: string, newSaturation: number) => void;
    duplicateColor: (colorId: string) => void;
    deleteColor: (colorId: string) => void;
    exportPalette: () => ColorPaletteState;
    importPalette: (palette: ColorPaletteState) => void;
  };
}
```

### Data Flow

1. **Color Generation**
   ```
   Base Color (HEX) → Convert to HSL → Adjust Hue/Saturation → Generate Scale → Convert to HEX
   ```

2. **WCAG Calculation**
   ```
   Color Value → Calculate Contrast Ratio → Determine AA Compliance → Update UI
   ```

3. **State Updates**
   ```
   User Action → Context Action → State Update → Recalculate Colors → Update UI
   ```

## File Structure

```
src/
├── components/
│   └── color/
│       ├── ColorPalette.tsx      # Main component
│       ├── ColorRow.tsx          # Individual color row
│       └── ColorCell.tsx         # Individual color cell
├── context/
│   └── ColorPaletteContext.tsx   # State management
├── hooks/
│   ├── useColorGeneration.ts     # Color generation logic
│   └── useWCAG.ts               # WCAG calculation
├── types/
│   └── color.ts                 # Type definitions
└── utils/
    └── colorUtils.ts            # Color manipulation utilities
```

## Storage

For now, we'll use local storage to persist the color palette state:

```typescript
interface StorageStructure {
  version: string;
  lastUpdated: string;
  palette: ColorPaletteState;
}
```

## Export Format

The export will be in JSON format following the ColorPaletteState structure, with additional metadata:

```json
{
  "version": "1.0.0",
  "name": "My Design System",
  "description": "Custom color palette",
  "lastUpdated": "2024-03-28T12:00:00Z",
  "palette": {
    // ColorPaletteState data
  }
}
```

## Future Considerations

1. **Version Control**
   - Track changes to color palettes
   - Support undo/redo operations
   - Store revision history

2. **Team Collaboration**
   - Real-time collaboration
   - User permissions
   - Change notifications

3. **API Integration**
   - REST endpoints for saving/loading palettes
   - WebSocket for real-time updates
   - Authentication/Authorization 