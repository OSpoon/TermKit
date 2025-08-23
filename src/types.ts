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
 * 项目检测结果
 */
export interface ProjectDetectionResult {
  types: ProjectType[]
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  pythonManager?: 'pip' | 'conda' | 'poetry'
  hasGit: boolean
  hasDocker: boolean
  workspaceRoot: string
}

/**
 * 用户命令接口（从 database.ts 重新导出）
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
