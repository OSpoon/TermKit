import type { DepCmdTreeItem } from './provider'
import { defineExtension } from 'reactive-vscode'
import * as vscode from 'vscode'
import { CommandManager } from './manager'
import { DepCmdProvider } from './provider'

const { activate, deactivate } = defineExtension((context: vscode.ExtensionContext) => {
  // Initialize command manager
  const commandManager = CommandManager.getInstance(context)

  // Create the tree data provider
  const depCmdProvider = new DepCmdProvider(commandManager)

  // Register the tree view
  const treeView = vscode.window.createTreeView('depCmdView', {
    treeDataProvider: depCmdProvider,
    showCollapseAll: true,
  })

  // Initialize commands and ensure tree view is populated
  async function initializeCommands() {
    try {
      await commandManager.loadCommands()

      // If no commands exist in any category, they will be automatically initialized from database
      const allCommands = await commandManager.getAllCommands()
      if (allCommands.length === 0) {
        console.warn('No existing commands found, database should have been initialized with defaults...')
      }

      // Always refresh the tree view after initialization
      depCmdProvider.refresh(true) // Skip reload since we just loaded/initialized
    }
    catch (error) {
      console.error('Failed to initialize commands:', error)
      vscode.window.showErrorMessage(`Failed to initialize commands: ${error}`)
    }
  }

  // Call initialization immediately
  initializeCommands()

  // Register refresh command - reloads data from database
  const refreshCommand = vscode.commands.registerCommand('depCmd.refreshView', async () => {
    try {
      await commandManager.reloadFromDatabase()
      depCmdProvider.refresh()
      vscode.window.showInformationMessage('Command memories reloaded from database!')
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to reload command memories: ${error}`)
      // Still refresh the view in case of partial success
      depCmdProvider.refresh()
    }
  })

  // Register show view command
  const showViewCommand = vscode.commands.registerCommand('depCmd.showView', () => {
    vscode.commands.executeCommand('depCmdView.focus')
  })

  // Register search commands
  const searchCommand = vscode.commands.registerCommand('depCmd.searchCommands', async () => {
    const allCommands = await commandManager.getAllCommands()
    const items = allCommands.map(cmd => ({
      label: cmd.label,
      description: cmd.command,
      detail: `${cmd.category.toUpperCase()} - ${cmd.description || ''}`,
      command: cmd.command,
    }))

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Search for commands...',
      matchOnDescription: true,
      matchOnDetail: true,
    })

    if (selected) {
      sendCommandToTerminal(selected.command)
    }
  })

  // Register send to terminal command
  const sendToTerminalCommand = vscode.commands.registerCommand('depCmd.sendToTerminal', (item: DepCmdTreeItem) => {
    const command = depCmdProvider.getCommandByTreeItem(item)
    if (command) {
      sendCommandToTerminal(command)
    }
    else {
      vscode.window.showWarningMessage('No command found for this item')
    }
  })

  // Register copy command
  const copyCommand = vscode.commands.registerCommand('depCmd.copyCommand', (item: DepCmdTreeItem) => {
    const command = depCmdProvider.getCommandByTreeItem(item)
    if (command) {
      vscode.env.clipboard.writeText(command)
      const config = vscode.workspace.getConfiguration('depCmd')
      const showNotifications = config.get<boolean>('showNotifications', true)

      if (showNotifications) {
        vscode.window.showInformationMessage(`Command copied to clipboard: ${command}`)
      }
    }
    else {
      vscode.window.showWarningMessage('No command found for this item')
    }
  })

  // Register edit command memories - opens database file for direct editing
  const editCommand = vscode.commands.registerCommand('depCmd.openCommandsFile', async () => {
    try {
      const filePath = commandManager.getDatabasePath()

      // Show information about the file location
      const result = await vscode.window.showInformationMessage(
        `Opening command data file for viewing. This is a JSON data file.`,
        { modal: false },
        'Show File Path',
        'Cancel',
      )

      if (result === 'Show File Path') {
        vscode.window.showInformationMessage(`Command database file location: ${filePath}`)
        // Also copy to clipboard
        await vscode.env.clipboard.writeText(filePath)
        vscode.window.showInformationMessage('File path copied to clipboard')
      }
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to open command database file: ${error}`)
    }
  })

  // Register edit individual command
  const editIndividualCommand = vscode.commands.registerCommand('depCmd.editCommand', async (item: DepCmdTreeItem) => {
    try {
      const commandObj = depCmdProvider.getCommandObjectByTreeItem(item)
      if (!commandObj.id) {
        vscode.window.showErrorMessage('Cannot edit command: missing command ID')
        return
      }

      // Get all commands to find the current one
      const allCommands = await commandManager.getAllCommands()
      const currentCommand = allCommands.find(cmd => cmd.id === commandObj.id)

      if (!currentCommand) {
        vscode.window.showErrorMessage('Command not found')
        return
      }

      // Show input boxes for editing
      const newLabel = await vscode.window.showInputBox({
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

      const newCommand = await vscode.window.showInputBox({
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

      const newDescription = await vscode.window.showInputBox({
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
      vscode.window.showInformationMessage('Command updated successfully!')
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to edit command: ${error}`)
    }
  })

  // Register delete command
  const deleteCommand = vscode.commands.registerCommand('depCmd.deleteCommand', async (item: DepCmdTreeItem) => {
    try {
      const commandObj = depCmdProvider.getCommandObjectByTreeItem(item)
      if (!commandObj.id) {
        vscode.window.showErrorMessage('Cannot delete command: missing command ID')
        return
      }

      // Confirm deletion
      const result = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the command "${item.label}"?`,
        { modal: true },
        'Delete',
        'Cancel',
      )

      if (result === 'Delete') {
        await commandManager.deleteCommand(commandObj.id)
        depCmdProvider.refresh()
        vscode.window.showInformationMessage('Command deleted successfully!')
      }
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to delete command: ${error}`)
    }
  })

  // Register add command
  const addCommand = vscode.commands.registerCommand('depCmd.addCommand', async () => {
    try {
      // Get available categories
      const categories = await commandManager.getAvailableCategories()

      // Get command details from user
      const label = await vscode.window.showInputBox({
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

      const command = await vscode.window.showInputBox({
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

      const description = await vscode.window.showInputBox({
        prompt: 'Enter command description (optional)',
      })

      if (description === undefined)
        return // User cancelled

      // Select category
      const categoryOptions = [
        ...categories,
        '$(add) Create new category...',
      ]

      const selectedCategory = await vscode.window.showQuickPick(categoryOptions, {
        placeHolder: 'Select a category for this command',
      })

      if (!selectedCategory)
        return // User cancelled

      let finalCategory: string
      if (selectedCategory === '$(add) Create new category...') {
        const newCategory = await vscode.window.showInputBox({
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
      vscode.window.showInformationMessage('Command added successfully!')
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to add command: ${error}`)
    }
  })

  // Register edit category command
  const editCategoryCommand = vscode.commands.registerCommand('depCmd.editCategory', async (item: DepCmdTreeItem) => {
    try {
      const categoryName = depCmdProvider.getCategoryByTreeItem(item)
      if (!categoryName) {
        vscode.window.showErrorMessage('Cannot edit category: category name not found')
        return
      }

      // Get current category count
      const commandCount = await commandManager.getCategoryCommandCount(categoryName)

      const newCategoryName = await vscode.window.showInputBox({
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
        vscode.window.showInformationMessage('Category name unchanged')
        return
      }

      // Update category
      await commandManager.updateCategory(categoryName, newCategoryName.toLowerCase())

      // Refresh the view
      depCmdProvider.refresh()
      vscode.window.showInformationMessage(`Category renamed from "${categoryName}" to "${newCategoryName.toLowerCase()}"`)
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to edit category: ${error}`)
    }
  })

  // Register delete category command
  const deleteCategoryCommand = vscode.commands.registerCommand('depCmd.deleteCategory', async (item: DepCmdTreeItem) => {
    try {
      const categoryName = depCmdProvider.getCategoryByTreeItem(item)
      if (!categoryName) {
        vscode.window.showErrorMessage('Cannot delete category: category name not found')
        return
      }

      // Get current category count
      const commandCount = await commandManager.getCategoryCommandCount(categoryName)

      // Confirm deletion
      const result = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the category "${categoryName}"? This will delete ${commandCount} command(s).`,
        { modal: true },
        'Delete',
        'Cancel',
      )

      if (result === 'Delete') {
        await commandManager.deleteCategory(categoryName)
        depCmdProvider.refresh()
        vscode.window.showInformationMessage(`Category "${categoryName}" and ${commandCount} command(s) deleted successfully!`)
      }
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to delete category: ${error}`)
    }
  })

  // Helper function to send command to terminal
  function sendCommandToTerminal(command: string) {
    try {
      const config = vscode.workspace.getConfiguration('depCmd')
      const autoExecute = config.get<boolean>('autoExecute', false)
      const showNotifications = config.get<boolean>('showNotifications', true)
      const terminalName = config.get<string>('terminalName', 'Development Commands')
      const clearTerminalLine = config.get<boolean>('clearTerminalLine', true)

      // Get or create a terminal
      let terminal = vscode.window.activeTerminal
      if (!terminal) {
        terminal = vscode.window.createTerminal(terminalName)
      }

      // Show the terminal
      terminal.show()

      if (clearTerminalLine) {
        terminal.sendText('\x03', false) // Send Ctrl+U (ASCII 21)
        // Send the command immediately since Ctrl+U doesn't need delay
        terminal.sendText(command, autoExecute)
      }
      else {
        // Send command directly without clearing
        terminal.sendText(command, autoExecute)
      }

      if (showNotifications) {
        const action = autoExecute ? 'executed' : 'sent to terminal'
        vscode.window.showInformationMessage(`Command ${action}: ${command}`)
      }
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to send command: ${error}`)
    }
  }

  // Register double-click handler for tree items
  treeView.onDidChangeSelection((e) => {
    if (e.selection.length > 0) {
      const item = e.selection[0]
      if (item.contextValue === 'command') {
        vscode.commands.executeCommand('depCmd.sendToTerminal', item)
      }
    }
  })

  // Add disposables to context
  context.subscriptions.push(
    treeView,
    refreshCommand,
    showViewCommand,
    searchCommand,
    sendToTerminalCommand,
    copyCommand,
    editCommand,
    editIndividualCommand,
    deleteCommand,
    addCommand,
    editCategoryCommand,
    deleteCategoryCommand,
  )
})

export { activate, deactivate }
