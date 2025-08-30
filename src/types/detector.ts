/**
 * 项目检测器接口和相关类型定义
 */

export interface PackageJsonScript {
  name: string
  command: string
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn'

/**
 * 单个项目类型的检测结果
 */
export interface ProjectTypeDetectionResult {
  /** 项目类型名称 */
  type: string
  /** 是否检测到该项目类型 */
  detected: boolean
  /** 检测依据的文件或路径 */
  detectedBy?: string[]
  /** 项目特定的脚本 */
  scripts?: PackageJsonScript[]
  /** 包管理器类型（适用于前端项目） */
  packageManager?: PackageManager
  /** 额外的元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 完整的项目检测结果
 */
export interface DetectionResult {
  /** 检测到的项目类型列表 */
  detectedCategories: string[]
  /** 工作区根目录 */
  workspaceRoot: string
  /** 项目脚本（向后兼容） */
  projectScripts?: PackageJsonScript[]
  /** 包管理器（向后兼容） */
  packageManager?: PackageManager
  /** 详细的检测结果 */
  detectionDetails: ProjectTypeDetectionResult[]
}

/**
 * 项目检测器接口
 */
export interface IProjectDetector {
  /** 检测器类型标识 */
  readonly type: string

  /** 检测器优先级（数值越小优先级越高） */
  readonly priority: number

  /**
   * 检测项目类型
   * @param workspaceRoot 工作区根目录
   * @returns 检测结果
   */
  detect: (workspaceRoot: string) => Promise<ProjectTypeDetectionResult>

  /**
   * 获取检测器支持的文件模式
   * @returns 文件模式数组
   */
  getSupportedPatterns: () => string[]

  /**
   * 检查是否能够处理指定的项目类型
   * @param projectType 项目类型
   * @returns 是否支持
   */
  canHandle: (projectType: string) => boolean
}

/**
 * 项目检测器工厂配置
 */
export interface DetectorConfig {
  /** 项目类型 */
  type: string
  /** 检测模式（文件或目录路径） */
  patterns: string[]
  /** 优先级 */
  priority?: number
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 基础项目检测器抽象类
 */
export abstract class BaseProjectDetector implements IProjectDetector {
  public readonly type: string
  public readonly priority: number
  protected patterns: string[]

  constructor(type: string, patterns: string[], priority: number = 100) {
    this.type = type
    this.patterns = patterns
    this.priority = priority
  }

  abstract detect(workspaceRoot: string): Promise<ProjectTypeDetectionResult>

  public getSupportedPatterns(): string[] {
    return [...this.patterns]
  }

  public canHandle(projectType: string): boolean {
    return this.type === projectType
  }

  /**
   * 检查文件或目录是否存在
   * @param workspaceRoot 工作区根目录
   * @param patterns 要检查的模式
   * @returns 检测结果和匹配的模式
   */
  protected async checkPatterns(
    workspaceRoot: string,
    patterns: string[],
  ): Promise<{ detected: boolean, matchedPatterns: string[] }> {
    const fs = await import('node:fs')
    const path = await import('node:path')

    const matchedPatterns: string[] = []

    for (const pattern of patterns) {
      const fullPath = path.join(workspaceRoot, pattern)

      try {
        const stats = await fs.promises.stat(fullPath)

        // 如果路径以 / 结尾，检查是否为目录
        if (pattern.endsWith('/')) {
          if (stats.isDirectory()) {
            matchedPatterns.push(pattern)
          }
        }
        else {
          // 否则检查是否为文件
          if (stats.isFile()) {
            matchedPatterns.push(pattern)
          }
        }
      }
      catch {
        // 文件/目录不存在，继续检查下一个
        continue
      }
    }

    return {
      detected: matchedPatterns.length > 0,
      matchedPatterns,
    }
  }

  /**
   * 创建基础检测结果
   * @param detected 是否检测到
   * @param matchedPatterns 匹配的模式
   * @param scripts 脚本列表
   * @param metadata 额外元数据
   * @returns 检测结果
   */
  protected createResult(
    detected: boolean,
    matchedPatterns: string[] = [],
    scripts: PackageJsonScript[] = [],
    metadata: Record<string, unknown> = {},
  ): ProjectTypeDetectionResult {
    return {
      type: this.type,
      detected,
      detectedBy: matchedPatterns,
      scripts,
      metadata,
    }
  }
}
