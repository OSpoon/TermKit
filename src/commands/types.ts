// Shared type definitions for command items
export interface CommandItem {
  label: string
  command: string
  description?: string
  category: string // Make this flexible
  icon?: string // VS Code ThemeIcon name for individual commands
}

// Category configuration with icon and display information
export interface CategoryConfig {
  name: string
  displayName: string
  icon: string // VS Code ThemeIcon name
}

// Convert CommandItem to UserCommand format for the command manager
export function toUserCommand(item: CommandItem) {
  return {
    label: item.label,
    command: item.command,
    description: item.description,
    category: item.category,
    icon: item.icon,
  }
}

// Default category configurations
export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { name: 'conda', displayName: 'Conda', icon: 'package' },
  { name: 'docker', displayName: 'Docker', icon: 'symbol-namespace' },
  { name: 'npm', displayName: 'NPM', icon: 'symbol-module' },
  { name: 'yarn', displayName: 'Yarn', icon: 'symbol-module' },
  { name: 'pip', displayName: 'Pip', icon: 'snake' },
  { name: 'git', displayName: 'Git', icon: 'git-branch' },
  { name: 'rust', displayName: 'Rust', icon: 'symbol-structure' },
  { name: 'custom', displayName: 'Custom', icon: 'tools' },
]

// Get category config by name, with fallback to default
export function getCategoryConfig(categoryName: string): CategoryConfig {
  const config = CATEGORY_CONFIGS.find(c => c.name === categoryName)
  if (config) {
    return config
  }

  // Return default config for unknown categories
  return {
    name: categoryName,
    displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
    icon: 'gear',
  }
}
