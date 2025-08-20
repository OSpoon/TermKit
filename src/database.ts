import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import Database from 'better-sqlite3'
import * as vscode from 'vscode'

const readFile = promisify(fs.readFile)
const mkdir = promisify(fs.mkdir)

export interface UserCommand {
  id?: number
  label: string
  command: string
  description?: string
  category: string
  icon?: string
  created_at?: string
  updated_at?: string
}

export class DatabaseManager {
  private static _instance: DatabaseManager
  private _db: Database.Database | null = null
  private _dbPath: string

  private constructor(context: vscode.ExtensionContext) {
    this._dbPath = path.join(context.globalStorageUri.fsPath, 'commands.db')
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
      const dir = path.dirname(this._dbPath)
      await mkdir(dir, { recursive: true })

      // 连接数据库
      this.connect()

      // 检查数据库是否为空（是否需要初始化）
      const tableExists = this.checkTableExists('commands')
      if (!tableExists) {
        console.warn('Database is empty, initializing with default data...')
        await this.initializeDatabase()
      }

      console.warn('Database initialized successfully at:', this._dbPath)
    }
    catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  private connect(): void {
    if (!this._db) {
      this._db = new Database(this._dbPath)
    }
  }

  private disconnect(): void {
    if (this._db) {
      this._db.close()
      this._db = null
    }
  }

  private checkTableExists(tableName: string): boolean {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const result = this._db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName)

    return !!result
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // 读取初始化SQL文件
      const extensionPath = vscode.extensions.getExtension('OSpoon.dep-cmd')?.extensionPath
      if (!extensionPath) {
        throw new Error('Could not find extension path')
      }

      const sqlFilePath = path.join(extensionPath, 'res', 'init.sql')
      const sqlContent = await readFile(sqlFilePath, 'utf8')

      // 执行SQL命令
      this.executeSqlScript(sqlContent)
      console.warn('Database initialized with default commands')
    }
    catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  private executeSqlScript(sql: string): void {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    this._db.exec(sql)
  }

  public getAllCommands(): UserCommand[] {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const stmt = this._db.prepare('SELECT * FROM commands ORDER BY category, label')
    return stmt.all() as UserCommand[]
  }

  public getCommandsByCategory(category: string): UserCommand[] {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const stmt = this._db.prepare('SELECT * FROM commands WHERE category = ? ORDER BY label')
    return stmt.all(category) as UserCommand[]
  }

  public getAvailableCategories(): string[] {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const stmt = this._db.prepare('SELECT DISTINCT category FROM commands ORDER BY category')
    const rows = stmt.all() as { category: string }[]
    return rows.map(row => row.category)
  }

  public addCommand(command: Omit<UserCommand, 'id' | 'created_at' | 'updated_at'>): void {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const stmt = this._db.prepare(`
      INSERT INTO commands (label, command, description, category, icon) 
      VALUES (?, ?, ?, ?, ?)
    `)

    stmt.run(command.label, command.command, command.description, command.category, command.icon)
  }

  public updateCommand(id: number, command: Partial<UserCommand>): void {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const fields = []
    const values = []

    if (command.label !== undefined) {
      fields.push('label = ?')
      values.push(command.label)
    }
    if (command.command !== undefined) {
      fields.push('command = ?')
      values.push(command.command)
    }
    if (command.description !== undefined) {
      fields.push('description = ?')
      values.push(command.description)
    }
    if (command.category !== undefined) {
      fields.push('category = ?')
      values.push(command.category)
    }
    if (command.icon !== undefined) {
      fields.push('icon = ?')
      values.push(command.icon)
    }

    if (fields.length === 0) {
      return
    }

    values.push(id)

    const stmt = this._db.prepare(`UPDATE commands SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)
  }

  public deleteCommand(id: number): void {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const stmt = this._db.prepare('DELETE FROM commands WHERE id = ?')
    stmt.run(id)
  }

  public searchCommands(query: string): UserCommand[] {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const searchPattern = `%${query}%`
    const stmt = this._db.prepare(`
      SELECT * FROM commands 
      WHERE label LIKE ? OR command LIKE ? OR description LIKE ? OR category LIKE ?
      ORDER BY category, label
    `)

    return stmt.all(searchPattern, searchPattern, searchPattern, searchPattern) as UserCommand[]
  }

  public getDatabasePath(): string {
    return this._dbPath
  }

  public async openDatabase(): Promise<void> {
    try {
      const uri = vscode.Uri.file(this._dbPath)
      await vscode.window.showTextDocument(uri)
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to open database file: ${error}`)
    }
  }

  public reload(): void {
    this.disconnect()
    this.connect()
    console.warn('Database connection reloaded')
  }

  public cleanup(): void {
    this.disconnect()
  }

  // 分类管理方法
  public updateCategory(oldCategory: string, newCategory: string): void {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const stmt = this._db.prepare('UPDATE commands SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ?')
    const result = stmt.run(newCategory, oldCategory)

    if (result.changes === 0) {
      throw new Error('Category not found or no commands updated')
    }
  }

  public deleteCategory(category: string): void {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    // 首先检查分类是否存在
    const checkStmt = this._db.prepare('SELECT COUNT(*) as count FROM commands WHERE category = ?')
    const result = checkStmt.get(category) as { count: number }

    if (result.count === 0) {
      throw new Error('Category not found')
    }

    // 删除该分类下的所有命令
    const deleteStmt = this._db.prepare('DELETE FROM commands WHERE category = ?')
    deleteStmt.run(category)
  }

  public getCategoryCommandCount(category: string): number {
    if (!this._db) {
      throw new Error('Database not connected')
    }

    const stmt = this._db.prepare('SELECT COUNT(*) as count FROM commands WHERE category = ?')
    const result = stmt.get(category) as { count: number }
    return result.count
  }
}
