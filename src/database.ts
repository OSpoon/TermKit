import type { CommandsData, UserCommand } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import * as vscode from 'vscode'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const access = promisify(fs.access)

export class DatabaseManager {
  private static _instance: DatabaseManager
  private _dataPath: string
  private _commands: UserCommand[] = []
  private _nextId: number = 1

  private constructor(context: vscode.ExtensionContext) {
    this._dataPath = path.join(context.globalStorageUri.fsPath, 'commands.json')
  }

  public static getInstance(context?: vscode.ExtensionContext): DatabaseManager {
    if (!DatabaseManager._instance && context) {
      DatabaseManager._instance = new DatabaseManager(context)
    }
    return DatabaseManager._instance
  }

  public async initialize(): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(this._dataPath)
      await mkdir(dir, { recursive: true })

      // 检查文件是否存在
      const fileExists = await this.checkFileExists()
      if (!fileExists) {
        console.warn('Commands file is empty, initializing with default data...')
        await this.initializeWithDefaults()
      }
      else {
        await this.loadFromFile()
      }

      console.warn('Commands initialized successfully at:', this._dataPath)
    }
    catch (error) {
      console.error('Failed to initialize commands:', error)
      throw error
    }
  }

  private async checkFileExists(): Promise<boolean> {
    try {
      await access(this._dataPath, fs.constants.F_OK)
      return true
    }
    catch {
      return false
    }
  }

  private async loadFromFile(): Promise<void> {
    try {
      const content = await readFile(this._dataPath, 'utf8')
      const data: CommandsData = JSON.parse(content)
      this._commands = data.commands || []

      // 计算下一个可用的ID
      this._nextId = this._commands.length > 0
        ? Math.max(...this._commands.map(cmd => cmd.id || 0)) + 1
        : 1

      console.warn('Commands loaded from file:', this._commands.length)
    }
    catch (error) {
      console.error('Failed to load commands from file:', error)
      await this.initializeWithDefaults()
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const data: CommandsData = { commands: this._commands }
      await writeFile(this._dataPath, JSON.stringify(data, null, 2), 'utf8')
    }
    catch (error) {
      console.error('Failed to save commands to file:', error)
      throw error
    }
  }

  private async initializeWithDefaults(): Promise<void> {
    try {
      // 读取默认命令JSON文件
      const extensionPath = vscode.extensions.getExtension('OSpoon.dep-cmd')?.extensionPath
      if (!extensionPath) {
        throw new Error('Could not find extension path')
      }

      const defaultDataPath = path.join(extensionPath, 'res', 'default-commands.json')
      const content = await readFile(defaultDataPath, 'utf8')
      const defaultData: CommandsData = JSON.parse(content)

      this._commands = defaultData.commands || []
      this._nextId = this._commands.length > 0
        ? Math.max(...this._commands.map(cmd => cmd.id || 0)) + 1
        : 1

      await this.saveToFile()
      console.warn('Commands initialized with default data:', this._commands.length)
    }
    catch (error) {
      console.error('Failed to initialize with defaults:', error)
      this._commands = []
      this._nextId = 1
    }
  }

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

  public addCommand(command: Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>): void {
    const now = new Date().toISOString()
    const newCommand: UserCommand = {
      ...command,
      id: this._nextId++,
      created_at: now,
      updated_at: now,
    }

    this._commands.push(newCommand)
    this.saveToFile().catch((error) => {
      console.error('Failed to save after adding command:', error)
    })
  }

  public updateCommand(id: number, command: Partial<UserCommand>): void {
    const index = this._commands.findIndex(cmd => cmd.id === id)
    if (index === -1) {
      throw new Error(`Command with id ${id} not found`)
    }

    const now = new Date().toISOString()
    this._commands[index] = {
      ...this._commands[index],
      ...command,
      id, // 保持原ID不变
      updated_at: now,
    }

    this.saveToFile().catch((error) => {
      console.error('Failed to save after updating command:', error)
    })
  }

  public deleteCommand(id: number): void {
    const index = this._commands.findIndex(cmd => cmd.id === id)
    if (index === -1) {
      throw new Error(`Command with id ${id} not found`)
    }

    this._commands.splice(index, 1)
    this.saveToFile().catch((error) => {
      console.error('Failed to save after deleting command:', error)
    })
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

  public getDatabasePath(): string {
    return this._dataPath
  }

  public async openDatabase(): Promise<void> {
    try {
      const uri = vscode.Uri.file(this._dataPath)
      await vscode.window.showTextDocument(uri)
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to open commands file: ${error}`)
    }
  }

  public reload(): void {
    this.loadFromFile().catch((error) => {
      console.error('Failed to reload from file:', error)
    })
    console.warn('Commands reloaded from file')
  }

  public cleanup(): void {
    // JSON文件不需要特殊清理
    console.warn('Commands cleanup completed')
  }

  // 分类管理方法
  public updateCategory(oldCategory: string, newCategory: string): void {
    const updatedCommands = this._commands.filter(cmd => cmd.category === oldCategory)

    if (updatedCommands.length === 0) {
      throw new Error('Category not found or no commands updated')
    }

    const now = new Date().toISOString()
    updatedCommands.forEach((cmd) => {
      cmd.category = newCategory
      cmd.updated_at = now
    })

    this.saveToFile().catch((error) => {
      console.error('Failed to save after updating category:', error)
    })
  }

  public deleteCategory(category: string): void {
    const commandsToDelete = this._commands.filter(cmd => cmd.category === category)

    if (commandsToDelete.length === 0) {
      throw new Error('Category not found')
    }

    this._commands = this._commands.filter(cmd => cmd.category !== category)

    this.saveToFile().catch((error) => {
      console.error('Failed to save after deleting category:', error)
    })
  }

  public getCategoryCommandCount(category: string): number {
    return this._commands.filter(cmd => cmd.category === category).length
  }
}
