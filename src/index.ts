import type { ExtensionContext } from 'vscode'
import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { version } from '../package.json'
import { useCommands } from './commands'
import { CommandManager } from './manager'
import { DepCmdProvider } from './provider'
import { logger } from './utils'

const { activate, deactivate } = defineExtension(async (context: ExtensionContext) => {
  logger.info(`DepCmd Activated, v${version}`)

  // Initialize command manager
  const commandManager = CommandManager.getInstance(context)

  // Create the tree data provider
  const depCmdProvider = new DepCmdProvider(commandManager)

  // Register the tree view
  const treeView = window.createTreeView('depCmdView', {
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
      window.showErrorMessage(`Failed to initialize commands: ${error}`)
    }
  }

  // Call initialization immediately
  initializeCommands()

  // Initialize commands
  useCommands(commandManager, depCmdProvider)

  // Register double-click handler for tree items
  treeView.onDidChangeSelection((e) => {
    if (e.selection.length > 0) {
      const item = e.selection[0]
      if (item.contextValue === 'command') {
        commands.executeCommand('depCmd.sendToTerminal', item)
      }
    }
  })

  // Add disposables to context
  context.subscriptions.push(
    treeView,
  )
})

export { activate, deactivate }
