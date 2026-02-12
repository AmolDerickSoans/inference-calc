# Suggested Commands

## Development Commands

### Initial Setup
```bash
npm install
```
Install all project dependencies.

### Development Server
```bash
npm run dev
```
Start the Vite development server. The app will be available at:
- Local: http://localhost:3000
- Network: http://0.0.0.0:3000

### Build for Production
```bash
npm run build
```
Build the production-optimized bundle to the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```
Preview the production build locally before deployment.

## Git Commands
```bash
git status          # Check current status
git add .           # Stage all changes
git commit -m "..."  # Commit with message
git push            # Push to remote
git pull            # Pull latest changes
git log --oneline   # View commit history
```

## File System Commands (macOS/Darwin)

### Navigation
```bash
pwd                 # Print working directory
ls                  # List files
ls -la              # List all files with details
cd <directory>      # Change directory
```

### File Operations
```bash
cat <file>          # Display file contents
less <file>         # Page through file
head <file>         # Show first lines
tail <file>         # Show last lines
grep <pattern> <file>  # Search in file
find . -name "*.tsx"   # Find files by pattern
```

### Process Management
```bash
ps aux              # List all processes
kill <pid>          # Kill process by ID
pkill -f "vite"     # Kill process by name
```

## Notes
- **No testing framework configured**: Tests are not set up (no Jest, Vitest, etc.)
- **No linting configured**: ESLint is not installed
- **No formatting configured**: Prettier is not installed
- **Environment**: Requires `GEMINI_API_KEY` in `.env.local` (though not currently used in code)

## Common Development Workflow
1. `npm install` - Install dependencies (first time only)
2. `npm run dev` - Start development server
3. Make changes to code
4. Check browser for hot-reloaded changes
5. `git add .` and `git commit` when ready
6. `npm run build` - Build for production
7. `npm run preview` - Test production build