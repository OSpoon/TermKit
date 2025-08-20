import type { UserCommand } from '../commandManager'
import type { CommandItem } from './types'
import { CONDA_COMMANDS } from './conda'
import { DOCKER_COMMANDS } from './docker'
import { GIT_COMMANDS } from './git'
import { NPM_COMMANDS, YARN_COMMANDS } from './npm'
import { PIP_COMMANDS } from './pip'
import { RUST_COMMANDS } from './rust'
import { toUserCommand } from './types'

// Combine all commands
export const ALL_COMMANDS: CommandItem[] = [
  ...CONDA_COMMANDS,
  ...DOCKER_COMMANDS,
  ...NPM_COMMANDS,
  ...YARN_COMMANDS,
  ...PIP_COMMANDS,
  ...GIT_COMMANDS,
  ...RUST_COMMANDS,
]

// Convert to UserCommand format for compatibility
export function getDefaultCommands(): UserCommand[] {
  return ALL_COMMANDS.map(toUserCommand)
}

// Export types and functions
export type { CommandItem } from './types'
export { getCategoryConfig } from './types'
