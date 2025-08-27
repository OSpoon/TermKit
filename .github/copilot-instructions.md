# DepCmd VS Code Extension - AI Coding Agent Guide

## Project Overview
DepCmd is a VS Code extension that simplifies terminal command management for developers. It auto-detects project types and provides categorized command shortcuts through a tree view interface.

## Architecture

### Core Components
- **CommandManager** (`src/core/manager.ts`): Singleton orchestrating commands, project detection, and data persistence
- **ProjectDetector** (`src/core/detector.ts`): Maps file patterns to project categories using VS Code configuration  
- **DatabaseManager** (`src/data/database.ts`): Manages command storage via VS Code's globalState with reactive events
- **DepCmdProvider** (`src/ui/provider.ts`): Tree view data provider for the sidebar interface

### Data Flow
1. Extension activates → CommandManager initializes → loads from DatabaseManager
2. ProjectDetector scans workspace for config files (package.json, Cargo.toml, etc.)
3. Commands filtered by detected categories → displayed in tree view
4. User clicks command → sent to VS Code terminal

## Key Patterns

### Singleton Pattern
All core services use singleton pattern with lazy initialization:
```typescript
public static getInstance(context?: vscode.ExtensionContext): CommandManager {
  if (!CommandManager._instance && context) {
    CommandManager._instance = new CommandManager(context)
  }
  return CommandManager._instance
}
```

### Reactive Data Management
DatabaseManager extends EventEmitter for reactive updates:
- Commands stored in VS Code globalState (syncs across devices)
- Events: `initialized`, `saved`, `commandAdded`, `commandUpdated`, etc.
- Debounced saves to prevent excessive writes

### Project Detection Configuration
Uses VS Code settings for flexible project detection mapping:
```json
"depCmd.projectDetection": {
  "pnpm": ["pnpm-lock.yaml"],
  "npm": ["package-lock.json"],
  "python": ["requirements.txt", "pyproject.toml"]
}
```

### Default Commands System
Commands auto-initialized from `config/default-commands.json` with predefined categories (npm, yarn, pnpm, python, rust, go, docker, git).

## Development Workflows

### Build & Development
- **Build**: `pnpm run build` (uses tsdown for bundling)
- **Dev**: `pnpm run dev` (watch mode with sourcemaps)
- **Test**: `pnpm test` (Vitest with VS Code mocks in `test/setup.ts`)

### Extension Development
- Entry point: `src/index.ts` using `reactive-vscode`
- Package with `pnpm run pack`, publish with `pnpm run publish`
- Auto-generates meta from package.json: `pnpm run update`

### Path Aliases
Uses `@src/*` and `@config/*` aliases configured in both tsconfig.json and vitest.config.ts.

## Testing Strategy
- **Mock VS Code APIs** in `test/setup.ts` for unit testing
- **Database tests** (`test/database.test.ts`) verify storage/retrieval
- **Project detection tests** verify file pattern matching
- Coverage excludes generated files and extension entry point

## Extension Points

### Adding New Project Types
1. Update `depCmd.projectDetection` configuration schema in package.json
2. Add detection patterns to `ProjectDetector.detectProject()`
3. Include default commands in `config/default-commands.json`

### Command Categories
Commands organized by categories matching project detection keys. Categories support:
- Custom display names and icons
- Project-specific filtering
- Automatic detection based on workspace files

### UI Customization
Tree view items support:
- Custom icons (VS Code codicons)
- Contextual menus (copy, edit, delete)
- Category-level operations
- Project script integration (auto-detected from package.json)

## Critical Files
- `src/index.ts`: Extension activation and command registration
- `src/core/manager.ts`: Central command orchestration
- `src/data/database.ts`: Persistent storage with events
- `config/default-commands.json`: Predefined command templates
- `package.json`: Extension manifest with contributes section defining UI structure
