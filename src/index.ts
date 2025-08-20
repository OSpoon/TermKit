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
        `Opening command database file for viewing. This is a SQLite database file.`,
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
        // Send Ctrl+U to clear the current line (this only clears if there's text)
        // Ctrl+U clears from cursor to beginning of line, which is better than Ctrl+C
        // because it doesn't interrupt running processes and only clears text input
        terminal.sendText('\x15', false) // Send Ctrl+U (ASCII 21)

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
  )
})

export { activate, deactivate }
