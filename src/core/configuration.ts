import type {
  CategoryDefinition,
  CommandDefinition,
  ConfigSchema,
  ProjectTypeDefinition,
} from '../types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { promisify } from 'node:util'
import * as vscode from 'vscode'

const readFile = promisify(fs.readFile)
const access = promisify(fs.access)

/**
 * 通用配置管理器
 */
export class ConfigManager {
  private static _instance: ConfigManager
  private _config: ConfigSchema | null = null
  private _userConfig: Partial<ConfigSchema> | null = null
  private _customFunctions: Map<string, (...args: any[]) => any> = new Map()
  private _extensionContext: vscode.ExtensionContext | null = null

  private constructor(context?: vscode.ExtensionContext) {
    this._extensionContext = context || null
  }

  public static getInstance(context?: vscode.ExtensionContext): ConfigManager {
    if (!ConfigManager._instance) {
      ConfigManager._instance = new ConfigManager(context)
    }
    else if (context && !ConfigManager._instance._extensionContext) {
      ConfigManager._instance._extensionContext = context
    }
    return ConfigManager._instance
  }

  /**
   * 加载配置
   */
  public async loadConfig(): Promise<void> {
    // 加载默认配置
    await this.loadDefaultConfig()

    // 加载用户自定义配置
    await this.loadUserConfig()

    // 合并配置
    this.mergeConfigs()

    // 注册自定义函数
    this.registerCustomFunctions()
  }

  /**
   * 加载默认配置
   */
  private async loadDefaultConfig(): Promise<void> {
    try {
      let defaultConfigPath: string

      if (this._extensionContext) {
        // 使用扩展上下文获取正确的资源路径
        defaultConfigPath = path.join(this._extensionContext.extensionPath, 'config', 'config.json')
      }
      else {
        // 备用路径
        defaultConfigPath = path.join(__dirname, '../../config/config.json')
      }

      console.warn(`Loading default config from: ${defaultConfigPath}`)

      // 检查文件是否存在
      try {
        await access(defaultConfigPath)
      }
      catch {
        // 如果第一个路径不存在，尝试其他可能的路径
        const alternativePath = path.join(process.cwd(), 'config/config.json')
        console.warn(`First path failed, trying: ${alternativePath}`)
        await access(alternativePath)
        // 如果alternative路径存在，更新路径
        const configContent = await readFile(alternativePath, 'utf-8')
        this._config = JSON.parse(configContent)
        console.warn(`Config loaded from alternative path. Categories: ${this._config?.categories?.length || 0}, ProjectTypes: ${this._config?.projectTypes?.length || 0}`)
        return
      }

      const configContent = await readFile(defaultConfigPath, 'utf-8')
      this._config = JSON.parse(configContent)
      console.warn(`Default config loaded successfully. Categories: ${this._config?.categories?.length || 0}, ProjectTypes: ${this._config?.projectTypes?.length || 0}`)
    }
    catch (error) {
      console.warn(`Failed to load default config: ${error}`, 'using fallback')
      this._config = this.getFallbackConfig()
    }
  }

  /**
   * 加载用户配置
   */
  private async loadUserConfig(): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0)
        return

      const workspaceRoot = workspaceFolders[0].uri.fsPath
      const userConfigPath = path.join(workspaceRoot, '.depCmd', 'config.json')

      await access(userConfigPath)
      const configContent = await readFile(userConfigPath, 'utf-8')
      this._userConfig = JSON.parse(configContent)
    }
    catch (error) {
      console.error(error)
      // 用户配置不存在或无效，使用VS Code设置
      this.loadVSCodeConfig()
    }
  }

  /**
   * 从VS Code设置加载配置
   */
  private loadVSCodeConfig(): void {
    const config = vscode.workspace.getConfiguration('depCmd')
    const customProjectConfigs = config.get<any[]>('customProjectConfigs', [])

    if (customProjectConfigs.length > 0) {
      this._userConfig = {
        projectTypes: customProjectConfigs,
      }
    }
  }

  /**
   * 合并配置
   */
  private mergeConfigs(): void {
    if (!this._config)
      return

    if (this._userConfig) {
      // 合并项目类型
      if (this._userConfig.projectTypes) {
        const userTypes = new Map(this._userConfig.projectTypes.map(pt => [pt.id, pt]))
        this._config.projectTypes = this._config.projectTypes.map(pt =>
          userTypes.has(pt.id) ? { ...pt, ...userTypes.get(pt.id) } : pt,
        )

        // 添加新的项目类型
        this._userConfig.projectTypes.forEach((pt) => {
          if (!this._config!.projectTypes.find(existing => existing.id === pt.id)) {
            this._config!.projectTypes.push(pt)
          }
        })
      }

      // 合并类别
      if (this._userConfig.categories) {
        const userCategories = new Map(this._userConfig.categories.map(cat => [cat.id, cat]))
        this._config.categories = this._config.categories.map(cat =>
          userCategories.has(cat.id) ? { ...cat, ...userCategories.get(cat.id) } : cat,
        )

        // 添加新的类别
        this._userConfig.categories.forEach((cat) => {
          if (!this._config!.categories.find(existing => existing.id === cat.id)) {
            this._config!.categories.push(cat)
          }
        })
      }

      // 合并命令
      if (this._userConfig.commands) {
        this._config.commands = [...(this._config.commands || []), ...this._userConfig.commands]
      }

      // 合并自定义函数
      if (this._userConfig.customFunctions) {
        this._config.customFunctions = {
          ...(this._config.customFunctions || {}),
          ...this._userConfig.customFunctions,
        }
      }
    }
  }

  /**
   * 注册自定义函数
   */
  private registerCustomFunctions(): void {
    if (!this._config?.customFunctions)
      return

    for (const [name, functionCode] of Object.entries(this._config.customFunctions)) {
      try {
        // 创建安全的函数包装器，避免使用 Function 构造器
        const func = this.createSafeFunction(functionCode)
        this._customFunctions.set(name, func)
      }
      catch (error) {
        console.warn(`Failed to register custom function ${name}:`, error)
      }
    }
  }

  /**
   * 创建安全的函数（替代 Function 构造器）
   */
  private createSafeFunction(_functionCode: string): (...args: any[]) => any {
    // 在实际实现中，这里应该使用更安全的方式来执行用户代码
    // 比如使用 vm 模块或者预定义的函数库
    console.warn('Custom functions are not implemented in safe mode')
    return () => false
  }

  /**
   * 获取项目类型定义
   */
  public getProjectTypes(): ProjectTypeDefinition[] {
    return this._config?.projectTypes || []
  }

  /**
   * 获取类别定义
   */
  public getCategories(): CategoryDefinition[] {
    return this._config?.categories || []
  }

  /**
   * 获取命令定义
   */
  public getCommands(): CommandDefinition[] {
    return this._config?.commands || []
  }

  /**
   * 获取项目类型定义
   */
  public getProjectType(id: string): ProjectTypeDefinition | undefined {
    return this._config?.projectTypes.find(pt => pt.id === id || pt.aliases?.includes(id))
  }

  /**
   * 获取类别定义
   */
  public getCategory(id: string): CategoryDefinition | undefined {
    return this._config?.categories.find(cat => cat.id === id)
  }

  /**
   * 执行自定义函数
   */
  public async executeCustomFunction(name: string, workspaceRoot: string): Promise<boolean> {
    const func = this._customFunctions.get(name)
    if (!func) {
      console.warn(`Custom function ${name} not found`)
      return false
    }

    try {
      return await func(workspaceRoot, vscode, fs, path)
    }
    catch (error) {
      console.warn(`Error executing custom function ${name}:`, error)
      return false
    }
  }

  /**
   * 创建用户配置目录和示例文件
   */
  public async createUserConfigTemplate(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0)
      return

    const workspaceRoot = workspaceFolders[0].uri.fsPath
    const configDir = path.join(workspaceRoot, '.depCmd')
    const configPath = path.join(configDir, 'config.json')

    try {
      // 创建目录
      await fs.promises.mkdir(configDir, { recursive: true })

      // 创建示例配置文件
      const exampleConfig: Partial<ConfigSchema> = {
        version: '1.0.0',
        projectTypes: [
          {
            id: 'my-framework',
            displayName: 'My Custom Framework',
            priority: 100,
            detectionRules: [
              {
                name: 'framework-config',
                type: 'file_exists',
                target: 'my-framework.config.js',
                weight: 100,
                required: true,
              },
            ],
            packageManagers: [
              {
                id: 'my-pm',
                displayName: 'My Package Manager',
                detectionRules: [
                  {
                    name: 'my-lock',
                    type: 'file_exists',
                    target: 'my.lock',
                    weight: 100,
                  },
                ],
              },
            ],
          },
        ],
        categories: [
          {
            id: 'my-category',
            displayName: 'My Commands',
            icon: 'gear',
            supportedProjectTypes: ['my-framework'],
          },
        ],
        commands: [
          {
            label: 'My Build',
            command: 'my-framework build',
            description: 'Build with my framework',
            category: 'my-category',
            icon: 'tools',
          },
        ],
      }

      await fs.promises.writeFile(configPath, JSON.stringify(exampleConfig, null, 2))

      vscode.window.showInformationMessage(
        `Created config template at ${configPath}`,
        'Open Config',
      ).then((selection) => {
        if (selection === 'Open Config') {
          vscode.window.showTextDocument(vscode.Uri.file(configPath))
        }
      })
    }
    catch (error) {
      console.error('Failed to create user config template:', error)
    }
  }

  /**
   * 获取后备配置
   */
  private getFallbackConfig(): ConfigSchema {
    return {
      version: '1.0.0',
      projectTypes: [
        {
          id: 'generic',
          displayName: 'Generic Project',
          detectionRules: [
            {
              name: 'any-file',
              type: 'custom',
              target: '*',
              weight: 1,
            },
          ],
        },
      ],
      categories: [
        {
          id: 'general',
          displayName: 'General',
          icon: 'gear',
          supportedProjectTypes: '*',
        },
      ],
      commands: [],
    }
  }

  /**
   * 重新加载配置
   */
  public async reloadConfig(): Promise<void> {
    this._config = null
    this._userConfig = null
    this._customFunctions.clear()
    await this.loadConfig()
  }

  /**
   * 验证配置
   */
  public validateConfig(config: Partial<ConfigSchema>): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    // 验证项目类型
    if (config.projectTypes) {
      for (const pt of config.projectTypes) {
        if (!pt.id)
          errors.push('Project type missing id')
        if (!pt.displayName)
          errors.push(`Project type ${pt.id} missing displayName`)
        if (!pt.detectionRules || pt.detectionRules.length === 0) {
          errors.push(`Project type ${pt.id} missing detection rules`)
        }
      }
    }

    // 验证类别
    if (config.categories) {
      for (const cat of config.categories) {
        if (!cat.id)
          errors.push('Category missing id')
        if (!cat.displayName)
          errors.push(`Category ${cat.id} missing displayName`)
      }
    }

    return { valid: errors.length === 0, errors }
  }
}
