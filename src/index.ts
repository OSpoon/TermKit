import type { ExtensionContext } from 'vscode'
import { CommandManager } from '@src/core'
import { TermKitProvider, useCommands } from '@src/ui'
import { logger } from '@src/utils'
import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { version } from '../package.json'

const { activate, deactivate } = defineExtension(async (context: ExtensionContext) => {
  logger.info(`TermKit Activated, v${version}`)

  // Initialize command manager
  const commandManager = CommandManager.getInstance(context)

  // Create the tree data provider
  const termKitProvider = new TermKitProvider(commandManager)

  // Register the tree view
  const treeView = window.createTreeView('termKitView', {
    treeDataProvider: termKitProvider,
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
      termKitProvider.refresh(true)
      logger.info('Extension initialization completed successfully')
    }
    catch (error) {
      logger.error('Extension initialization failed:', error)
      window.showErrorMessage(`TermKit initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Register VS Code command handlers first
  useCommands(commandManager, termKitProvider)

  // Initialize extension data and tree view
  await initializeExtension()

  // Handle tree item selection for command execution
  const treeSelectionHandler = treeView.onDidChangeSelection((e) => {
    logger.info(`📋 Tree selection changed, items: ${e.selection.length}`)

    if (e.selection.length > 0) {
      const item = e.selection[0]
      logger.info(`🎯 Selected item: ${item.label}, contextValue: ${item.contextValue}`)

      if (item.contextValue === 'command') {
        logger.info(`💻 Executing command: termKit.sendToTerminal`)
        commands.executeCommand('termKit.sendToTerminal', item)
      }
      else {
        logger.info(`ℹ️ Item is not a command, skipping execution`)
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
    logger.info('TermKit is being deactivated, cleaning up resources...')
    try {
      // Cleanup logic here if needed
      logger.info('TermKit deactivated successfully')
    }
    catch (error) {
      logger.error('Error during TermKit deactivation:', error)
    }
  }
})

export { activate, deactivate }
