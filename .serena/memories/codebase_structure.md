# Codebase Structure

## Directory Layout
```
inference-calc/
├── components/              # React components
│   ├── CalculatorForm.tsx
│   ├── GpuEstimator.tsx
│   ├── ProfitabilityGraph.tsx
│   ├── ProfitableConfigurations.tsx
│   └── ResultTable.tsx
├── node_modules/            # Dependencies (gitignored)
├── .claude/                 # Claude Code configuration
├── .git/                    # Git repository
├── .serena/                 # Serena plugin data
├── App.tsx                  # Main application component
├── index.tsx                # React entry point
├── index.html               # HTML entry point
├── types.ts                 # TypeScript type definitions
├── constants.ts             # Data constants (GPU specs, models, etc.)
├── metadata.json            # Project metadata
├── package.json             # NPM package configuration
├── package-lock.json        # NPM lock file
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation
```

## Key Files

### Entry Points
- **index.html**: HTML entry point with Tailwind CDN and import maps
- **index.tsx**: React entry point that renders `<App />` into the DOM
- **App.tsx**: Main application component with routing logic and state management

### Configuration
- **package.json**: Dependencies and npm scripts
- **tsconfig.json**: TypeScript compiler options and path aliases
- **vite.config.ts**: Vite dev server and build configuration
- **.gitignore**: Files/folders excluded from git

### Core Application Files
- **App.tsx**: Main component containing:
  - Calculator mode routing (LLM, Image/Video, Voice, GPU Estimator, Reference)
  - State management for all calculators
  - Utility functions for calculations
  - Reference data display
  
- **types.ts**: TypeScript interfaces for:
  - LLM types (LlmGpuInfo, LlmModel, LlmCalculationResult)
  - Image/Video types (IvGpuData, ImageModel, VideoModel, IvCalculationResult)
  - Voice types (VoiceModel, VoiceCalculationResult)
  - GPU Estimator types (EstimatorGpu, EstimatorModel, EstimatorResult)
  
- **constants.ts**: Static data including:
  - GPU specifications and pricing
  - Model performance data
  - Competitor pricing
  - Benchmark data

### Components Directory
- **CalculatorForm.tsx**: Input form component for different calculator modes
- **GpuEstimator.tsx**: GPU cluster estimation calculator
- **ProfitabilityGraph.tsx**: Chart component using Recharts
- **ProfitableConfigurations.tsx**: Data table for configuration results
- **ResultTable.tsx**: Generic table component for displaying results

## Component Hierarchy
```
App
├── Mode Selection (buttons)
├── CalculatorForm (conditional)
│   └── Input controls
├── ProfitableConfigurations (conditional)
│   ├── Top configuration summary
│   ├── Data table
│   └── ProfitabilityGraph
├── GpuEstimator (conditional)
└── ReferenceView (conditional)
    └── Reference data tables
```

## Data Flow
1. User selects mode (LLM, Image/Video, Voice, GPU Estimator, Reference)
2. User adjusts inputs (utilization, markup, etc.) in CalculatorForm
3. State updates trigger useMemo calculations
4. Configurations computed for all GPU/model combinations
5. Results sorted by profitability
6. UI displays top configurations and charts

## Import Patterns
- External imports first (react, recharts)
- Local constants/types second
- Local components third
- Use `@/` alias for root imports (configured in vite.config.ts and tsconfig.json)