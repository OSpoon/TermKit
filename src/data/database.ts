import type { CommandsData, UserCommand } from '@src/types'
import { EventEmitter } from 'node:events'
import * as path from 'node:path'
import { logger } from '@src/utils'
import * as vscode from 'vscode'

export interface DatabaseEvents {
  initialized: () => void
  saved: () => void
  commandAdded: (command: UserCommand) => void
  commandUpdated: (command: UserCommand) => void
  commandDeleted: (id: number) => void
  categoryUpdated: (oldCategory: string, newCategory: string) => void
  categoryDeleted: (category: string) => void
  batchUpdated: (operations: BatchOperation[]) => void
}

export interface BatchOperation {
  type: 'add' | 'update' | 'delete'
  data: any
}

export class DatabaseManager extends EventEmitter {
  private static _instance: DatabaseManager
  private _context: vscode.ExtensionContext
  private _commands: UserCommand[] = []
  private _nextId: number = 1
  private _saveTimeout: NodeJS.Timeout | null = null
  private _isInitialized: boolean = false

  // 存储键名
  private static readonly COMMANDS_KEY = 'dep-cmd-commands'
  private static readonly NEXT_ID_KEY = 'dep-cmd-next-id'

  private constructor(context: vscode.ExtensionContext) {
    super()
    this._context = context
  }

  public static getInstance(context?: vscode.ExtensionContext): DatabaseManager {
    if (!DatabaseManager._instance && context) {
      DatabaseManager._instance = new DatabaseManager(context)
    }
    return DatabaseManager._instance
  }

  public async initialize(): Promise<void> {
    try {
      // 从 VS Code 全局状态加载数据
      const storedCommands = this._context.globalState.get<UserCommand[]>(DatabaseManager.COMMANDS_KEY, [])
      const storedNextId = this._context.globalState.get<number>(DatabaseManager.NEXT_ID_KEY, 1)

      this._commands = storedCommands
      this._nextId = storedNextId

      // 检查并合并新的默认命令
      await this.checkAndMergeDefaultCommands()

      this._isInitialized = true
      logger.info('Modern database initialized successfully with', this._commands.length, 'commands')
      this.emit('initialized')
    }
    catch (error) {
      logger.error('Failed to initialize modern database:', error)
      throw error
    }
  }

  /**
   * 检查并合并默认命令（包括新分类和缺失的默认分类）
   */
  private async checkAndMergeDefaultCommands(): Promise<void> {
    try {
      // 读取默认命令JSON文件
      const extensionPath = vscode.extensions.getExtension('OSpoon.dep-cmd')?.extensionPath
      if (!extensionPath) {
        throw new Error('Could not find extension path')
      }

      const defaultDataPath = path.join(extensionPath, 'config', 'default-commands.json')
      const { readFile } = await import('node:fs/promises')
      const content = await readFile(defaultDataPath, 'utf8')
      const defaultData: CommandsData = JSON.parse(content)
      const defaultCommands = defaultData.commands || []

      if (this._commands.length === 0) {
        // 第一次初始化，直接使用默认命令
        logger.info('No existing commands found, initializing with default data...')
        this._commands = defaultCommands
        this._nextId = defaultCommands.length > 0
          ? Math.max(...defaultCommands.map(cmd => cmd.id || 0)) + 1
          : 1
        await this.saveImmediately()
        logger.info('Commands initialized with default data:', this._commands.length)
      }
      else {
        // 已有数据，检查缺失的默认分类
        const existingCategories = new Set(this._commands.map(cmd => cmd.category))
        const defaultCategories = new Set(defaultCommands.map(cmd => cmd.category))

        // 找出缺失的默认分类（包括新增的和被删除的）
        const missingCategories = [...defaultCategories].filter(cat => !existingCategories.has(cat))

        if (missingCategories.length > 0) {
          logger.info(`Found missing default categories: ${missingCategories.join(', ')}, restoring commands...`)

          // 获取缺失分类的默认命令
          const missingCommands = defaultCommands.filter(cmd => missingCategories.includes(cmd.category))

          // 重新分配ID，避免冲突
          const maxExistingId = this._commands.length > 0
            ? Math.max(...this._commands.map(cmd => cmd.id || 0))
            : 0

          const commandsToAdd = missingCommands.map((cmd, index) => ({
            ...cmd,
            id: maxExistingId + index + 1,
          }))

          // 合并命令
          this._commands.push(...commandsToAdd)
          this._nextId = Math.max(...this._commands.map(cmd => cmd.id || 0)) + 1

          await this.saveImmediately()
          logger.info(`Restored ${commandsToAdd.length} commands for missing categories: ${missingCategories.join(', ')}`)
        }
        else {
          logger.info('All default categories are present, no restoration needed')
        }
      }
    }
    catch (error) {
      logger.error('Failed to check and merge default commands:', error)
      // 如果出错且没有现有命令，至少确保有一个空的状态
      if (this._commands.length === 0) {
        this._commands = []
        this._nextId = 1
      }
    }
  }

  // 延迟保存机制，避免频繁写入
  private scheduleSave(): void {
    if (!this._isInitialized)
      return

    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout)
    }

    this._saveTimeout = setTimeout(async () => {
      try {
        await this._context.globalState.update(DatabaseManager.COMMANDS_KEY, this._commands)
        await this._context.globalState.update(DatabaseManager.NEXT_ID_KEY, this._nextId)
        this.emit('saved')
        logger.info('Commands saved to VS Code global state')
      }
      catch (error) {
        logger.error('Failed to save commands:', error)
      }
    }, 500) // 500ms 延迟保存
  }

  // 立即保存（用于重要操作）
  private async saveImmediately(): Promise<void> {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout)
      this._saveTimeout = null
    }

    try {
      await this._context.globalState.update(DatabaseManager.COMMANDS_KEY, this._commands)
      await this._context.globalState.update(DatabaseManager.NEXT_ID_KEY, this._nextId)
      this.emit('saved')
    }
    catch (error) {
      logger.error('Failed to save commands immediately:', error)
      throw error
    }
  }

  // 公共方法
  public getAllCommands(): UserCommand[] {
    return [...this._commands].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.label.localeCompare(b.label)
    })
  }

  public getCommandsByCategory(category: string): UserCommand[] {
    return this._commands
      .filter(cmd => cmd.category === category)
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  public getAvailableCategories(): string[] {
    const categories = new Set(this._commands.map(cmd => cmd.category))
    return Array.from(categories).sort()
  }

  public addCommand(command: Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>): UserCommand {
    const now = new Date().toISOString()
    const newCommand: UserCommand = {
      ...command,
      id: this._nextId++,
      created_at: now,
      updated_at: now,
    }

    this._commands.push(newCommand)
    this.scheduleSave()
    this.emit('commandAdded', newCommand)

    logger.info('Command added:', newCommand.label)
    return newCommand
  }

  public updateCommand(id: number, updates: Partial<UserCommand>): UserCommand {
    const index = this._commands.findIndex(cmd => cmd.id === id)
    if (index === -1) {
      throw new Error(`Command with id ${id} not found`)
    }

    const now = new Date().toISOString()
    const updatedCommand: UserCommand = {
      ...this._commands[index],
      ...updates,
      id, // 保持原ID
      updated_at: now,
    }

    this._commands[index] = updatedCommand
    this.scheduleSave()
    this.emit('commandUpdated', updatedCommand)

    logger.info('Command updated:', updatedCommand.label)
    return updatedCommand
  }

  public deleteCommand(id: number): void {
    const index = this._commands.findIndex(cmd => cmd.id === id)
    if (index === -1) {
      throw new Error(`Command with id ${id} not found`)
    }

    const deletedCommand = this._commands[index]
    this._commands.splice(index, 1)
    this.scheduleSave()
    this.emit('commandDeleted', id)

    logger.info('Command deleted:', deletedCommand.label)
  }

  public searchCommands(query: string): UserCommand[] {
    const searchPattern = query.toLowerCase()
    return this._commands.filter(cmd =>
      cmd.label.toLowerCase().includes(searchPattern)
      || cmd.command.toLowerCase().includes(searchPattern)
      || cmd.description?.toLowerCase().includes(searchPattern)
      || cmd.category.toLowerCase().includes(searchPattern),
    ).sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.label.localeCompare(b.label)
    })
  }

  // 批量操作支持
  public async batchUpdate(operations: BatchOperation[]): Promise<void> {
    const results = []

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'add':
            results.push(this.addCommand(op.data))
            break
          case 'update':
            results.push(this.updateCommand(op.data.id, op.data))
            break
          case 'delete':
            this.deleteCommand(op.data.id)
            results.push({ deleted: op.data.id })
            break
        }
      }
      catch (error) {
        logger.error(`Batch operation failed:`, error)
        throw error
      }
    }

    // 批量操作后立即保存
    await this.saveImmediately()
    this.emit('batchUpdated', operations)

    logger.info('Batch operations completed:', operations.length)
  }

  // 分类管理方法
  public updateCategory(oldCategory: string, newCategory: string): void {
    const commandsToUpdate = this._commands.filter(cmd => cmd.category === oldCategory)

    if (commandsToUpdate.length === 0) {
      throw new Error('Category not found or no commands to update')
    }

    const now = new Date().toISOString()
    commandsToUpdate.forEach((cmd) => {
      cmd.category = newCategory
      cmd.updated_at = now
    })

    this.scheduleSave()
    this.emit('categoryUpdated', oldCategory, newCategory)

    logger.info(`Category updated: ${oldCategory} -> ${newCategory} (${commandsToUpdate.length} commands)`)
  }

  public deleteCategory(category: string): void {
    const commandsToDelete = this._commands.filter(cmd => cmd.category === category)

    if (commandsToDelete.length === 0) {
      throw new Error('Category not found')
    }

    this._commands = this._commands.filter(cmd => cmd.category !== category)
    this.scheduleSave()
    this.emit('categoryDeleted', category)

    logger.info(`Category deleted: ${category} (${commandsToDelete.length} commands removed)`)
  }

  public getCategoryCommandCount(category: string): number {
    return this._commands.filter(cmd => cmd.category === category).length
  }

  // 订阅数据变化
  public subscribe(callback: (commands: UserCommand[]) => void): () => void {
    const listener = () => callback([...this._commands])

    this.on('commandAdded', listener)
    this.on('commandUpdated', listener)
    this.on('commandDeleted', listener)
    this.on('batchUpdated', listener)

    return () => {
      this.off('commandAdded', listener)
      this.off('commandUpdated', listener)
      this.off('commandDeleted', listener)
      this.off('batchUpdated', listener)
    }
  }

  // 数据导入/导出功能
  public async exportData(): Promise<CommandsData> {
    return {
      commands: [...this._commands],
    }
  }

  public async importData(data: CommandsData, merge: boolean = false): Promise<void> {
    if (!merge) {
      this._commands = []
      this._nextId = 1
    }

    const importedCommands = data.commands || []
    const maxExistingId = this._commands.length > 0
      ? Math.max(...this._commands.map(cmd => cmd.id || 0))
      : 0

    for (const cmd of importedCommands) {
      const newCommand: UserCommand = {
        ...cmd,
        id: ++this._nextId,
        created_at: cmd.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      this._commands.push(newCommand)
    }

    this._nextId = Math.max(this._nextId, maxExistingId + 1)
    await this.saveImmediately()

    logger.info(`Imported ${importedCommands.length} commands`)
  }

  // 获取数据库统计信息
  public getStats(): {
    totalCommands: number
    categories: number
    lastUpdated: string | null
    storageKeys: string[]
  } {
    const lastUpdated = this._commands.length > 0
      ? Math.max(...this._commands.map(cmd => new Date(cmd.updated_at || '').getTime()))
      : null

    return {
      totalCommands: this._commands.length,
      categories: this.getAvailableCategories().length,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
      storageKeys: [
        DatabaseManager.COMMANDS_KEY,
        DatabaseManager.NEXT_ID_KEY,
      ],
    }
  }

  // 清理和维护
  public async cleanup(): Promise<void> {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout)
      this._saveTimeout = null
    }

    // 最后一次保存
    if (this._isInitialized) {
      await this.saveImmediately()
    }

    this.removeAllListeners()
    logger.info('Database cleanup completed')
  }

  /**
   * 清空所有数据
   */
  public async clearAllData(): Promise<void> {
    this._commands = []
    this._nextId = 1
    await this.saveImmediately()
    logger.info('All data cleared')
  }

  /**
   * 恢复缺失的默认命令分类
   */
  public async restoreMissingDefaultCategories(): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Database not initialized')
    }

    logger.info('Manually checking for missing default categories...')
    await this.checkAndMergeDefaultCommands()
  }
}
