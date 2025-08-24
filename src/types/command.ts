/**
 * 命令定义
 */
export interface CommandDefinition {
  label: string
  command: string
  description?: string
  category: string
  icon?: string
  conditions?: {
    requiresPackageManager?: string
    requiresProjectType?: string[]
    requiresGit?: boolean
    requiresDocker?: boolean
    custom?: string
  }
}

/**
 * 类别配置
 */
export interface CategoryDefinition {
  id: string
  displayName: string
  icon: string
  supportedProjectTypes: string[] | '*'
  conditions?: {
    requiresGit?: boolean
    requiresDocker?: boolean
    requiredPackageManager?: string
    custom?: string
  }
}

/**
 * 用户命令接口
 */
export interface UserCommand {
  id?: number
  label: string
  command: string
  description?: string
  category: string
  icon?: string
  created_at?: string
  updated_at?: string
}

/**
 * 命令数据结构
 */
export interface CommandsData {
  commands: UserCommand[]
}
