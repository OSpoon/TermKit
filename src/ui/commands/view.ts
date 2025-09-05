import type { CommandManager } from '@src/core/manager'
import type { QuickCmdProvider, QuickCmdTreeItem } from '../provider'

import { DependencyChecker } from '@src/core/checker'
import * as meta from '@src/generated/meta'
import { sendCommandToTerminal } from '@src/utils'
import { useCommand } from 'reactive-vscode'
import { window } from 'vscode'

/**
 * 视图相关命令
 */
export function useViewCommands(commandManager: CommandManager, quickCmdProvider: QuickCmdProvider) {
  // Refresh view command
  useCommand(meta.commands.quickCmdRefreshView, async () => {
    try {
      await commandManager.reloadFromDatabase()

      // 清除依赖检测缓存，强制重新检测
      const dependencyChecker = DependencyChecker.getInstance()
      dependencyChecker.clearCache()

      quickCmdProvider.refresh()

      window.showInformationMessage('Command memories reloaded!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to refresh: ${error}`)
      // Still refresh the view in case of partial success
      quickCmdProvider.refresh()
    }
  })

  // 搜索命令
  useCommand(meta.commands.quickCmdSearchCommands, async () => {
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
  useCommand(meta.commands.quickCmdSendToTerminal, async (item: QuickCmdTreeItem) => {
    if (item?.command?.command) {
      await sendCommandToTerminal(item.command.command)
    }
  })
}
