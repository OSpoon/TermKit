import type * as vscode from 'vscode'
import type { UserCommand } from './database'
import { DatabaseManager } from './database'

export type { UserCommand } from './database'

export class CommandManager {
  private static _instance: CommandManager
  private _database: DatabaseManager

  private constructor(context: vscode.ExtensionContext) {
    this._database = DatabaseManager.getInstance(context)
  }

  public static getInstance(context?: vscode.ExtensionContext): CommandManager {
    if (!CommandManager._instance && context) {
      CommandManager._instance = new CommandManager(context)
    }
    return CommandManager._instance
  }

  public async loadCommands(): Promise<void> {
    try {
      await this._database.initialize()
      console.warn('Commands loaded from database')
    }
    catch (error) {
      console.error('Failed to load commands from database:', error)
      throw error
    }
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
      console.warn('Commands reloaded from database')
    }
    catch (error) {
      console.error('Failed to reload from database:', error)
      throw error
    }
  }

  // 保留兼容性方法
  public async saveCommands(): Promise<void> {
    // SQLite自动保存，不需要手动保存
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
}
