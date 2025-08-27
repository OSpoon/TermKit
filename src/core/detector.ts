import * as fs from 'node:fs'
import * as path from 'node:path'

import { logger } from '@src/utils'
import * as vscode from 'vscode'

export interface PackageJsonScript {
  name: string
  command: string
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn'

export interface DetectionResult {
  detectedCategories: string[]
  workspaceRoot: string
  projectScripts?: PackageJsonScript[]
  packageManager?: PackageManager
}

/**
 * 项目检测器
 * 基于用户配置的文件/目录映射来检测项目类型
 */
export class ProjectDetector {
  private static _instance: ProjectDetector
  private _lastDetection: DetectionResult | null = null
  private _workspaceRoot: string = ''

  private constructor() {}

  public static getInstance(): ProjectDetector {
    if (!ProjectDetector._instance) {
      ProjectDetector._instance = new ProjectDetector()
    }
    return ProjectDetector._instance
  }

  /**
   * 检测项目类型
   */
  public async detectProject(forceRefresh: boolean = false): Promise<DetectionResult> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return this.createEmptyResult()
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath

    // 如果工作区没有改变且不是强制刷新，返回缓存结果
    if (!forceRefresh && this._lastDetection && this._workspaceRoot === workspaceRoot) {
      return this._lastDetection
    }

    this._workspaceRoot = workspaceRoot

    const result = await this.performDetection(workspaceRoot)
    this._lastDetection = result

    return result
  }

  /**
   * 执行检测
   */
  private async performDetection(workspaceRoot: string): Promise<DetectionResult> {
    const config = vscode.workspace.getConfiguration('depCmd')
    const projectDetection = config.get<Record<string, string[]>>('projectDetection', {})

    const detectedCategories: string[] = []
    let projectScripts: PackageJsonScript[] = []
    let packageManager: PackageManager = 'npm' // 默认使用 npm

    // 遍历每个配置的项目类型
    for (const [category, paths] of Object.entries(projectDetection)) {
      const isDetected = await this.checkPaths(workspaceRoot, paths)
      if (isDetected) {
        detectedCategories.push(category)
        logger.info(`Detected ${category} project based on paths: ${paths.join(', ')}`)
      }
    }

    // 检测包管理器类型
    packageManager = await this.detectPackageManager(workspaceRoot)
    logger.info(`Detected package manager: ${packageManager}`)

    // 检测并解析 package.json scripts
    const packageJsonPath = path.join(workspaceRoot, 'package.json')
    try {
      const packageJsonStats = await fs.promises.stat(packageJsonPath)
      if (packageJsonStats.isFile()) {
        projectScripts = await this.extractPackageJsonScripts(packageJsonPath, packageManager)
        if (projectScripts.length > 0) {
          logger.info(`Found ${projectScripts.length} scripts in package.json`)
        }
      }
    }
    catch {
      // package.json 不存在或无法读取，跳过
    }

    // Git 特殊处理 - 几乎所有项目都会有 git
    if (detectedCategories.length > 0 && !detectedCategories.includes('git')) {
      const hasGit = await this.checkPaths(workspaceRoot, ['.git/'])
      if (hasGit) {
        detectedCategories.push('git')
      }
    }

    logger.info(`Project detection completed. Detected categories: ${detectedCategories.join(', ')}`)

    return {
      detectedCategories,
      workspaceRoot,
      projectScripts,
      packageManager,
    }
  }

  /**
   * 检测包管理器类型
   */
  private async detectPackageManager(workspaceRoot: string): Promise<PackageManager> {
    try {
      // 按优先级检测包管理器
      const pnpmLockPath = path.join(workspaceRoot, 'pnpm-lock.yaml')
      const yarnLockPath = path.join(workspaceRoot, 'yarn.lock')
      const npmLockPath = path.join(workspaceRoot, 'package-lock.json')

      // 检查 pnpm
      try {
        const pnpmStats = await fs.promises.stat(pnpmLockPath)
        if (pnpmStats.isFile()) {
          return 'pnpm'
        }
      }
      catch {
        // pnpm-lock.yaml 不存在，继续检查其他
      }

      // 检查 yarn
      try {
        const yarnStats = await fs.promises.stat(yarnLockPath)
        if (yarnStats.isFile()) {
          return 'yarn'
        }
      }
      catch {
        // yarn.lock 不存在，继续检查其他
      }

      // 检查 npm
      try {
        const npmStats = await fs.promises.stat(npmLockPath)
        if (npmStats.isFile()) {
          return 'npm'
        }
      }
      catch {
        // package-lock.json 不存在
      }

      // 默认返回 npm
      return 'npm'
    }
    catch (error) {
      logger.error(`Failed to detect package manager:`, error)
      return 'npm'
    }
  }

  /**
   * 检查路径是否存在
   */
  private async checkPaths(workspaceRoot: string, paths: string[]): Promise<boolean> {
    for (const targetPath of paths) {
      const fullPath = path.join(workspaceRoot, targetPath)

      try {
        const stats = await fs.promises.stat(fullPath)

        // 如果路径以 / 结尾，检查是否为目录
        if (targetPath.endsWith('/')) {
          if (stats.isDirectory()) {
            return true
          }
        }
        else {
          // 否则检查是否为文件
          if (stats.isFile()) {
            return true
          }
        }
      }
      catch {
        // 文件/目录不存在，继续检查下一个
        continue
      }
    }

    return false
  }

  /**
   * 创建空结果
   */
  private createEmptyResult(): DetectionResult {
    return {
      detectedCategories: [],
      workspaceRoot: '',
      projectScripts: [],
      packageManager: 'npm',
    }
  }

  /**
   * 提取 package.json 中的 scripts
   */
  private async extractPackageJsonScripts(packageJsonPath: string, packageManager: PackageManager): Promise<PackageJsonScript[]> {
    try {
      const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      if (!packageJson.scripts || typeof packageJson.scripts !== 'object') {
        return []
      }

      const scripts: PackageJsonScript[] = []
      for (const [name, command] of Object.entries(packageJson.scripts)) {
        if (typeof command === 'string') {
          // 根据包管理器生成正确的执行命令
          const runCommand = `${packageManager} run ${name}`
          scripts.push({
            name,
            command: runCommand,
          })
        }
      }

      return scripts
    }
    catch (error) {
      logger.error(`Failed to parse package.json at ${packageJsonPath}:`, error)
      return []
    }
  }

  /**
   * 获取检测到的分类
   */
  public getDetectedCategories(): string[] {
    return this._lastDetection?.detectedCategories || []
  }

  /**
   * 获取项目脚本
   */
  public getProjectScripts(): PackageJsonScript[] {
    return this._lastDetection?.projectScripts || []
  }

  /**
   * 检查特定分类是否被检测到
   */
  public isCategoryDetected(category: string): boolean {
    return this.getDetectedCategories().includes(category)
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this._lastDetection = null
    this._workspaceRoot = ''
  }
}
