/**
 * 项目类型枚举
 */
export enum ProjectType {
  NODE = 'node',
  PYTHON = 'python',
  RUST = 'rust',
  GO = 'go',
  JAVA = 'java',
  DOCKER = 'docker',
  GIT = 'git',
  UNKNOWN = 'unknown',
}

// ========== 基础检测相关接口 ==========

/**
 * 基础项目检测结果
 */
export interface BaseProjectDetectionResult {
  types: ProjectType[]
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  pythonManager?: 'pip' | 'conda' | 'poetry'
  hasGit: boolean
  hasDocker: boolean
  workspaceRoot: string
}

/**
 * 检测结果
 */
export interface DetectionResult {
  matched: boolean
  score: number
  details?: any
}

/**
 * 项目检测结果
 */
export interface ProjectDetectionResult extends BaseProjectDetectionResult {
  detectedProjectTypes: Array<{
    id: string
    displayName: string
    score: number
    confidence: number
  }>
  detectedPackageManagers: Array<{
    id: string
    displayName: string
    projectType: string
    score: number
  }>
  detectionDetails?: Array<{
    projectType: string
    rules: Array<{
      name: string
      matched: boolean
      score: number
      details?: any
    }>
  }>
}

// ========== 配置相关接口 ==========

/**
 * 检测规则
 */
export interface DetectionRule {
  name: string
  type: 'file_exists' | 'directory_exists' | 'file_content' | 'custom'
  target: string
  weight?: number
  required?: boolean
  config?: {
    pattern?: string | RegExp
    excludeIfExists?: string[]
    customFunction?: string // 函数名引用
  }
}

/**
 * 包管理器定义
 */
export interface PackageManagerDefinition {
  id: string
  displayName: string
  detectionRules: DetectionRule[]
  commands?: string[]
}

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

// ========== 数据库相关接口 ==========

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
