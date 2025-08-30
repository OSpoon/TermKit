import type { DetectorConfig, IProjectDetector } from '@src/types'

import { logger } from '@src/utils'

/**
 * 项目检测器工厂
 * 负责管理和创建各种项目类型的检测器
 */
export class ProjectDetectorFactory {
  private static _instance: ProjectDetectorFactory
  private _detectors = new Map<string, IProjectDetector>()
  private _detectorConstructors = new Map<string, new (...args: any[]) => IProjectDetector>()

  private constructor() {}

  public static getInstance(): ProjectDetectorFactory {
    if (!ProjectDetectorFactory._instance) {
      ProjectDetectorFactory._instance = new ProjectDetectorFactory()
    }
    return ProjectDetectorFactory._instance
  }

  /**
   * 注册检测器构造函数
   * @param type 项目类型
   * @param constructor 检测器构造函数
   */
  public registerDetector(
    type: string,
    constructor: new (...args: any[]) => IProjectDetector,
  ): void {
    this._detectorConstructors.set(type, constructor)
    logger.info(`Registered detector for project type: ${type}`)
  }

  /**
   * 检查是否有指定类型的检测器构造函数
   * @param type 项目类型
   * @returns 是否存在构造函数
   */
  public hasDetectorConstructor(type: string): boolean {
    return this._detectorConstructors.has(type)
  }

  /**
   * 创建检测器实例
   * @param config 检测器配置
   * @returns 检测器实例
   */
  public createDetector(config: DetectorConfig): IProjectDetector | null {
    const Constructor = this._detectorConstructors.get(config.type)
    if (!Constructor) {
      logger.warn(`No detector constructor found for type: ${config.type}`)
      return null
    }

    try {
      const detector = new Constructor(
        config.type,
        config.patterns,
        config.priority || 100,
      )

      this._detectors.set(config.type, detector)
      logger.info(`Created detector instance for type: ${config.type}`)

      return detector
    }
    catch (error) {
      logger.error(`Failed to create detector for type ${config.type}:`, error)
      return null
    }
  }

  /**
   * 获取检测器实例
   * @param type 项目类型
   * @returns 检测器实例
   */
  public getDetector(type: string): IProjectDetector | undefined {
    return this._detectors.get(type)
  }

  /**
   * 获取所有已注册的检测器
   * @returns 检测器列表
   */
  public getAllDetectors(): IProjectDetector[] {
    return Array.from(this._detectors.values())
  }

  /**
   * 根据优先级排序获取检测器
   * @returns 按优先级排序的检测器列表
   */
  public getDetectorsByPriority(): IProjectDetector[] {
    return this.getAllDetectors().sort((a, b) => a.priority - b.priority)
  }

  /**
   * 移除检测器
   * @param type 项目类型
   */
  public removeDetector(type: string): void {
    this._detectors.delete(type)
    logger.info(`Removed detector for type: ${type}`)
  }

  /**
   * 清除所有检测器
   */
  public clearDetectors(): void {
    this._detectors.clear()
    logger.info('Cleared all detectors')
  }

  /**
   * 检查是否支持指定的项目类型
   * @param type 项目类型
   * @returns 是否支持
   */
  public supportsType(type: string): boolean {
    return this._detectors.has(type)
  }

  /**
   * 从配置批量创建检测器
   * @param configs 检测器配置列表
   * @returns 成功创建的检测器数量
   */
  public createDetectorsFromConfigs(configs: DetectorConfig[]): number {
    let successCount = 0

    for (const config of configs) {
      if (config.enabled !== false) {
        const detector = this.createDetector(config)
        if (detector) {
          successCount++
        }
      }
    }

    logger.info(`Created ${successCount} detectors from ${configs.length} configs`)
    return successCount
  }

  /**
   * 获取支持的项目类型列表
   * @returns 项目类型列表
   */
  public getSupportedTypes(): string[] {
    return Array.from(this._detectors.keys())
  }

  /**
   * 获取检测器统计信息
   * @returns 统计信息
   */
  public getStats(): {
    totalDetectors: number
    registeredTypes: string[]
    constructorCount: number
  } {
    return {
      totalDetectors: this._detectors.size,
      registeredTypes: Array.from(this._detectors.keys()),
      constructorCount: this._detectorConstructors.size,
    }
  }
}
