import type { CommandManager } from '@src/core/manager'
import { logger } from '@src/utils'
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

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    commandText?: string,
    public readonly category?: string,
    public readonly commandIcon?: string,
    commandId?: number,
    commandDescription?: string,
    categoryIcon?: string,
  ) {
    super(label, collapsibleState)

    this.commandText = commandText
    this.commandId = commandId

    if (commandText) {
      // Use the actual description if available, otherwise fall back to command text
      this.description = commandText || commandDescription
      this.tooltip = `${commandText}${commandDescription ? `\n${commandDescription}` : ''}\n\nClick to send to terminal`
      this.contextValue = 'command'
      // Use command-specific icon if available, otherwise use terminal icon
      this.iconPath = new vscode.ThemeIcon(commandIcon || 'terminal')
    }
    else {
      this.contextValue = 'category'
      this.categoryName = category
      // Use provided category icon or fallback
      this.iconPath = new vscode.ThemeIcon(categoryIcon || 'gear')
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
    const sortCommands = config.get<boolean>('sortCommands', false)
    const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

    if (!element) {
      // Root level - show categories dynamically
      const categories: DepCmdTreeItem[] = []

      // 根据配置决定是否使用项目检测过滤
      let availableCategories: string[]
      if (enableProjectDetection) {
        availableCategories = await this.commandManager.getFilteredCategories()
      }
      else {
        availableCategories = await this.commandManager.getAvailableCategories()
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
            categories.push(new DepCmdTreeItem(
              `${categoryConfig.displayName} (${commands.length})`,
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              category,
              undefined,
              undefined,
              undefined,
              categoryConfig.icon,
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
      const categoryDisplayName = labelMatch ? labelMatch[1] : element.category || 'custom'
      const category = element.category || categoryDisplayName.toLowerCase()

      let commands: any[]
      if (enableProjectDetection) {
        commands = await this.commandManager.getFilteredCommandsByCategory(category)
      }
      else {
        commands = await this.commandManager.getCommandsByCategory(category)
      }

      if (sortCommands) {
        commands = [...commands].sort((a, b) => a.label.localeCompare(b.label))
      }

      return commands.map(cmd => new DepCmdTreeItem(
        cmd.label,
        vscode.TreeItemCollapsibleState.None,
        cmd.command,
        cmd.category,
        cmd.icon,
        cmd.id,
        cmd.description,
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
