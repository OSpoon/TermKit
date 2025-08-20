import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'
import * as vscode from 'vscode'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

export interface UserCommand {
  label: string
  command: string
  description?: string
  category: string // Make this flexible
  icon?: string // VS Code ThemeIcon name for individual commands
}

export interface CommandsData {
  version: string
  commands: Record<string, UserCommand[]> // Dynamic structure
}

export class CommandManager {
  private static _instance: CommandManager
  private _commandsData: CommandsData
  private _commandsFilePath: string

  private constructor(context: vscode.ExtensionContext) {
    this._commandsFilePath = path.join(context.globalStorageUri.fsPath, 'commands.json')
    this._commandsData = {
      version: '1.0.0',
      commands: {}, // Start with empty dynamic structure
    }
  }

  public static getInstance(context?: vscode.ExtensionContext): CommandManager {
    if (!CommandManager._instance && context) {
      CommandManager._instance = new CommandManager(context)
    }
    return CommandManager._instance
  }

  public async loadCommands(): Promise<CommandsData> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this._commandsFilePath)
      await mkdir(dir, { recursive: true })

      // Try to read existing commands
      const data = await readFile(this._commandsFilePath, 'utf8')
      this._commandsData = JSON.parse(data)
      console.warn('Loaded user commands from:', this._commandsFilePath)
    }
    catch (error) {
      // File doesn't exist, keep default empty structure
      console.warn(`No existing commands file found, using default empty structure: ${error}`)
      // _commandsData is already initialized with empty structure in constructor
    }
    return this._commandsData
  }

  public async saveCommands(): Promise<void> {
    try {
      const dir = path.dirname(this._commandsFilePath)
      await mkdir(dir, { recursive: true })
      await writeFile(this._commandsFilePath, JSON.stringify(this._commandsData, null, 2), 'utf8')
      console.warn('Saved commands to:', this._commandsFilePath)
    }
    catch (error) {
      console.error('Failed to save commands:', error)
      throw new Error(`Failed to save commands: ${error}`)
    }
  }

  public getCommands(): CommandsData {
    return this._commandsData
  }

  public getAllCommands(): UserCommand[] {
    const allCommands: UserCommand[] = []
    Object.values(this._commandsData.commands).forEach((commands) => {
      allCommands.push(...commands)
    })
    return allCommands
  }

  public getCommandsByCategory(category: string): UserCommand[] {
    return this._commandsData.commands[category] || []
  }

  public getAvailableCategories(): string[] {
    return Object.keys(this._commandsData.commands).filter(key =>
      this._commandsData.commands[key].length > 0,
    ).sort()
  }

  public async initializeWithDefaults(defaultCommands: UserCommand[]): Promise<void> {
    // Group default commands by category dynamically
    const groupedCommands: Record<string, UserCommand[]> = {}

    defaultCommands.forEach((cmd) => {
      if (!groupedCommands[cmd.category]) {
        groupedCommands[cmd.category] = []
      }
      groupedCommands[cmd.category].push(cmd)
    })

    this._commandsData = {
      version: '1.0.0',
      commands: groupedCommands,
    }

    await this.saveCommands()
  }

  public getCommandsFilePath(): string {
    return this._commandsFilePath
  }

  public async openCommandsFile(): Promise<void> {
    try {
      const uri = vscode.Uri.file(this._commandsFilePath)
      await vscode.window.showTextDocument(uri)
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to open commands file: ${error}`)
    }
  }

  public async reloadFromFile(): Promise<void> {
    await this.loadCommands()
    console.warn('Commands reloaded from file')
  }
}
