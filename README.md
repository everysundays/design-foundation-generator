# Design Foundation Generator

A tool to help UX/UI Designers create and manage design systems with standardized color palettes and typography.

## Features

- Color palette generation with customizable scales
- Color management based on HSL and HSB color models
- Theme creation by selecting specific colors for roles
- Typography system with scale generation
- Export to design tools like Figma

## Project Structure

```
design-foundation-generator/
├── src/                  # Source code
│   ├── components/       # Reusable UI components
│   │   ├── color-wheel/  # Color wheel selection
│   │   ├── color-scales/ # Color scale generation
│   │   └── ...
│   ├── styles/           # CSS stylesheets
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── docs/                 # Documentation
└── config/               # Configuration files
```

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Getting Started

1. Clone the repository
   ```
   git clone https://github.com/everysundays/design-foundation-generator.git
   cd design-foundation-generator
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start development server
   ```
   npm run dev
   ```

4. Build for production
   ```
   npm run build
   ```

## Architecture

The application is built using a modular approach with feature-based organization:

- **Color Management**: Tools for creating and editing color palettes
- **Color Scales**: Algorithms for generating balanced color scales
- **Typography**: Typography scale management
- **Export**: Export functionality to various design tools

## License

MIT