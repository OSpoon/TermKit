import type { UserCommand } from '@src/types'

import { DatabaseManager } from '@src/data/database'
import { logger } from '@src/utils'
import * as vscode from 'vscode'

export class CommandManager {
  private static _instance: CommandManager
  private _database: DatabaseManager
  private _unsubscribeDatabase?: () => void

  private constructor(context: vscode.ExtensionContext) {
    this._database = DatabaseManager.getInstance(context)

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
      // 仅初始化数据库
      await this._database.initialize()
      logger.info('Commands loaded successfully')
    }
    catch (error) {
      logger.error('Failed to load commands:', error)
      throw error
    }
  }

  /**
   * 重新加载数据库中的命令
   */
  public async reloadFromDatabase(): Promise<void> {
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
    try {
      // 从 VS Code 配置中获取分类显示信息
      const config = vscode.workspace.getConfiguration('depCmd')
      const categoryDisplayConfig = config.get<Record<string, { displayName: string, icon: string }>>('categoryDisplay', {})

      // 如果配置中有该分类，使用配置的信息
      if (categoryDisplayConfig[category]) {
        return categoryDisplayConfig[category]
      }

      // 如果配置中没有，返回默认值
      return {
        displayName: category.charAt(0).toUpperCase() + category.slice(1),
        icon: 'gear',
      }
    }
    catch (error) {
      logger.warn(`Failed to get category display info for ${category}:`, error)
      return {
        displayName: category.charAt(0).toUpperCase() + category.slice(1),
        icon: 'gear',
      }
    }
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
  }

  /**
   * 恢复缺失的默认命令分类
   */
  public async restoreMissingDefaultCategories(): Promise<void> {
    await this._database.restoreMissingDefaultCategories()
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
