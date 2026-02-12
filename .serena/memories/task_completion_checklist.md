# Task Completion Checklist

## When a task is completed, follow these steps:

### 1. Code Quality
- [ ] Ensure TypeScript types are properly defined
- [ ] Follow existing naming conventions (camelCase for variables, PascalCase for components)
- [ ] Use functional components with hooks
- [ ] Apply appropriate Tailwind CSS classes for styling
- [ ] Remove unused imports and variables
- [ ] Ensure code follows existing patterns in the codebase

### 2. Testing (Manual)
Since no automated testing framework is configured, you should:
- [ ] Test the changes in the browser (`npm run dev`)
- [ ] Verify all calculator modes still work (LLM, Image/Video, Voice, GPU Estimator, Reference)
- [ ] Check for console errors or warnings
- [ ] Test responsive design at different screen sizes
- [ ] Verify calculations produce expected results
- [ ] Test edge cases (zero values, max values, etc.)

### 3. Build Verification
- [ ] Run `npm run build` to ensure production build works
- [ ] Check for any TypeScript errors or warnings
- [ ] Verify no build errors in terminal
- [ ] (Optional) Run `npm run preview` to test production build

### 4. Git Workflow
- [ ] Review changes with `git status` and `git diff`
- [ ] Stage relevant files: `git add <files>`
- [ ] Commit with clear message: `git commit -m "descriptive message"`
- [ ] Push to remote if ready: `git push`

### 5. Documentation
- [ ] Update README.md if new features were added
- [ ] Add comments for complex logic (if necessary)
- [ ] Update type definitions if data structures changed
- [ ] Document any new environment variables or configuration

## Common Issues to Check

### TypeScript Issues
- Missing type definitions
- Type mismatches in props or function parameters
- Unused variables or imports

### React Issues
- Missing dependencies in useEffect/useMemo hooks
- State updates not triggering re-renders
- Props not passed correctly to child components

### Styling Issues
- Responsive classes not working correctly
- Layout breaking at different screen sizes
- Color/spacing inconsistencies

### Build Issues
- Import path errors
- Missing dependencies in package.json
- Vite configuration problems

## Notes
- **No linting configured**: Manual code review is required
- **No formatting configured**: Ensure consistent formatting manually
- **No automated tests**: Rely on manual browser testing
- Always verify changes work across all calculator modes before committing