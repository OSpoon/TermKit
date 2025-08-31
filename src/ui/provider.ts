import type { CommandManager } from '@src/core/manager'
import { logger, validateIcon } from '@src/utils'
import * as vscode from 'vscode'

function getCategoryConfig(commandManager: CommandManager, category: string): { displayName: string, icon: string } {
  const categoryInfo = commandManager.getCategoryDisplayInfo(category)
  if (categoryInfo) {
    return categoryInfo
  }

  // 后备方案
  return {
    displayName: category.charAt(0).toUpperCase() + category.slice(1),
    icon: 'gear',
  }
}

export class DepCmdTreeItem extends vscode.TreeItem {
  public readonly commandText?: string
  public readonly commandId?: number
  public readonly categoryName?: string
  public readonly isProjectScript?: boolean

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    commandText?: string,
    public readonly category?: string,
    public readonly commandIcon?: string,
    commandId?: number,
    commandDescription?: string,
    categoryIcon?: string,
    isProjectScript?: boolean,
    isDetectedCategory?: boolean, // 新增参数：是否是检测到的分类
  ) {
    super(label, collapsibleState)

    this.commandText = commandText
    this.commandId = commandId
    this.isProjectScript = isProjectScript

    if (commandText) {
      // Use the actual description if available, otherwise fall back to command text
      this.description = commandText || commandDescription
      this.tooltip = `${commandText}${commandDescription ? `\n${commandDescription}` : ''}${isProjectScript ? '\n\n🔧 Project Script' : ''}\n\nClick to send to terminal`
      // 项目脚本使用不同的 contextValue，不显示编辑删除按钮
      this.contextValue = isProjectScript ? 'project-script' : 'command'
      // Use command-specific icon if available, otherwise use terminal icon
      // Use a different icon for project scripts
      const validatedIcon = validateIcon(isProjectScript ? 'package' : commandIcon, category)
      this.iconPath = new vscode.ThemeIcon(validatedIcon)
    }
    else {
      // 区分检测到的分类和用户自定义分类
      this.contextValue = isDetectedCategory ? 'detected-category' : 'category'
      this.categoryName = category
      // Use provided category icon or fallback with validation
      const validatedCategoryIcon = validateIcon(categoryIcon, category)
      this.iconPath = new vscode.ThemeIcon(validatedCategoryIcon)
    }
  }
}

export class DepCmdProvider implements vscode.TreeDataProvider<DepCmdTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DepCmdTreeItem | undefined | null | void> = new vscode.EventEmitter<DepCmdTreeItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<DepCmdTreeItem | undefined | null | void> = this._onDidChangeTreeData.event
  private commandManager: CommandManager

  constructor(commandManager: CommandManager) {
    this.commandManager = commandManager
  }

  refresh(skipReload: boolean = false): void {
    if (skipReload) {
      // Just refresh the tree view without reloading from database
      this._onDidChangeTreeData.fire()
    }
    else {
      // Reload commands from database and refresh tree
      this.commandManager.reloadFromDatabase().then(() => {
        this._onDidChangeTreeData.fire()
      }).catch((error) => {
        logger.error('Failed to reload commands:', error)
        // Still fire the event to show whatever data we have
        this._onDidChangeTreeData.fire()
      })
    }
  }

  getTreeItem(element: DepCmdTreeItem): vscode.TreeItem {
    return element
  }

  async getChildren(element?: DepCmdTreeItem): Promise<DepCmdTreeItem[]> {
    const config = vscode.workspace.getConfiguration('depCmd')
    const defaultCategory = config.get<string>('defaultCategory', 'all')
    const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

    if (!element) {
      // Root level - show categories dynamically
      const categories: DepCmdTreeItem[] = []

        // 首先检查项目脚本，如果有的话显示在最前面
        if (this.commandManager.hasProjectScripts()) {
          const projectScripts = this.commandManager.getProjectScripts()
          categories.push(new DepCmdTreeItem(
            `Project (${projectScripts.length})`,
            vscode.TreeItemCollapsibleState.Expanded, // Project 分组默认展开
            undefined,
            'project',
            undefined,
            undefined,
            undefined,
            'folder-opened', // 使用文件夹图标
            false, // isProjectScript
            true, // 项目脚本分类也是检测生成的，不应该有编辑按钮
          ))
        }      // 根据配置决定是否使用项目检测过滤
      let availableCategories: string[]
      if (enableProjectDetection) {
        availableCategories = await this.commandManager.getFilteredCategories()
      }
      else {
        // 项目检测禁用时显示所有分类
        availableCategories = this.commandManager.getAvailableCategories()
      }

      for (const category of availableCategories) {
        if (defaultCategory === 'all' || defaultCategory === category) {
          let commands: any[]
          if (enableProjectDetection) {
            commands = await this.commandManager.getFilteredCommandsByCategory(category)
          }
          else {
            commands = await this.commandManager.getCommandsByCategory(category)
          }

          if (commands.length > 0) {
            const categoryConfig = getCategoryConfig(this.commandManager, category)
            const isDetectedCategory = this.commandManager.isDetectedCategory(category)
            categories.push(new DepCmdTreeItem(
              `${categoryConfig.displayName} (${commands.length})`,
              vscode.TreeItemCollapsibleState.Collapsed, // 其他分组默认折叠
              undefined,
              category,
              undefined,
              undefined,
              undefined,
              categoryConfig.icon,
              false, // isProjectScript
              isDetectedCategory, // 传入是否为检测到的分类
            ))
          }
        }
      }

      return categories
    }
    else {
      // Category level - show commands
      // Extract category from the label dynamically
      const labelMatch = element.label.match(/^(.+?) \(\d+\)$/)
      const categoryDisplayName = labelMatch ? labelMatch[1] : element.category || 'other'
      const category = element.category || categoryDisplayName.toLowerCase()

      // 如果是 project 分类，显示项目脚本
      if (category === 'project') {
        const projectScripts = this.commandManager.getProjectScripts()
        const packageManager = this.commandManager.getPackageManager() || 'npm'

        return projectScripts.map(script => new DepCmdTreeItem(
          script.name,
          vscode.TreeItemCollapsibleState.None,
          script.command,
          'project',
          'package',
          undefined, // 项目脚本没有数据库ID
          `Project script using ${packageManager}: ${script.command}`,
          undefined,
          true, // 是项目脚本
          false, // isDetectedCategory - 对于命令项不适用
        ))
      }

      // 其他分类显示常规命令
      let commands: any[]
      if (enableProjectDetection) {
        commands = await this.commandManager.getFilteredCommandsByCategory(category)
      }
      else {
        commands = await this.commandManager.getCommandsByCategory(category)
      }

      return commands.map(cmd => new DepCmdTreeItem(
        cmd.label,
        vscode.TreeItemCollapsibleState.None,
        cmd.command,
        cmd.category,
        cmd.icon,
        cmd.id,
        cmd.description,
        undefined,
        false, // 不是项目脚本
        false, // isDetectedCategory - 对于命令项不适用
      ))
    }
  }

  getCommandByTreeItem(item: DepCmdTreeItem): string | undefined {
    return item.commandText
  }

  getCommandObjectByTreeItem(item: DepCmdTreeItem): { id?: number, command?: string } {
    return {
      id: item.commandId,
      command: item.commandText,
    }
  }

  getCategoryByTreeItem(item: DepCmdTreeItem): string | undefined {
    return item.categoryName
  }
}
