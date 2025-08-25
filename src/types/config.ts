import type { CategoryDefinition, CommandDefinition } from './command'

/**
 * 简化的项目类型配置
 */
export interface ProjectTypeDefinition {
  id: string
  displayName: string
  aliases?: string[]
}

/**
 * 简化的配置模式
 */
export interface ConfigSchema {
  version: string
  projectTypes: ProjectTypeDefinition[]
  categories: CategoryDefinition[]
  commands: CommandDefinition[]
}
