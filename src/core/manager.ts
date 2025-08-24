import type * as vscode from 'vscode'
import type { ProjectDetectionResult, UserCommand } from '../types'
import { DatabaseManager } from '../data/database'
import { CommandFilter } from '../data/filter'
import { ConfigManager } from './configuration'
import { ProjectDetector } from './detector'

export type { UserCommand } from '../types'
export type { ProjectDetectionResult } from '../types'

export class CommandManager {
  private static _instance: CommandManager
  private _database: DatabaseManager
  private _configManager: ConfigManager
  private _detector: ProjectDetector
  private _filter: CommandFilter
  private _currentProject: ProjectDetectionResult | null = null

  private constructor(context: vscode.ExtensionContext) {
    this._database = DatabaseManager.getInstance(context)
    this._configManager = ConfigManager.getInstance(context)
    this._detector = ProjectDetector.getInstance(this._configManager)
    this._filter = CommandFilter.getInstance(this._configManager)
  }

  public static getInstance(context?: vscode.ExtensionContext): CommandManager {
    if (!CommandManager._instance && context) {
      CommandManager._instance = new CommandManager(context)
    }
    return CommandManager._instance
  }

  public async loadCommands(): Promise<void> {
    try {
      // 加载配置
      await this._configManager.loadConfig()

      // 初始化数据库
      await this._database.initialize()

      // 检测当前项目
      await this.detectCurrentProject()

      console.warn('Commands loaded from database')
    }
    catch (error) {
      console.error('Failed to load commands from database:', error)
      throw error
    }
  }

  /**
   * 检测当前项目类型
   */
  public async detectCurrentProject(forceRefresh: boolean = false): Promise<ProjectDetectionResult> {
    this._currentProject = await this._detector.detectProject(forceRefresh)
    return this._currentProject
  }

  /**
   * 获取当前项目检测结果
   */
  public getCurrentProject(): ProjectDetectionResult | null {
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

    if (this._currentProject) {
      return this._filter.filterCommands(allCommands, this._currentProject)
    }

    return allCommands
  }

  /**
   * 获取过滤后的命令分类
   */
  public async getFilteredCategories(): Promise<string[]> {
    const allCategories = await this.getAvailableCategories()
    console.warn(`All available categories: ${allCategories.join(', ')}`)

    if (!this._currentProject) {
      console.warn('No current project, detecting...')
      await this.detectCurrentProject()
    }

    if (this._currentProject) {
      console.warn(`Current project types: ${this._currentProject.detectedProjectTypes.map(pt => pt.displayName).join(', ')}`)
      const filteredCategories = this._filter.filterCategories(allCategories, this._currentProject)
      console.warn(`Filtered categories: ${filteredCategories.join(', ')}`)
      return filteredCategories
    }

    console.warn('No project detected, returning all categories')
    return allCategories
  }

  /**
   * 根据项目类型获取过滤后的分类命令
   */
  public async getFilteredCommandsByCategory(category: string): Promise<UserCommand[]> {
    const commands = await this.getCommandsByCategory(category)
    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (this._currentProject) {
      return this._filter.filterCommands(commands, this._currentProject)
    }

    return commands
  }

  /**
   * 获取建议的命令分类
   */
  public async getSuggestedCategories(): Promise<string[]> {
    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (this._currentProject) {
      return this._filter.getSuggestedCategories(this._currentProject)
    }

    return []
  }

  /**
   * 获取项目类型统计信息
   */
  public async getProjectStats(): Promise<{
    totalCategories: number
    supportedCategories: number
    unsupportedCategories: string[]
    projectTypes: string[]
    packageManager?: string
    pythonManager?: string
    hasGit: boolean
    hasDocker: boolean
  } | null> {
    if (!this._currentProject) {
      await this.detectCurrentProject()
    }

    if (this._currentProject) {
      const stats = this._filter.getProjectTypeStats(this._currentProject)
      return {
        ...stats,
        projectTypes: this._currentProject.detectedProjectTypes.map(pt => pt.displayName),
        packageManager: this._currentProject.packageManager,
        pythonManager: this._currentProject.pythonManager,
        hasGit: this._currentProject.hasGit,
        hasDocker: this._currentProject.hasDocker,
      }
    }

    return null
  }

  /**
   * 获取类别的显示信息
   */
  public getCategoryDisplayInfo(categoryId: string): { displayName: string, icon: string } | null {
    return this._filter.getCategoryDisplayInfo(categoryId)
  }

  public async getAllCommands(): Promise<UserCommand[]> {
    try {
      return this._database.getAllCommands()
    }
    catch (error) {
      console.error('Failed to get all commands:', error)
      return []
    }
  }

  public async getCommandsByCategory(category: string): Promise<UserCommand[]> {
    try {
      return this._database.getCommandsByCategory(category)
    }
    catch (error) {
      console.error('Failed to get commands by category:', error)
      return []
    }
  }

  public async getAvailableCategories(): Promise<string[]> {
    try {
      return this._database.getAvailableCategories()
    }
    catch (error) {
      console.error('Failed to get available categories:', error)
      return []
    }
  }

  public async addCommand(command: Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      this._database.addCommand(command)
      console.warn('Command added successfully')
    }
    catch (error) {
      console.error('Failed to add command:', error)
      throw error
    }
  }

  public async updateCommand(id: number, command: Partial<UserCommand>): Promise<void> {
    try {
      this._database.updateCommand(id, command)
      console.warn('Command updated successfully')
    }
    catch (error) {
      console.error('Failed to update command:', error)
      throw error
    }
  }

  public async deleteCommand(id: number): Promise<void> {
    try {
      this._database.deleteCommand(id)
      console.warn('Command deleted successfully')
    }
    catch (error) {
      console.error('Failed to delete command:', error)
      throw error
    }
  }

  public async searchCommands(query: string): Promise<UserCommand[]> {
    try {
      return this._database.searchCommands(query)
    }
    catch (error) {
      console.error('Failed to search commands:', error)
      return []
    }
  }

  public getDatabasePath(): string {
    return this._database.getDatabasePath()
  }

  public async openDatabase(): Promise<void> {
    try {
      await this._database.openDatabase()
    }
    catch (error) {
      console.error('Failed to open database:', error)
      throw error
    }
  }

  public async reloadFromDatabase(): Promise<void> {
    try {
      this._database.reload()
      // 重新检测项目以确保过滤器工作正常
      await this.detectCurrentProject()
      console.warn('Commands reloaded from database and project re-detected')
    }
    catch (error) {
      console.error('Failed to reload from database:', error)
      throw error
    }
  }

  // 保留兼容性方法
  public async saveCommands(): Promise<void> {
    // JSON文件自动保存，不需要手动保存
    console.warn('Commands are automatically saved to database')
  }

  public getCommands(): { commands: Record<string, UserCommand[]> } {
    // 这个方法保留用于兼容性，但实际上应该使用异步方法
    console.warn('getCommands() is deprecated, use getAllCommands() instead')
    return { commands: {} }
  }

  public async initializeWithDefaults(_defaultCommands: UserCommand[]): Promise<void> {
    // 数据库初始化时会自动添加默认命令，这里不需要再添加
    console.warn('Default commands are automatically initialized from database')
  }

  // 保留兼容性方法
  public getCommandsFilePath(): string {
    return this.getDatabasePath()
  }

  public async openCommandsFile(): Promise<void> {
    await this.openDatabase()
  }

  public async reloadFromFile(): Promise<void> {
    await this.reloadFromDatabase()
  }

  public async cleanup(): Promise<void> {
    this._database.cleanup()
  }

  // 分类管理方法
  public async updateCategory(oldCategory: string, newCategory: string): Promise<void> {
    try {
      this._database.updateCategory(oldCategory, newCategory)
      console.warn('Category updated successfully')
    }
    catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  public async deleteCategory(category: string): Promise<void> {
    try {
      this._database.deleteCategory(category)
      console.warn('Category deleted successfully')
    }
    catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  }

  public async getCategoryCommandCount(category: string): Promise<number> {
    try {
      return this._database.getCategoryCommandCount(category)
    }
    catch (error) {
      console.error('Failed to get category command count:', error)
      return 0
    }
  }
}
