# Technology Stack

## Core Framework
- **React**: 19.2.0 (UI library)
- **TypeScript**: 5.8.2 (type-safe JavaScript)
- **Vite**: 6.2.0 (build tool and dev server)

## Libraries & Dependencies
- **recharts**: 2.12.7 (charting/data visualization)
- **Tailwind CSS**: Loaded via CDN (utility-first CSS framework)
- **@vitejs/plugin-react**: 5.0.0 (Vite plugin for React)

## Development Tools
- **Node.js**: Required for package management and build
- **npm**: Package manager

## TypeScript Configuration
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Module resolution: bundler
- Experimental decorators: enabled
- Path aliases: `@/*` maps to project root

## Build Configuration
- **Vite** for bundling and development
- Dev server runs on port 3000
- Host: 0.0.0.0 (accessible on network)
- Environment variables loaded from .env.local
- Path alias `@/` configured for imports

## Browser Support
- Modern browsers supporting ES2022
- DOM and DOM.Iterable APIs

## Notes
- Uses import maps in index.html for CDN-based React/Recharts
- No testing framework currently configured
- No linting (ESLint) currently configured
- No formatting (Prettier) currently configured