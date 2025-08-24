import type { CategoryDefinition, CommandDefinition } from './command'
import type { DetectionRule, PackageManagerDefinition } from './detection'

/**
 * 通用项目类型配置
 */
export interface ProjectTypeDefinition {
  id: string
  displayName: string
  aliases?: string[]
  priority?: number
  detectionRules: DetectionRule[]
  packageManagers?: PackageManagerDefinition[]
  defaultCommands?: CommandDefinition[]
}

/**
 * 完整的配置模式
 */
export interface ConfigSchema {
  version: string
  projectTypes: ProjectTypeDefinition[]
  categories: CategoryDefinition[]
  commands: CommandDefinition[]
  customFunctions?: Record<string, string>
  extensionPoints?: {
    beforeDetection?: string[]
    afterDetection?: string[]
    customConditions?: string[]
  }
}
