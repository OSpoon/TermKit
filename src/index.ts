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

  // Initialize extension data and tree view
  async function initializeExtension() {
    try {
      await commandManager.loadCommands()

      // Check if commands were loaded successfully
      const allCommands = await commandManager.getAllCommands()
      logger.info(`Loaded ${allCommands.length} commands from database`)

      // Detect project type for command filtering
      const config = workspace.getConfiguration('depCmd')
      const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

      if (enableProjectDetection) {
        await commandManager.detectCurrentProject(true)

        const currentProject = commandManager.getCurrentProject()
        if (currentProject) {
          logger.info(`Project detected: ${currentProject.detectedCategories.join(', ')}`)
        }
        else {
          logger.info('No project detected in current workspace')
        }
      }
      else {
        logger.info('Project detection is disabled')
        // 清除任何现有的项目缓存
        commandManager.clearProjectCache()
      }

      // Refresh tree view with loaded data
      depCmdProvider.refresh(true)
      logger.info('Extension initialization completed successfully')
    }
    catch (error) {
      logger.error('Extension initialization failed:', error)
      window.showErrorMessage(`DepCmd initialization failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Register VS Code command handlers first
  useCommands(commandManager, depCmdProvider)

  // Initialize extension data and tree view
  await initializeExtension()

  // Monitor workspace changes and update project detection
  const workspaceWatcher = workspace.onDidChangeWorkspaceFolders(async () => {
    logger.info('Workspace folders changed, updating project detection')
    commandManager.clearProjectCache()

    // Re-detect project type if detection is enabled
    const config = workspace.getConfiguration('depCmd')
    const enableProjectDetection = config.get<boolean>('enableProjectDetection', true)

    if (enableProjectDetection) {
      await commandManager.detectCurrentProject(true)
    }

    depCmdProvider.refresh()
  })

  // Handle tree item selection for command execution
  const treeSelectionHandler = treeView.onDidChangeSelection((e) => {
    if (e.selection.length > 0) {
      const item = e.selection[0]
      if (item.contextValue === 'command') {
        commands.executeCommand('depCmd.sendToTerminal', item)
      }
    }
  })

  // Register all disposables for proper cleanup
  context.subscriptions.push(
    treeView,
    workspaceWatcher,
    treeSelectionHandler,
  )

  // Return cleanup function for proper deactivation
  return async () => {
    logger.info('DepCmd is being deactivated, cleaning up resources...')
    try {
      await commandManager.dispose()
      logger.info('DepCmd deactivated successfully')
    }
    catch (error) {
      logger.error('Error during DepCmd deactivation:', error)
    }
  }
})

export { activate, deactivate }
