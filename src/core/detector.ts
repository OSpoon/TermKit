import * as fs from 'node:fs'
import * as path from 'node:path'

import { logger } from '@src/utils'
import * as vscode from 'vscode'

export interface DetectionResult {
  detectedCategories: string[]
  workspaceRoot: string
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

    // 遍历每个配置的项目类型
    for (const [category, paths] of Object.entries(projectDetection)) {
      const isDetected = await this.checkPaths(workspaceRoot, paths)
      if (isDetected) {
        detectedCategories.push(category)
        logger.info(`Detected ${category} project based on paths: ${paths.join(', ')}`)
      }
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
    }
  }

  /**
   * 获取检测到的分类
   */
  public getDetectedCategories(): string[] {
    return this._lastDetection?.detectedCategories || []
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
