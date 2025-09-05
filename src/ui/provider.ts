import type { CommandManager } from '@src/core/manager'
import { DependencyChecker } from '@src/core/checker'
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

export class TermKitTreeItem extends vscode.TreeItem {
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
      const validatedIcon = validateIcon(commandIcon, category)
      this.iconPath = new vscode.ThemeIcon(validatedIcon)
    }
    else {
      this.contextValue = 'category'
      this.categoryName = category
      // Use provided category icon or fallback with validation
      const validatedCategoryIcon = validateIcon(categoryIcon, category)
      this.iconPath = new vscode.ThemeIcon(validatedCategoryIcon)
    }
  }
}

export class TermKitProvider implements vscode.TreeDataProvider<TermKitTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TermKitTreeItem | undefined | null | void> = new vscode.EventEmitter<TermKitTreeItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<TermKitTreeItem | undefined | null | void> = this._onDidChangeTreeData.event
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

  getTreeItem(element: TermKitTreeItem): vscode.TreeItem {
    return element
  }

  async getChildren(element?: TermKitTreeItem): Promise<TermKitTreeItem[]> {
    const config = vscode.workspace.getConfiguration('termKit')
    const defaultCategory = config.get<string>('defaultCategory', 'all')

    if (!element) {
      // Root level - show categories
      if (defaultCategory === 'all') {
        // Show all categories with command counts
        const availableCategories = this.commandManager.getAvailableCategories()
        const categories: TermKitTreeItem[] = []

        // 批量检查依赖
        const dependencyChecker = DependencyChecker.getInstance()
        const dependencyResults = await dependencyChecker.checkMultipleDependencies(availableCategories)

        for (const category of availableCategories) {
          const commands = this.commandManager.getCommandsByCategory(category)

          // 只显示有命令且依赖检测通过的分类
          if (commands.length > 0 && dependencyResults[category]) {
            const categoryConfig = getCategoryConfig(this.commandManager, category)
            categories.push(new TermKitTreeItem(
              `${categoryConfig.displayName} (${commands.length})`,
              vscode.TreeItemCollapsibleState.Collapsed,
              undefined,
              category,
              undefined,
              undefined,
              undefined,
              categoryConfig.icon,
            ))
          }
        }

        return categories
      }
      else {
        // Show commands from the default category directly at root level
        // 检查默认分类的依赖
        const dependencyChecker = DependencyChecker.getInstance()
        const isDependencyAvailable = await dependencyChecker.checkCategoryDependency(defaultCategory)

        if (!isDependencyAvailable) {
          // 如果默认分类的依赖不可用，显示空或提示
          return []
        }

        const commands = this.commandManager.getCommandsByCategory(defaultCategory)

        return commands.map(command => new TermKitTreeItem(
          command.label,
          vscode.TreeItemCollapsibleState.None,
          command.command,
          command.category,
          command.icon,
          command.id,
          command.description,
        ))
      }
    }
    else {
      // Category level - show commands for the selected category
      const category = element.category
      if (category) {
        // 再次检查分类的依赖（可能已缓存）
        const dependencyChecker = DependencyChecker.getInstance()
        const isDependencyAvailable = await dependencyChecker.checkCategoryDependency(category)

        if (!isDependencyAvailable) {
          return []
        }

        const commands = this.commandManager.getCommandsByCategory(category)

        return commands.map(command => new TermKitTreeItem(
          command.label,
          vscode.TreeItemCollapsibleState.None,
          command.command,
          command.category,
          command.icon,
          command.id,
          command.description,
        ))
      }
    }

    return []
  }

  getCommandByTreeItem(item: TermKitTreeItem): string | undefined {
    return item.commandText
  }

  getCommandObjectByTreeItem(item: TermKitTreeItem): { id?: number, command?: string } {
    return {
      id: item.commandId,
      command: item.commandText,
    }
  }

  getCategoryByTreeItem(item: TermKitTreeItem): string | undefined {
    return item.categoryName
  }
}
