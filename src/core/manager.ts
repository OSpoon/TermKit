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

  private constructor(context: vscode.ExtensionContext) {
    this._database = DatabaseManager.getInstance(context)
    this._detector = ProjectDetector.getInstance()
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

      logger.info('Commands loaded from database')
    }
    catch (error) {
      logger.error('Failed to load commands from database:', error)
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
   * 获取当前项目检测结果
   */
  public getCurrentProject(): DetectionResult | null {
    return this._currentProject
  }

  /**
   * 获取过滤后的命令（根据项目类型）
   */
  public async getFilteredCommands(): Promise<UserCommand[]> {
    const allCommands = await this.getAllCommands()
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
   * 获取过滤后的命令分类
   */
  public async getFilteredCategories(): Promise<string[]> {
    const allCategories = await this.getAvailableCategories()
    logger.info(`All available categories: ${allCategories.join(', ')}`)

    if (!this._currentProject) {
      logger.info('No current project, detecting...')
      await this.detectCurrentProject()
    }

    if (this._currentProject && this._currentProject.detectedCategories.length > 0) {
      logger.info(`Detected categories: ${this._currentProject.detectedCategories.join(', ')}`)
      // 只返回检测到的分类中存在命令的分类
      const filteredCategories = allCategories.filter(category =>
        this._currentProject!.detectedCategories.includes(category),
      )
      logger.info(`Filtered categories: ${filteredCategories.join(', ')}`)
      return filteredCategories
    }

    logger.info('No categories detected, returning all categories')
    return allCategories
  }

  /**
   * 获取过滤后的指定分类命令
   */
  public async getFilteredCommandsByCategory(category: string): Promise<UserCommand[]> {
    const allCommands = await this.getCommandsByCategory(category)

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

    const allCategories = await this.getAvailableCategories()

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
    try {
      await this._database.initialize()
      await this.detectCurrentProject(true) // 强制刷新项目检测
      logger.info('Commands reloaded from database')
    }
    catch (error) {
      logger.error('Failed to reload commands from database:', error)
      throw error
    }
  }

  /**
   * 获取所有命令
   */
  public async getAllCommands(): Promise<UserCommand[]> {
    return await this._database.getAllCommands()
  }

  /**
   * 根据分类获取命令
   */
  public async getCommandsByCategory(category: string): Promise<UserCommand[]> {
    return await this._database.getCommandsByCategory(category)
  }

  /**
   * 获取所有可用的分类
   */
  public async getAvailableCategories(): Promise<string[]> {
    return await this._database.getAvailableCategories()
  }

  /**
   * 添加新命令
   */
  public async addCommand(command: Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      this._database.addCommand(command)
      await this.detectCurrentProject()
    }
    catch (error) {
      logger.error('Failed to add command:', error)
      throw error
    }
  }

  /**
   * 更新命令
   */
  public async updateCommand(id: number, command: Partial<Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    try {
      await this._database.updateCommand(id, command)
      await this.detectCurrentProject()
    }
    catch (error) {
      logger.error('Failed to update command:', error)
      throw error
    }
  }

  /**
   * 删除命令
   */
  public async deleteCommand(id: number): Promise<void> {
    try {
      await this._database.deleteCommand(id)
      await this.detectCurrentProject()
    }
    catch (error) {
      logger.error('Failed to delete command:', error)
      throw error
    }
  }

  /**
   * 根据ID获取命令
   */
  public async getCommandById(id: number): Promise<UserCommand | null> {
    const allCommands = await this.getAllCommands()
    return allCommands.find(cmd => cmd.id === id) || null
  }

  /**
   * 搜索命令
   */
  public async searchCommands(query: string): Promise<UserCommand[]> {
    return await this._database.searchCommands(query)
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
   * 清空所有数据
   */
  public async clearAllData(): Promise<void> {
    try {
      // 删除所有命令
      const allCommands = await this.getAllCommands()
      for (const cmd of allCommands) {
        if (cmd.id) {
          this._database.deleteCommand(cmd.id)
        }
      }
      await this.detectCurrentProject()
    }
    catch (error) {
      logger.error('Failed to clear all data:', error)
      throw error
    }
  }

  /**
   * 导入命令
   */
  public async importCommands(commands: Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    try {
      for (const cmd of commands) {
        this._database.addCommand(cmd)
      }
      await this.detectCurrentProject()
    }
    catch (error) {
      logger.error('Failed to import commands:', error)
      throw error
    }
  }

  /**
   * 导出命令
   */
  public async exportCommands(): Promise<UserCommand[]> {
    return await this._database.getAllCommands()
  }

  /**
   * 获取数据库文件路径
   */
  public getDatabasePath(): string {
    return this._database.getDatabasePath()
  }

  /**
   * 获取分类中的命令数量
   */
  public getCategoryCommandCount(category: string): number {
    return this._database.getCategoryCommandCount(category)
  }

  /**
   * 更新分类名称
   */
  public updateCategory(oldCategory: string, newCategory: string): void {
    this._database.updateCategory(oldCategory, newCategory)
  }

  /**
   * 删除分类
   */
  public deleteCategory(category: string): void {
    this._database.deleteCategory(category)
  }
}
