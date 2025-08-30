import type { DetectorConfig } from '@src/types'

import { logger } from '@src/utils'
import * as vscode from 'vscode'

import { GoDetector, NodeJSDetector, PythonDetector, RustDetector } from './detectors'
import { ProjectDetectorFactory } from './factory'

// 向后兼容的类型定义
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
 * 基于工厂模式的项目类型检测器
 */
export class ProjectDetector {
  private static _instance: ProjectDetector
  private _lastDetection: DetectionResult | null = null
  private _workspaceRoot: string = ''
  private _factory: ProjectDetectorFactory

  private constructor() {
    this._factory = ProjectDetectorFactory.getInstance()
    this.initializeDetectors()
  }

  public static getInstance(): ProjectDetector {
    if (!ProjectDetector._instance) {
      ProjectDetector._instance = new ProjectDetector()
    }
    return ProjectDetector._instance
  }

  /**
   * 初始化所有检测器
   */
  private initializeDetectors(): void {
    // 注册检测器构造函数（映射项目类型到检测器类）
    this._factory.registerDetector('nodejs', NodeJSDetector)
    this._factory.registerDetector('npm', NodeJSDetector)
    this._factory.registerDetector('yarn', NodeJSDetector)
    this._factory.registerDetector('pnpm', NodeJSDetector)
    this._factory.registerDetector('python', PythonDetector)
    this._factory.registerDetector('rust', RustDetector)
    this._factory.registerDetector('go', GoDetector)

    // 从VS Code配置获取检测器配置
    const config = vscode.workspace.getConfiguration('depCmd')
    const projectDetection = config.get<Record<string, string[]>>('projectDetection', {})

    // 验证配置并创建检测器
    const detectorConfigs: DetectorConfig[] = []

    for (const [type, patterns] of Object.entries(projectDetection)) {
      // 检查是否有对应的检测器构造函数
      if (this._factory.hasDetectorConstructor(type)) {
        detectorConfigs.push({
          type,
          patterns: Array.isArray(patterns) ? patterns : [],
          enabled: true,
          priority: this.getDefaultPriority(type),
        })
      }
      else {
        logger.warn(`No detector implementation found for project type: ${type}`)
      }
    }

    // 创建检测器实例
    const createdCount = this._factory.createDetectorsFromConfigs(detectorConfigs)

    logger.info(`Initialized ${createdCount} project detectors from configuration`)
    logger.info(`Available project types: ${detectorConfigs.map(c => c.type).join(', ')}`)
  }

  /**
   * 获取默认优先级
   */
  private getDefaultPriority(type: string): number {
    const priorityMap: Record<string, number> = {
      nodejs: 10,
      npm: 10,
      yarn: 10,
      pnpm: 10,
      python: 20,
      rust: 20,
      go: 20,
    }
    return priorityMap[type] || 50
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
    const detectors = this._factory.getDetectorsByPriority()
    const detectedCategories: string[] = []
    let projectScripts: PackageJsonScript[] = []
    let packageManager: PackageManager = 'npm'

    // 使用工厂创建的检测器进行检测
    for (const detector of detectors) {
      try {
        const result = await detector.detect(workspaceRoot)

        if (result.detected) {
          detectedCategories.push(result.type)
          logger.info(`Detected ${result.type} project based on: ${result.detectedBy?.join(', ')}`)

          // 处理 Node.js 项目的特殊逻辑
          if (result.type === 'nodejs' || ['npm', 'yarn', 'pnpm'].includes(result.type)) {
            if (result.scripts && result.scripts.length > 0) {
              projectScripts = result.scripts
            }
            if (result.metadata?.packageManager) {
              packageManager = result.metadata.packageManager as PackageManager
            }
          }
        }
      }
      catch (error) {
        logger.error(`Error detecting ${detector.type} project:`, error)
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

  /**
   * 重新初始化检测器（用于配置更改后）
   */
  public reinitialize(): void {
    this._factory.clearDetectors()
    this.initializeDetectors()
    this.clearCache()
    logger.info('Project detector reinitialized')
  }

  /**
   * 获取工厂实例（用于扩展）
   */
  public getFactory(): ProjectDetectorFactory {
    return this._factory
  }

  /**
   * 添加自定义检测器
   */
  public addCustomDetector(config: DetectorConfig, constructor: new (...args: any[]) => any): void {
    this._factory.registerDetector(config.type, constructor)
    this._factory.createDetector(config)
    logger.info(`Added custom detector: ${config.type}`)
  }
}
