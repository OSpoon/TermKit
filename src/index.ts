import type { ExtensionContext } from 'vscode'
import { CommandManager } from '@src/core'
import { QuickCmdProvider, useCommands } from '@src/ui'
import { logger } from '@src/utils'
import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { version } from '../package.json'

const { activate, deactivate } = defineExtension(async (context: ExtensionContext) => {
  logger.info(`QuickCmd Activated, v${version}`)

  // Initialize command manager
  const commandManager = CommandManager.getInstance(context)

  // Create the tree data provider
  const quickCmdProvider = new QuickCmdProvider(commandManager)

  // Register the tree view
  const treeView = window.createTreeView('quickCmdView', {
    treeDataProvider: quickCmdProvider,
    showCollapseAll: true,
  })

  // Initialize extension data and tree view
  async function initializeExtension() {
    try {
      await commandManager.loadCommands()

      // Check if commands were loaded successfully
      const allCommands = await commandManager.getAllCommands()
      logger.info(`Loaded ${allCommands.length} commands from database`)

      // Refresh tree view with loaded data
      quickCmdProvider.refresh(true)
      logger.info('Extension initialization completed successfully')
    }
    catch (error) {
      logger.error('Extension initialization failed:', error)
      window.showErrorMessage(`QuickCmd initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Register VS Code command handlers first
  useCommands(commandManager, quickCmdProvider)

  // Initialize extension data and tree view
  await initializeExtension()

  // Handle tree item selection for command execution
  const treeSelectionHandler = treeView.onDidChangeSelection((e) => {
    if (e.selection.length > 0) {
      const item = e.selection[0]
      if (item.contextValue === 'command') {
        commands.executeCommand('quickCmd.sendToTerminal', item)
      }
    }
  })

  // Register all disposables for proper cleanup
  context.subscriptions.push(
    treeView,
    treeSelectionHandler,
  )

  // Return cleanup function for proper deactivation
  return async () => {
    logger.info('QuickCmd is being deactivated, cleaning up resources...')
    try {
      // Cleanup logic here if needed
      logger.info('QuickCmd deactivated successfully')
    }
    catch (error) {
      logger.error('Error during QuickCmd deactivation:', error)
    }
  }
})

export { activate, deactivate }
