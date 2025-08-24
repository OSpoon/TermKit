import type { ConfigManager } from '@src/core/configuration'
import type {
  CategoryDefinition,
  CommandDefinition,
  ProjectDetectionResult,
  UserCommand,
} from '@src/types'

/**
 * 通用命令过滤器
 */
export class CommandFilter {
  private static _instance: CommandFilter
  private _configManager: ConfigManager

  private constructor(configManager: ConfigManager) {
    this._configManager = configManager
  }

  public static getInstance(configManager: ConfigManager): CommandFilter {
    if (!CommandFilter._instance) {
      CommandFilter._instance = new CommandFilter(configManager)
    }
    return CommandFilter._instance
  }

  /**
   * 根据项目检测结果过滤命令
   */
  public filterCommands(commands: UserCommand[], projectResult: ProjectDetectionResult): UserCommand[] {
    return commands.filter(command => this.isCommandSupported(command, projectResult))
  }

  /**
   * 根据项目检测结果过滤类别
   */
  public filterCategories(categories: string[], projectResult: ProjectDetectionResult): string[] {
    console.warn(`Filter input - Categories: ${categories.join(', ')}, Project types: ${projectResult.detectedProjectTypes.map(pt => pt.displayName).join(', ')}`)
    const filtered = categories.filter((category) => {
      const isSupported = this.isCategorySupported(category, projectResult)
      console.warn(`Category ${category}: ${isSupported ? 'supported' : 'not supported'}`)
      return isSupported
    })
    console.warn(`Filter result: ${filtered.join(', ')}`)
    return filtered
  }

  /**
   * 检查命令是否支持当前项目
   */
  private isCommandSupported(command: UserCommand, projectResult: ProjectDetectionResult): boolean {
    const category = this._configManager.getCategory(command.category)
    if (!category) {
      // 如果没有找到类别定义，默认支持
      return true
    }

    return this.isCategorySupported(command.category, projectResult)
  }

  /**
   * 检查类别是否支持当前项目
   */
  private isCategorySupported(categoryId: string, projectResult: ProjectDetectionResult): boolean {
    const category = this._configManager.getCategory(categoryId)
    if (!category) {
      // 如果没有找到类别定义，默认支持
      return true
    }

    // 检查项目类型支持
    if (!this.checkProjectTypeSupport(category, projectResult)) {
      return false
    }

    // 检查条件
    if (category.conditions) {
      return this.checkCategoryConditions(category.conditions, projectResult)
    }

    return true
  }

  /**
   * 检查项目类型支持
   */
  private checkProjectTypeSupport(category: CategoryDefinition, projectResult: ProjectDetectionResult): boolean {
    // 如果支持所有项目类型
    if (category.supportedProjectTypes === '*') {
      return true
    }

    // 检查是否有交集
    const supportedTypes = Array.isArray(category.supportedProjectTypes)
      ? category.supportedProjectTypes
      : [category.supportedProjectTypes]

    return projectResult.types.some(type =>
      supportedTypes.includes(type)
      || supportedTypes.some((supportedType) => {
        const projectType = this._configManager.getProjectType(supportedType)
        return projectType?.aliases?.includes(type)
      }),
    )
  }

  /**
   * 检查类别条件
   */
  private checkCategoryConditions(
    conditions: CategoryDefinition['conditions'],
    projectResult: ProjectDetectionResult,
  ): boolean {
    if (!conditions)
      return true

    // 检查Git要求
    if (conditions.requiresGit && !projectResult.hasGit) {
      return false
    }

    // 检查Docker要求
    if (conditions.requiresDocker && !projectResult.hasDocker) {
      return false
    }

    // 检查包管理器要求
    if (conditions.requiredPackageManager) {
      const hasRequiredPM = projectResult.packageManager === conditions.requiredPackageManager
        || projectResult.pythonManager === conditions.requiredPackageManager
        || projectResult.detectedPackageManagers.some(pm => pm.id === conditions.requiredPackageManager)

      if (!hasRequiredPM) {
        return false
      }
    }

    // 检查自定义条件
    if (conditions.custom) {
      return this.checkCustomCondition(conditions.custom, projectResult)
    }

    return true
  }

  /**
   * 检查自定义条件
   */
  private checkCustomCondition(
    customCondition: string,
    projectResult: ProjectDetectionResult,
  ): boolean {
    try {
      // 这里可以实现自定义条件逻辑
      // 例如：解析表达式、调用自定义函数等

      // 简单的实现：检查项目类型包含特定字符串
      if (customCondition.startsWith('hasProjectType:')) {
        const requiredType = customCondition.replace('hasProjectType:', '')
        return projectResult.types.includes(requiredType as any)
      }

      // 检查包管理器
      if (customCondition.startsWith('hasPackageManager:')) {
        const requiredPM = customCondition.replace('hasPackageManager:', '')
        return projectResult.detectedPackageManagers.some(pm => pm.id === requiredPM)
      }

      // 检查最低置信度
      if (customCondition.startsWith('minConfidence:')) {
        const minConfidence = Number.parseInt(customCondition.replace('minConfidence:', ''), 10)
        return projectResult.detectedProjectTypes.some(pt => pt.confidence >= minConfidence)
      }

      console.warn(`Unknown custom condition: ${customCondition}`)
      return true
    }
    catch (error) {
      console.warn(`Error evaluating custom condition ${customCondition}:`, error)
      return true
    }
  }

  /**
   * 获取建议的命令类别
   */
  public getSuggestedCategories(projectResult: ProjectDetectionResult): string[] {
    const allCategories = this._configManager.getCategories()
    const suggested: Array<{ id: string, priority: number }> = []

    for (const category of allCategories) {
      if (this.isCategorySupported(category.id, projectResult)) {
        // 计算优先级
        let priority = 0

        // 基于项目类型的优先级
        if (category.supportedProjectTypes !== '*') {
          const supportedTypes = Array.isArray(category.supportedProjectTypes)
            ? category.supportedProjectTypes
            : [category.supportedProjectTypes]

          for (const type of projectResult.types) {
            if (supportedTypes.includes(type)) {
              const projectType = projectResult.detectedProjectTypes.find(pt => pt.id === type)
              priority += projectType ? projectType.confidence : 50
            }
          }
        }
        else {
          priority = 10 // 通用类别的基础优先级
        }

        // 基于包管理器的额外优先级
        if (category.conditions?.requiredPackageManager) {
          const pm = projectResult.detectedPackageManagers.find(
            pm => pm.id === category.conditions?.requiredPackageManager,
          )
          if (pm) {
            priority += pm.score / 10
          }
        }

        suggested.push({ id: category.id, priority })
      }
    }

    // 按优先级排序并返回
    return suggested
      .sort((a, b) => b.priority - a.priority)
      .map(s => s.id)
  }

  /**
   * 获取项目类型统计信息
   */
  public getProjectTypeStats(projectResult: ProjectDetectionResult): {
    totalCategories: number
    supportedCategories: number
    unsupportedCategories: string[]
  } {
    const allCategories = this._configManager.getCategories()
    const supportedCategories: string[] = []
    const unsupportedCategories: string[] = []

    for (const category of allCategories) {
      if (this.isCategorySupported(category.id, projectResult)) {
        supportedCategories.push(category.displayName)
      }
      else {
        unsupportedCategories.push(category.displayName)
      }
    }

    return {
      totalCategories: allCategories.length,
      supportedCategories: supportedCategories.length,
      unsupportedCategories,
    }
  }

  /**
   * 根据配置定义过滤命令
   */
  public filterCommandsByDefinition(
    commandDefs: CommandDefinition[],
    projectResult: ProjectDetectionResult,
  ): CommandDefinition[] {
    return commandDefs.filter(cmd => this.isCommandDefinitionSupported(cmd, projectResult))
  }

  /**
   * 检查命令定义是否支持当前项目
   */
  private isCommandDefinitionSupported(
    commandDef: CommandDefinition,
    projectResult: ProjectDetectionResult,
  ): boolean {
    if (!commandDef.conditions) {
      return true
    }

    const conditions = commandDef.conditions

    // 检查项目类型要求
    if (conditions.requiresProjectType) {
      const hasRequiredType = conditions.requiresProjectType.some(type =>
        projectResult.types.includes(type as any),
      )
      if (!hasRequiredType) {
        return false
      }
    }

    // 检查包管理器要求
    if (conditions.requiresPackageManager) {
      const hasRequiredPM = projectResult.packageManager === conditions.requiresPackageManager
        || projectResult.pythonManager === conditions.requiresPackageManager
        || projectResult.detectedPackageManagers.some(pm => pm.id === conditions.requiresPackageManager)

      if (!hasRequiredPM) {
        return false
      }
    }

    // 检查Git要求
    if (conditions.requiresGit && !projectResult.hasGit) {
      return false
    }

    // 检查Docker要求
    if (conditions.requiresDocker && !projectResult.hasDocker) {
      return false
    }

    // 检查自定义条件
    if (conditions.custom) {
      return this.checkCustomCondition(conditions.custom, projectResult)
    }

    return true
  }

  /**
   * 获取类别的显示信息
   */
  public getCategoryDisplayInfo(categoryId: string): { displayName: string, icon: string } | null {
    const category = this._configManager.getCategory(categoryId)
    if (category) {
      return {
        displayName: category.displayName,
        icon: category.icon,
      }
    }

    // 后备方案：从类别ID生成显示名称
    return {
      displayName: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      icon: 'gear',
    }
  }

  /**
   * 检查是否有自定义映射
   */
  public hasCustomMapping(categoryId: string): boolean {
    return this._configManager.getCategory(categoryId) !== undefined
  }

  /**
   * 添加或更新类别映射
   */
  public async updateCategoryMapping(category: CategoryDefinition): Promise<void> {
    // 这个方法可以用于动态更新类别映射
    // 实际实现可能需要更新配置文件或内存中的配置
    console.warn('Update category mapping:', category.id)
    // TODO: 实现配置更新逻辑
  }

  /**
   * 获取所有类别映射
   */
  public getAllCategoryMappings(): CategoryDefinition[] {
    return this._configManager.getCategories()
  }
}
