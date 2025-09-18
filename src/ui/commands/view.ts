import type { CommandManager } from '@src/core/manager'
import type { TermKitProvider, TermKitTreeItem } from '../provider'

import { DependencyChecker } from '@src/core/checker'
import * as meta from '@src/generated/meta'
import { logger, sendCommandToTerminal } from '@src/utils'
import { useCommand } from 'reactive-vscode'
import { window } from 'vscode'

/**
 * 视图相关命令
 */
export function useViewCommands(commandManager: CommandManager, termKitProvider: TermKitProvider) {
  // Refresh view command
  useCommand(meta.commands.termKitRefreshView, async () => {
    try {
      await commandManager.reloadFromDatabase()

      // 清除依赖检测缓存，强制重新检测
      const dependencyChecker = DependencyChecker.getInstance()
      dependencyChecker.clearCache()

      termKitProvider.refresh()

      window.showInformationMessage('Command memories reloaded!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to refresh: ${error}`)
      // Still refresh the view in case of partial success
      termKitProvider.refresh()
    }
  })

  // 搜索命令
  useCommand(meta.commands.termKitSearchCommands, async () => {
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
      await sendCommandToTerminal(selected.command)
    }
  })

  // 发送命令到终端
  useCommand(meta.commands.termKitSendToTerminal, async (item: TermKitTreeItem) => {
    logger.info(`🎯 SendToTerminal command called`)
    logger.info(`🎯 Item details:`, JSON.stringify({
      label: item?.label,
      commandText: item?.commandText,
      contextValue: item?.contextValue,
      category: item?.category,
      commandId: item?.commandId,
      description: item?.description,
      tooltip: item?.tooltip,
    }))

    if (item?.commandText) {
      logger.info(`📝 Command to send: ${item.commandText}`)
      await sendCommandToTerminal(item.commandText)
    }
    else {
      logger.warn(`⚠️ No command found in item. Item is not a command or commandText is missing.`)

      // 如果是分类项目，提示用户
      if (item?.contextValue === 'category') {
        window.showInformationMessage(`Please select a command within the "${item.label}" category to execute.`)
      }
      else {
        window.showWarningMessage('No command found to execute')
      }
    }
  })
}
