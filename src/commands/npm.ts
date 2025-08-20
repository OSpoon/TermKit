import type { CommandItem } from './types'

// NPM/Yarn Commands - Node.js package management
export const NPM_COMMANDS: CommandItem[] = [
  // NPM Basic Commands
  {
    label: 'Install Dependencies',
    command: 'npm install',
    description: 'Install all dependencies from package.json',
    category: 'npm',
  },
  {
    label: 'Install Package',
    command: 'npm install package_name',
    description: 'Install a specific package',
    category: 'npm',
  },
  {
    label: 'Install Package (Dev)',
    command: 'npm install --save-dev package_name',
    description: 'Install package as dev dependency',
    category: 'npm',
  },
  {
    label: 'Install Package (Global)',
    command: 'npm install -g package_name',
    description: 'Install package globally',
    category: 'npm',
  },
  {
    label: 'Uninstall Package',
    command: 'npm uninstall package_name',
    description: 'Uninstall a package',
    category: 'npm',
  },
  {
    label: 'Update Package',
    command: 'npm update package_name',
    description: 'Update a specific package',
    category: 'npm',
  },
  {
    label: 'Update All Packages',
    command: 'npm update',
    description: 'Update all packages',
    category: 'npm',
  },
  {
    label: 'List Packages',
    command: 'npm list',
    description: 'List installed packages',
    category: 'npm',
  },
  {
    label: 'List Global Packages',
    command: 'npm list -g --depth=0',
    description: 'List globally installed packages',
    category: 'npm',
  },
  {
    label: 'Run Script',
    command: 'npm run script_name',
    description: 'Run a script from package.json',
    category: 'npm',
  },
  {
    label: 'Start Project',
    command: 'npm start',
    description: 'Run the start script',
    category: 'npm',
  },
  {
    label: 'Build Project',
    command: 'npm run build',
    description: 'Run the build script',
    category: 'npm',
  },
  {
    label: 'Test Project',
    command: 'npm test',
    description: 'Run tests',
    category: 'npm',
  },
  {
    label: 'Initialize Project',
    command: 'npm init',
    description: 'Initialize a new npm project',
    category: 'npm',
  },
  {
    label: 'Initialize Project (Yes)',
    command: 'npm init -y',
    description: 'Initialize project with default values',
    category: 'npm',
  },
  {
    label: 'Check Outdated',
    command: 'npm outdated',
    description: 'Check for outdated packages',
    category: 'npm',
  },
  {
    label: 'Audit Security',
    command: 'npm audit',
    description: 'Run security audit',
    category: 'npm',
  },
  {
    label: 'Fix Security Issues',
    command: 'npm audit fix',
    description: 'Automatically fix security issues',
    category: 'npm',
  },
  {
    label: 'Clean Cache',
    command: 'npm cache clean --force',
    description: 'Clean npm cache',
    category: 'npm',
  },
  {
    label: 'NPM Version',
    command: 'npm --version',
    description: 'Show npm version',
    category: 'npm',
  },
]

// Yarn Commands
export const YARN_COMMANDS: CommandItem[] = [
  {
    label: 'Yarn Install',
    command: 'yarn install',
    description: 'Install all dependencies',
    category: 'yarn',
  },
  {
    label: 'Yarn Add Package',
    command: 'yarn add package_name',
    description: 'Add a package',
    category: 'yarn',
  },
  {
    label: 'Yarn Add Dev Package',
    command: 'yarn add --dev package_name',
    description: 'Add package as dev dependency',
    category: 'yarn',
  },
  {
    label: 'Yarn Remove Package',
    command: 'yarn remove package_name',
    description: 'Remove a package',
    category: 'yarn',
  },
  {
    label: 'Yarn Upgrade',
    command: 'yarn upgrade',
    description: 'Upgrade all packages',
    category: 'yarn',
  },
  {
    label: 'Yarn Run Script',
    command: 'yarn run script_name',
    description: 'Run a script',
    category: 'yarn',
  },
  {
    label: 'Yarn Start',
    command: 'yarn start',
    description: 'Start the project',
    category: 'yarn',
  },
  {
    label: 'Yarn Build',
    command: 'yarn build',
    description: 'Build the project',
    category: 'yarn',
  },
  {
    label: 'Yarn Test',
    command: 'yarn test',
    description: 'Run tests',
    category: 'yarn',
  },
  {
    label: 'Yarn Init',
    command: 'yarn init',
    description: 'Initialize a new project',
    category: 'yarn',
  },
]

// Combine NPM and Yarn commands
export const NODE_PACKAGE_COMMANDS: CommandItem[] = [
  ...NPM_COMMANDS,
  ...YARN_COMMANDS,
]
