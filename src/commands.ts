import type { CommandManager } from './manager'
import type { DepCmdProvider, DepCmdTreeItem } from './provider'
import { useCommand } from 'reactive-vscode'
import { env, window, workspace } from 'vscode'
import * as meta from './generated/meta'
import { sendCommandToTerminal } from './utils'

export function useCommands(commandManager: CommandManager, depCmdProvider: DepCmdProvider) {
  useCommand(meta.commands.depCmdRefreshView, async () => {
    try {
      await commandManager.reloadFromDatabase()

      // 执行项目检测
      await commandManager.detectCurrentProject(true)
      const stats = await commandManager.getProjectStats()

      depCmdProvider.refresh()

      // 显示检测结果
      if (stats) {
        const projectTypes = stats.projectTypes.join(', ')
        const packageManagerInfo = stats.packageManager ? ` | Package Manager: ${stats.packageManager}` : ''
        const pythonManagerInfo = stats.pythonManager ? ` | Python Manager: ${stats.pythonManager}` : ''
        const gitInfo = stats.hasGit ? ' | Git: ✓' : ' | Git: ✗'
        const dockerInfo = stats.hasDocker ? ' | Docker: ✓' : ' | Docker: ✗'

        const message = `Refreshed! Project: ${projectTypes}${packageManagerInfo}${pythonManagerInfo}${gitInfo}${dockerInfo} | Categories: ${stats.supportedCategories}/${stats.totalCategories}`

        window.showInformationMessage(message)
      }
      else {
        window.showInformationMessage('Command memories reloaded! No project detected in current workspace')
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to refresh: ${error}`)
      // Still refresh the view in case of partial success
      depCmdProvider.refresh()
    }
  })

  useCommand(meta.commands.depCmdSearchCommands, async () => {
    const allCommands = await commandManager.getAllCommands()
    const items = allCommands.map(cmd => ({
      label: cmd.label,
      description: cmd.command,
      detail: `${cmd.category.toUpperCase()} - ${cmd.description || ''}`,
      command: cmd.command,
    }))

    const selected = await window.showQuickPick(items, {
      placeHolder: 'Search for commands...',
      matchOnDescription: true,
      matchOnDetail: true,
    })

    if (selected) {
      sendCommandToTerminal(selected.command)
    }
  })

  useCommand(meta.commands.depCmdSendToTerminal, async (item: DepCmdTreeItem) => {
    const command = depCmdProvider.getCommandByTreeItem(item)
    if (command) {
      sendCommandToTerminal(command)
    }
    else {
      window.showWarningMessage('No command found for this item')
    }
  })

  useCommand(meta.commands.depCmdCopyCommand, async (item: DepCmdTreeItem) => {
    const command = depCmdProvider.getCommandByTreeItem(item)
    if (command) {
      env.clipboard.writeText(command)
      const config = workspace.getConfiguration('depCmd')
      const showNotifications = config.get<boolean>('showNotifications', true)

      if (showNotifications) {
        window.showInformationMessage(`Command copied to clipboard: ${command}`)
      }
    }
    else {
      window.showWarningMessage('No command found for this item')
    }
  })

  useCommand(meta.commands.depCmdOpenCommandsFile, async () => {
    try {
      const filePath = commandManager.getDatabasePath()

      // Show information about the file location
      const result = await window.showInformationMessage(
        `Opening command data file for viewing. This is a JSON data file.`,
        { modal: false },
        'Show File Path',
        'Cancel',
      )

      if (result === 'Show File Path') {
        window.showInformationMessage(`Command database file location: ${filePath}`)
        // Also copy to clipboard
        await env.clipboard.writeText(filePath)
        window.showInformationMessage('File path copied to clipboard')
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to open command database file: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdEditCommand, async (item: DepCmdTreeItem) => {
    try {
      const commandObj = depCmdProvider.getCommandObjectByTreeItem(item)
      if (!commandObj.id) {
        window.showErrorMessage('Cannot edit command: missing command ID')
        return
      }

      // Get all commands to find the current one
      const allCommands = await commandManager.getAllCommands()
      const currentCommand = allCommands.find(cmd => cmd.id === commandObj.id)

      if (!currentCommand) {
        window.showErrorMessage('Command not found')
        return
      }

      // Show input boxes for editing
      const newLabel = await window.showInputBox({
        prompt: 'Enter command label',
        value: currentCommand.label,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Label cannot be empty'
          }
          return null
        },
      })

      if (newLabel === undefined)
        return // User cancelled

      const newCommand = await window.showInputBox({
        prompt: 'Enter command',
        value: currentCommand.command,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Command cannot be empty'
          }
          return null
        },
      })

      if (newCommand === undefined)
        return // User cancelled

      const newDescription = await window.showInputBox({
        prompt: 'Enter command description (optional)',
        value: currentCommand.description || '',
      })

      if (newDescription === undefined)
        return // User cancelled

      // Update the command
      await commandManager.updateCommand(commandObj.id, {
        label: newLabel,
        command: newCommand,
        description: newDescription || undefined,
      })

      // Refresh the view
      depCmdProvider.refresh()
      window.showInformationMessage('Command updated successfully!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to edit command: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdDeleteCommand, async (item: DepCmdTreeItem) => {
    try {
      const commandObj = depCmdProvider.getCommandObjectByTreeItem(item)
      if (!commandObj.id) {
        window.showErrorMessage('Cannot delete command: missing command ID')
        return
      }

      // Confirm deletion
      const result = await window.showWarningMessage(
        `Are you sure you want to delete the command "${item.label}"?`,
        { modal: true },
        'Delete',
        'Cancel',
      )

      if (result === 'Delete') {
        await commandManager.deleteCommand(commandObj.id)
        depCmdProvider.refresh()
        window.showInformationMessage('Command deleted successfully!')
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to delete command: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdAddCommand, async () => {
    try {
      // Get available categories
      const categories = await commandManager.getAvailableCategories()

      // Get command details from user
      const label = await window.showInputBox({
        prompt: 'Enter command label',
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Label cannot be empty'
          }
          return null
        },
      })

      if (label === undefined)
        return // User cancelled

      const command = await window.showInputBox({
        prompt: 'Enter command',
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Command cannot be empty'
          }
          return null
        },
      })

      if (command === undefined)
        return // User cancelled

      const description = await window.showInputBox({
        prompt: 'Enter command description (optional)',
      })

      if (description === undefined)
        return // User cancelled

      // Select category
      const categoryOptions = [
        ...categories,
        '$(add) Create new category...',
      ]

      const selectedCategory = await window.showQuickPick(categoryOptions, {
        placeHolder: 'Select a category for this command',
      })

      if (!selectedCategory)
        return // User cancelled

      let finalCategory: string
      if (selectedCategory === '$(add) Create new category...') {
        const newCategory = await window.showInputBox({
          prompt: 'Enter new category name',
          validateInput: (value) => {
            if (!value.trim()) {
              return 'Category name cannot be empty'
            }
            if (categories.includes(value.toLowerCase())) {
              return 'Category already exists'
            }
            return null
          },
        })

        if (!newCategory)
          return // User cancelled
        finalCategory = newCategory.toLowerCase()
      }
      else {
        finalCategory = selectedCategory
      }

      // Add the command
      await commandManager.addCommand({
        label,
        command,
        description: description || undefined,
        category: finalCategory,
      })

      // Refresh the view
      depCmdProvider.refresh()
      window.showInformationMessage('Command added successfully!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to add command: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdEditCategory, async (item: DepCmdTreeItem) => {
    try {
      const categoryName = depCmdProvider.getCategoryByTreeItem(item)
      if (!categoryName) {
        window.showErrorMessage('Cannot edit category: category name not found')
        return
      }

      // Get current category count
      const commandCount = await commandManager.getCategoryCommandCount(categoryName)

      const newCategoryName = await window.showInputBox({
        prompt: `Rename category "${categoryName}" (contains ${commandCount} commands)`,
        value: categoryName,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Category name cannot be empty'
          }
          if (value.toLowerCase() === categoryName.toLowerCase()) {
            return null // Same name is OK
          }
          // Check if new name already exists
          return null // For now, allow duplicates
        },
      })

      if (newCategoryName === undefined) {
        return // User cancelled
      }

      if (newCategoryName.toLowerCase() === categoryName.toLowerCase()) {
        window.showInformationMessage('Category name unchanged')
        return
      }

      // Update category
      await commandManager.updateCategory(categoryName, newCategoryName.toLowerCase())

      // Refresh the view
      depCmdProvider.refresh()
      window.showInformationMessage(`Category renamed from "${categoryName}" to "${newCategoryName.toLowerCase()}"`)
    }
    catch (error) {
      window.showErrorMessage(`Failed to edit category: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdDeleteCategory, async (item: DepCmdTreeItem) => {
    try {
      const categoryName = depCmdProvider.getCategoryByTreeItem(item)
      if (!categoryName) {
        window.showErrorMessage('Cannot delete category: category name not found')
        return
      }

      // Get current category count
      const commandCount = await commandManager.getCategoryCommandCount(categoryName)

      // Confirm deletion
      const result = await window.showWarningMessage(
        `Are you sure you want to delete the category "${categoryName}"? This will delete ${commandCount} command(s).`,
        { modal: true },
        'Delete',
        'Cancel',
      )

      if (result === 'Delete') {
        await commandManager.deleteCategory(categoryName)
        depCmdProvider.refresh()
        window.showInformationMessage(`Category "${categoryName}" and ${commandCount} command(s) deleted successfully!`)
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to delete category: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdShowProjectInfo, async () => {
    try {
      const stats = await commandManager.getProjectStats()

      if (stats) {
        const packageManagerInfo = stats.packageManager || 'None'
        const pythonManagerInfo = stats.pythonManager || 'None'

        // 创建一个信息面板
        const panel = window.createWebviewPanel(
          'projectInfo',
          'Project Information',
          { viewColumn: 1, preserveFocus: true },
          {},
        )

        panel.webview.html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Project Information</title>
            <style>
              body { 
                font-family: var(--vscode-font-family); 
                padding: 20px; 
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
              }
              .info-section { margin-bottom: 15px; }
              .info-label { font-weight: bold; color: var(--vscode-textLink-foreground); }
              .info-value { margin-left: 10px; }
              .supported { color: var(--vscode-testing-iconPassed); }
              .unsupported { color: var(--vscode-testing-iconFailed); }
              ul { margin: 5px 0; padding-left: 20px; }
            </style>
          </head>
          <body>
            <h2>🔍 Project Detection Results</h2>
            <div class="info-section">
              <span class="info-label">Project Types:</span>
              <span class="info-value">${stats.projectTypes.join(', ')}</span>
            </div>
            <div class="info-section">
              <span class="info-label">Package Manager:</span>
              <span class="info-value">${packageManagerInfo}</span>
            </div>
            <div class="info-section">
              <span class="info-label">Python Manager:</span>
              <span class="info-value">${pythonManagerInfo}</span>
            </div>
            <div class="info-section">
              <span class="info-label">Git Repository:</span>
              <span class="info-value ${stats.hasGit ? 'supported' : 'unsupported'}">${stats.hasGit ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-section">
              <span class="info-label">Docker Support:</span>
              <span class="info-value ${stats.hasDocker ? 'supported' : 'unsupported'}">${stats.hasDocker ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-section">
              <span class="info-label">Supported Categories:</span>
              <span class="info-value supported">${stats.supportedCategories}/${stats.totalCategories}</span>
            </div>
            ${stats.unsupportedCategories.length > 0
              ? `
            <div class="info-section">
              <span class="info-label">Unsupported Categories:</span>
              <ul>
                ${stats.unsupportedCategories.map(cat => `<li class="unsupported">${cat}</li>`).join('')}
              </ul>
            </div>
            `
              : ''}
          </body>
          </html>
        `
      }
      else {
        window.showWarningMessage('No project information available')
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to show project info: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdToggleProjectDetection, async () => {
    try {
      const config = workspace.getConfiguration('depCmd')
      const currentValue = config.get<boolean>('enableProjectDetection', true)
      await config.update('enableProjectDetection', !currentValue, true)

      const newStatus = !currentValue ? 'enabled' : 'disabled'
      window.showInformationMessage(`Project detection ${newStatus}`)

      // 刷新视图以应用新设置
      depCmdProvider.refresh()
    }
    catch (error) {
      window.showErrorMessage(`Failed to toggle project detection: ${error}`)
    }
  })
}
