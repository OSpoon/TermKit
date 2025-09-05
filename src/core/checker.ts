import { spawn } from 'node:child_process'

import { logger } from '@src/utils'
import * as vscode from 'vscode'

export interface DependencyDetectionConfig {
  enabled: boolean
  command: string
  args?: string[]
  timeout?: number
}

export class DependencyChecker {
  private static _instance: DependencyChecker
  private _cache = new Map<string, { result: boolean, timestamp: number }>()
  private readonly CACHE_DURATION = 30000 // 30 seconds cache

  public static getInstance(): DependencyChecker {
    if (!DependencyChecker._instance) {
      DependencyChecker._instance = new DependencyChecker()
    }
    return DependencyChecker._instance
  }

  /**
   * 检查分类的依赖是否可用
   */
  public async checkCategoryDependency(category: string): Promise<boolean> {
    try {
      const config = vscode.workspace.getConfiguration('quickCmd')
      const dependencyDetection = config.get<Record<string, DependencyDetectionConfig>>('dependencyDetection', {})

      const detection = dependencyDetection[category]

      // 如果没有配置检测，跳过检测（默认显示）
      if (!detection) {
        return true
      }

      // 如果检测被禁用，显示分类
      if (!detection.enabled) {
        return true
      }

      // 检查缓存
      const cacheKey = `${category}_${detection.command}_${detection.args?.join('_') || ''}`
      const cached = this._cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.result
      }

      // 执行检测命令
      const result = await this.executeDetectionCommand(detection)

      // 缓存结果
      this._cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      })

      return result
    }
    catch (error) {
      logger.warn(`Failed to check dependency for category ${category}:`, error)
      return false // 出错时不显示已配置检测的分类
    }
  }

  /**
   * 批量检查多个分类的依赖
   */
  public async checkMultipleDependencies(categories: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    // 并发检查所有分类
    const promises = categories.map(async (category) => {
      const available = await this.checkCategoryDependency(category)
      results[category] = available
      return { category, available }
    })

    await Promise.all(promises)
    return results
  }

  /**
   * 执行检测命令
   */
  private async executeDetectionCommand(detection: DependencyDetectionConfig): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // 解析命令和参数
        const [command, ...defaultArgs] = detection.command.split(' ')
        const args = detection.args || defaultArgs

        const child = spawn(command, args, {
          stdio: 'pipe',
          shell: true,
          timeout: detection.timeout || 5000,
        })

        let hasResponded = false

        // 设置超时
        const timeoutId = setTimeout(() => {
          if (!hasResponded) {
            hasResponded = true
            child.kill()
            resolve(false)
          }
        }, detection.timeout || 5000)

        child.on('close', (code) => {
          if (!hasResponded) {
            hasResponded = true
            clearTimeout(timeoutId)
            // 退出代码为 0 表示成功
            resolve(code === 0)
          }
        })

        child.on('error', () => {
          if (!hasResponded) {
            hasResponded = true
            clearTimeout(timeoutId)
            resolve(false)
          }
        })
      }
      catch (error) {
        logger.warn('Error executing detection command:', error)
        resolve(false)
      }
    })
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this._cache.clear()
  }

  /**
   * 清除特定分类的缓存
   */
  public clearCategoryCache(category: string): void {
    const keysToDelete = Array.from(this._cache.keys()).filter(key => key.startsWith(`${category}_`))
    keysToDelete.forEach(key => this._cache.delete(key))
  }
}
