import type { CommandManager } from './manager'
import * as vscode from 'vscode'
import { getCategoryConfig } from './commands/index'

export class DepCmdTreeItem extends vscode.TreeItem {
  public readonly commandText?: string

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    commandText?: string,
    public readonly category?: string,
    public readonly commandIcon?: string,
  ) {
    super(label, collapsibleState)

    this.commandText = commandText

    if (commandText) {
      this.tooltip = `${commandText}\n\nClick to send to terminal`
      this.description = commandText
      this.contextValue = 'command'
      // Use command-specific icon if available, otherwise use terminal icon
      this.iconPath = new vscode.ThemeIcon(commandIcon || 'terminal')
    }
    else {
      this.contextValue = 'category'
      // Use category configuration for icons
      if (category) {
        const categoryConfig = getCategoryConfig(category)
        this.iconPath = new vscode.ThemeIcon(categoryConfig.icon)
      }
      else {
        // Fallback to default icon
        this.iconPath = new vscode.ThemeIcon('gear')
      }
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
      // Just refresh the tree view without reloading from file
      this._onDidChangeTreeData.fire()
    }
    else {
      // Reload commands from file and refresh tree
      this.commandManager.reloadFromFile().then(() => {
        this._onDidChangeTreeData.fire()
      }).catch((error) => {
        console.error('Failed to reload commands:', error)
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

    if (!element) {
      // Root level - show categories dynamically
      const categories: DepCmdTreeItem[] = []
      const availableCategories = this.commandManager.getAvailableCategories()

      availableCategories.forEach((category) => {
        if (defaultCategory === 'all' || defaultCategory === category) {
          const commands = this.commandManager.getCommandsByCategory(category)
          if (commands.length > 0) {
            const categoryConfig = getCategoryConfig(category)
            categories.push(new DepCmdTreeItem(
              `${categoryConfig.displayName} Commands (${commands.length})`,
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              category,
            ))
          }
        }
      })

      return categories
    }
    else {
      // Category level - show commands
      // Extract category from the label dynamically
      const labelMatch = element.label.match(/^(.+?) Commands \(\d+\)$/)
      const categoryDisplayName = labelMatch ? labelMatch[1] : element.category || 'custom'
      const category = element.category || categoryDisplayName.toLowerCase()

      let commands = this.commandManager.getCommandsByCategory(category)

      if (sortCommands) {
        commands = [...commands].sort((a, b) => a.label.localeCompare(b.label))
      }

      return commands.map(cmd => new DepCmdTreeItem(
        cmd.label,
        vscode.TreeItemCollapsibleState.None,
        cmd.command,
        cmd.category,
        cmd.icon,
      ))
    }
  }

  getCommandByTreeItem(item: DepCmdTreeItem): string | undefined {
    return item.commandText
  }
}
