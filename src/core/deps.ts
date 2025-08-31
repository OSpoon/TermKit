import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { logger } from '@src/utils'
import * as vscode from 'vscode'

const execAsync = promisify(exec)

export interface DependencyConfig {
  command: string
  enabled: boolean
  description: string
}

export interface DependencyDetectionResult {
  [category: string]: boolean
}

/**
 * 依赖检测器
 * 检测系统中是否安装了指定的工具
 */
export class DependencyDetector {
  private static _instance: DependencyDetector
  private _cache: Map<string, boolean> = new Map()
  private _cacheTimeout = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {}

  public static getInstance(): DependencyDetector {
    if (!DependencyDetector._instance) {
      DependencyDetector._instance = new DependencyDetector()
    }
    return DependencyDetector._instance
  }

  /**
   * 清除检测缓存
   */
  public clearCache(): void {
    this._cache.clear()
    logger.info('Dependency detection cache cleared')
  }

  /**
   * 检测单个依赖是否安装
   */
  public async detectDependency(category: string, config: DependencyConfig): Promise<boolean> {
    if (!config.enabled) {
      return false
    }

    // 检查缓存
    const cacheKey = `${category}-${config.command}`
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)!
    }

    try {
      logger.info(`Detecting dependency: ${category} with command: ${config.command}`)

      // 执行检测命令，设置超时时间
      await execAsync(config.command, {
        timeout: 3000, // 3秒超时
        windowsHide: true, // Windows 下隐藏命令窗口
      })

      logger.info(`Dependency detected successfully: ${category}`)
      this._cache.set(cacheKey, true)

      // 设置缓存过期
      setTimeout(() => {
        this._cache.delete(cacheKey)
      }, this._cacheTimeout)

      return true
    }
    catch (error) {
      logger.info(`Dependency not found: ${category} (${error instanceof Error ? error.message : 'Unknown error'})`)
      this._cache.set(cacheKey, false)

      // 失败的检测结果缓存时间较短
      setTimeout(() => {
        this._cache.delete(cacheKey)
      }, 30000) // 30秒

      return false
    }
  }

  /**
   * 批量检测所有配置的依赖
   */
  public async detectAllDependencies(): Promise<DependencyDetectionResult> {
    const config = vscode.workspace.getConfiguration('depCmd')
    const dependencyConfig = config.get<Record<string, DependencyConfig>>('dependencyDetection', {})

    const results: DependencyDetectionResult = {}
    const detectionPromises: Promise<void>[] = []

    for (const [category, depConfig] of Object.entries(dependencyConfig)) {
      detectionPromises.push(
        this.detectDependency(category, depConfig).then((isInstalled) => {
          results[category] = isInstalled
        }).catch((error) => {
          logger.error(`Error detecting dependency ${category}:`, error)
          results[category] = false
        }),
      )
    }

    // 并行执行所有检测，但限制总时间
    try {
      await Promise.race([
        Promise.all(detectionPromises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Dependency detection timeout')), 10000),
        ),
      ])
    }
    catch (error) {
      logger.warn('Some dependency detections timed out or failed:', error)
    }

    logger.info('Dependency detection completed:', results)
    return results
  }

  /**
   * 检查特定分类的依赖是否已安装
   */
  public async isDependencyInstalled(category: string): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('depCmd')
    const dependencyConfig = config.get<Record<string, DependencyConfig>>('dependencyDetection', {})

    const depConfig = dependencyConfig[category]
    if (!depConfig) {
      // 如果没有配置依赖检测，则认为该分类总是可用
      return true
    }

    return this.detectDependency(category, depConfig)
  }

  /**
   * 获取所有已安装的依赖分类
   */
  public async getInstalledDependencies(): Promise<string[]> {
    const results = await this.detectAllDependencies()
    return Object.entries(results)
      .filter(([_, isInstalled]) => isInstalled)
      .map(([category, _]) => category)
  }

  /**
   * 获取检测统计信息
   */
  public async getDetectionStats(): Promise<{
    total: number
    installed: number
    categories: string[]
  }> {
    const config = vscode.workspace.getConfiguration('depCmd')
    const dependencyConfig = config.get<Record<string, DependencyConfig>>('dependencyDetection', {})

    const enabledCategories = Object.entries(dependencyConfig)
      .filter(([_, config]) => config.enabled)
      .map(([category, _]) => category)

    const installedCategories = await this.getInstalledDependencies()

    return {
      total: enabledCategories.length,
      installed: installedCategories.length,
      categories: installedCategories,
    }
  }
}
