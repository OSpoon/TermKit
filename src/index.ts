import type { ExtensionContext } from 'vscode'
import { CommandManager } from '@src/core'
import { DepCmdProvider, useCommands } from '@src/ui'
import { logger } from '@src/utils'
import { defineExtension } from 'reactive-vscode'
import { commands, window, workspace } from 'vscode'
import { version } from '../package.json'

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
        logger.info('No existing commands found, database should have been initialized with defaults...')
      }

      // 立即检测项目类型以确保过滤功能正常工作
      const config = workspace.getConfiguration('depCmd')
      const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

      if (enableProjectDetection) {
        logger.info('Project detection enabled, detecting current project...')
        await commandManager.detectCurrentProject(true)

        // Log the current project detection status for debugging
        const currentProject = commandManager.getCurrentProject()
        if (currentProject) {
          logger.info('Project detected on startup:', currentProject.detectedCategories.join(', '))
        }
        else {
          logger.info('No project detected on startup')
        }
      }
      else {
        logger.info('Project detection disabled')
      }

      // Always refresh the tree view after initialization
      depCmdProvider.refresh(true) // Skip reload since we just loaded/initialized
    }
    catch (error) {
      logger.error('Failed to initialize commands:', error)
      window.showErrorMessage(`Failed to initialize commands: ${error}`)
    }
  }

  // Call initialization immediately, but give a minimal delay for workspace to be ready
  setTimeout(() => {
    initializeCommands()
  }, 50)

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
