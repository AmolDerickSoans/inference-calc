# Code Style and Conventions

## Naming Conventions
- **Components**: PascalCase (e.g., `CalculatorForm`, `ProfitabilityGraph`)
- **Variables/Functions**: camelCase (e.g., `llmUtilization`, `calculateLlmResult`)
- **Types/Interfaces**: PascalCase (e.g., `LlmCalculationResult`, `VoiceModel`)
- **Constants**: SCREAMING_SNAKE_CASE for data constants (e.g., `LLM_GPU_DATA`, `VOICE_MODELS`)
- **Files**: 
  - Components: PascalCase (e.g., `CalculatorForm.tsx`)
  - Utilities/types: camelCase (e.g., `types.ts`, `constants.ts`)

## TypeScript Patterns
- Use **interfaces** for type definitions (not type aliases)
- Define props interfaces before components (e.g., `interface CalculatorFormProps`)
- Use `React.FC` or explicit typing for functional components
- Prefer explicit return types for complex functions
- Use index signatures for dynamic object keys (e.g., `[key: string]: number`)
- Optional properties use `?` (e.g., `fp8?: number`)
- Nullable values use `| null` (e.g., `number | null`)

## React Patterns
- **Functional components** with hooks (no class components)
- Use `useState` for local state
- Use `useMemo` for expensive computations
- Use `useEffect` for side effects
- Destructure props in function parameters
- Use controlled components for forms

## Code Organization
- **Utility functions** defined above components in the same file
- **Type definitions** in separate `types.ts` file
- **Constants/data** in separate `constants.ts` file
- **Components** in `/components` directory
- Related logic grouped together

## Import/Export
- Named exports for utilities and types
- Default export for main components
- Group imports by: external libraries, local components, types, utilities
- Use path alias `@/` for imports from project root

## Styling
- **Tailwind CSS** utility classes
- Class names as strings (e.g., `className="font-medium text-gray-900"`)
- Conditional classes using template literals or ternary operators
- Responsive classes (e.g., `sm:`, `md:`, `lg:`)

## Comments & Documentation
- Minimal inline comments (code should be self-documenting)
- Section comments for major blocks (e.g., `// --- UTILITY FUNCTIONS ---`)
- JSDoc comments not heavily used
- Type definitions serve as documentation

## Best Practices
- Immutable state updates
- Pure functions where possible
- Early returns for guard clauses
- Null/undefined checks before using values
- Template literals for string interpolation
- Arrow functions for callbacks
- Optional chaining (`?.`) and nullish coalescing (`??`) operators
- Array methods (map, filter, forEach) over for loops