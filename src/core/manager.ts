import type { UserCommand } from '@src/types'
import type * as vscode from 'vscode'
import type { DetectionResult } from './detector'

import { DatabaseManager } from '@src/data/database'
import { logger } from '@src/utils'
import { ProjectDetector } from './detector'

export class CommandManager {
  private static _instance: CommandManager
  private _database: DatabaseManager
  private _detector: ProjectDetector
  private _currentProject: DetectionResult | null = null
  private _unsubscribeDatabase?: () => void

  private constructor(context: vscode.ExtensionContext) {
    this._database = DatabaseManager.getInstance(context)
    this._detector = ProjectDetector.getInstance()

    // 订阅数据库变化
    this._unsubscribeDatabase = this._database.subscribe(() => {
      // 当数据变化时，可以在这里处理一些逻辑
      logger.info('Commands data updated')
    })
  }

  public static getInstance(context?: vscode.ExtensionContext): CommandManager {
    if (!CommandManager._instance && context) {
      CommandManager._instance = new CommandManager(context)
    }
    return CommandManager._instance
  }

  public async loadCommands(): Promise<void> {
    try {
      // 初始化数据库
      await this._database.initialize()

      // 检测当前项目
      await this.detectCurrentProject()

      logger.info('Commands loaded successfully')
    }
    catch (error) {
      logger.error('Failed to load commands:', error)
      throw error
    }
  }

  /**
   * 检测当前项目类型
   */
  public async detectCurrentProject(forceRefresh: boolean = false): Promise<DetectionResult> {
    this._currentProject = await this._detector.detectProject(forceRefresh)
    return this._currentProject
  }

  /**
   * 清除项目缓存
   */
  public clearProjectCache(): void {
    this._detector.clearCache()
    this._currentProject = null
    logger.info('Project cache cleared')
  }

  /**
   * 获取当前项目检测结果
   */
  public getCurrentProject(): DetectionResult | null {
    return this._currentProject
  }

  /**
   * 获取过滤后的命令（考虑项目检测设置）
   */
  public async getFilteredCommands(): Promise<UserCommand[]> {
    const allCommands = await this.getAllCommands()

    // 检查是否启用项目检测
    const config = await import('vscode').then(vscode => vscode.workspace.getConfiguration('depCmd'))
    const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

    if (!enableProjectDetection) {
      // 项目检测禁用时返回所有命令
      return allCommands
    }

    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (this._currentProject && this._currentProject.detectedCategories.length > 0) {
      // 只返回检测到的分类的命令
      return allCommands.filter(cmd =>
        this._currentProject!.detectedCategories.includes(cmd.category),
      )
    }

    return allCommands
  }

  /**
   * 获取过滤后的命令分类（考虑项目检测设置）
   */
  public async getFilteredCategories(): Promise<string[]> {
    // 检查是否启用项目检测
    const config = await import('vscode').then(vscode => vscode.workspace.getConfiguration('depCmd'))
    const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

    if (!enableProjectDetection) {
      // 项目检测禁用时返回所有分类
      return this.getAvailableCategories()
    }

    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (this._currentProject && this._currentProject.detectedCategories.length > 0) {
      const allCategories = this.getAvailableCategories()
      return allCategories.filter(category =>
        this._currentProject!.detectedCategories.includes(category),
      )
    }

    return this.getAvailableCategories()
  }

  /**
   * 获取过滤后的指定分类命令（考虑项目检测设置）
   */
  public async getFilteredCommandsByCategory(category: string): Promise<UserCommand[]> {
    const allCommands = this.getCommandsByCategory(category)

    // 检查是否启用项目检测
    const config = await import('vscode').then(vscode => vscode.workspace.getConfiguration('depCmd'))
    const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

    if (!enableProjectDetection) {
      // 项目检测禁用时返回所有命令
      return allCommands
    }

    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (this._currentProject && this._currentProject.detectedCategories.length > 0) {
      // 只有当分类被检测到时才返回命令
      if (this._currentProject.detectedCategories.includes(category)) {
        return allCommands
      }
      return []
    }

    return allCommands
  }

  /**
   * 获取建议的命令分类
   */
  public async getSuggestedCategories(): Promise<string[]> {
    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (this._currentProject) {
      return this._currentProject.detectedCategories
    }

    return []
  }

  /**
   * 获取项目类型统计信息
   */
  public async getProjectStats(): Promise<{
    totalCategories: number
    supportedCategories: number
    detectedCategories: string[]
    workspaceRoot: string
  } | null> {
    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (!this._currentProject) {
      return null
    }

    const allCategories = this.getAvailableCategories()

    return {
      totalCategories: allCategories.length,
      supportedCategories: this._currentProject.detectedCategories.length,
      detectedCategories: this._currentProject.detectedCategories,
      workspaceRoot: this._currentProject.workspaceRoot,
    }
  }

  /**
   * 重新加载数据库中的命令
   */
  public async reloadFromDatabase(): Promise<void> {
    // 现代数据库管理器中，数据已经是实时的，只需要重新检测项目
    await this.detectCurrentProject(true)
    logger.info('Commands reloaded')
  }

  // 以下是直接代理到数据库管理器的方法

  /**
   * 获取所有命令
   */
  public getAllCommands(): UserCommand[] {
    return this._database.getAllCommands()
  }

  /**
   * 根据分类获取命令
   */
  public getCommandsByCategory(category: string): UserCommand[] {
    return this._database.getCommandsByCategory(category)
  }

  /**
   * 获取可用的分类
   */
  public getAvailableCategories(): string[] {
    return this._database.getAvailableCategories()
  }

  /**
   * 添加命令
   */
  public addCommand(command: Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>): UserCommand {
    return this._database.addCommand(command)
  }

  /**
   * 更新命令
   */
  public updateCommand(id: number, command: Partial<UserCommand>): UserCommand {
    return this._database.updateCommand(id, command)
  }

  /**
   * 删除命令
   */
  public deleteCommand(id: number): void {
    this._database.deleteCommand(id)
  }

  /**
   * 搜索命令
   */
  public searchCommands(query: string): UserCommand[] {
    return this._database.searchCommands(query)
  }

  /**
   * 分类管理：更新分类名称
   */
  public updateCategory(oldCategory: string, newCategory: string): void {
    this._database.updateCategory(oldCategory, newCategory)
  }

  /**
   * 分类管理：删除分类
   */
  public deleteCategory(category: string): void {
    this._database.deleteCategory(category)
  }

  /**
   * 获取分类中的命令数量
   */
  public getCategoryCommandCount(category: string): number {
    return this._database.getCategoryCommandCount(category)
  }

  /**
   * 批量更新操作
   */
  public async batchUpdate(operations: Array<{ type: 'add' | 'update' | 'delete', data: any }>): Promise<void> {
    await this._database.batchUpdate(operations)
  }

  /**
   * 导出数据
   */
  public async exportData() {
    return this._database.exportData()
  }

  /**
   * 导入数据
   */
  public async importData(data: any, merge: boolean = false): Promise<void> {
    await this._database.importData(data, merge)
  }

  /**
   * 获取数据库统计信息
   */
  public getStats() {
    return this._database.getStats()
  }

  /**
   * 获取分类显示信息
   */
  public getCategoryDisplayInfo(category: string): { displayName: string, icon: string } | null {
    // 简化版本，直接返回基本信息
    const categoryMap: Record<string, { displayName: string, icon: string }> = {
      npm: { displayName: 'NPM', icon: 'package' },
      yarn: { displayName: 'Yarn', icon: 'package' },
      pnpm: { displayName: 'PNPM', icon: 'package' },
      python: { displayName: 'Python', icon: 'snake' },
      rust: { displayName: 'Cargo', icon: 'gear' },
      go: { displayName: 'Go', icon: 'go' },
      docker: { displayName: 'Docker', icon: 'server-process' },
      git: { displayName: 'Git', icon: 'git-branch' },
    }

    return categoryMap[category] || {
      displayName: category.charAt(0).toUpperCase() + category.slice(1),
      icon: 'gear',
    }
  }

  /**
   * 获取项目脚本
   */
  public getProjectScripts(): import('./detector').PackageJsonScript[] {
    return this._detector.getProjectScripts()
  }

  /**
   * 获取检测到的包管理器
   */
  public getPackageManager(): import('./detector').PackageManager | undefined {
    return this._currentProject?.packageManager
  }

  /**
   * 检查是否有项目脚本
   */
  public hasProjectScripts(): boolean {
    return this.getProjectScripts().length > 0
  }

  /**
   * 检查分类是否是通过项目检测生成的
   */
  public isDetectedCategory(category: string): boolean {
    if (!this._currentProject) {
      return false
    }
    return this._currentProject.detectedCategories.includes(category)
  }

  /**
   * 订阅数据变化
   */
  public subscribe(callback: (commands: UserCommand[]) => void): () => void {
    return this._database.subscribe(callback)
  }

  /**
   * 清空所有数据
   */
  public async clearAllData(): Promise<void> {
    await this._database.clearAllData()
    await this.detectCurrentProject()
  }

  /**
   * 清理资源
   */
  public async dispose(): Promise<void> {
    if (this._unsubscribeDatabase) {
      this._unsubscribeDatabase()
    }
    await this._database.cleanup()
    logger.info('CommandManager disposed')
  }
}
