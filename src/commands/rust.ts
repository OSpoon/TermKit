import type { CommandItem } from './types'

// Rust Commands - Rust development tools
export const RUST_COMMANDS: CommandItem[] = [
  {
    label: 'Create New Project',
    command: 'cargo new project_name',
    description: 'Create a new Rust project',
    category: 'rust',
    icon: 'add',
  },
  {
    label: 'Build Project',
    command: 'cargo build',
    description: 'Build the current project',
    category: 'rust',
    icon: 'tools',
  },
  {
    label: 'Run Project',
    command: 'cargo run',
    description: 'Run the current project',
    category: 'rust',
    icon: 'play',
  },
  {
    label: 'Run Tests',
    command: 'cargo test',
    description: 'Run tests',
    category: 'rust',
    icon: 'beaker',
  },
  {
    label: 'Check Code',
    command: 'cargo check',
    description: 'Check code without building',
    category: 'rust',
    icon: 'check',
  },
  {
    label: 'Format Code',
    command: 'cargo fmt',
    description: 'Format Rust code',
    category: 'rust',
    icon: 'symbol-ruler',
  },
  {
    label: 'Lint Code',
    command: 'cargo clippy',
    description: 'Run Clippy linter',
    category: 'rust',
    icon: 'warning',
  },
]
