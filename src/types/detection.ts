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
