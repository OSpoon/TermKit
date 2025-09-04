import type { CommandManager } from '@src/core/manager'
import type { DepCmdProvider, DepCmdTreeItem } from '../provider'

import { DependencyChecker } from '@src/core/checker'
import * as meta from '@src/generated/meta'
import { sendCommandToTerminal } from '@src/utils'
import { useCommand } from 'reactive-vscode'
import { window } from 'vscode'

/**
 * 视图相关命令
 */
export function useViewCommands(commandManager: CommandManager, depCmdProvider: DepCmdProvider) {
  // 刷新视图
  useCommand(meta.commands.depCmdRefreshView, async () => {
    try {
      await commandManager.reloadFromDatabase()

      // 清除依赖检测缓存，强制重新检测
      const dependencyChecker = DependencyChecker.getInstance()
      dependencyChecker.clearCache()

      depCmdProvider.refresh()

      window.showInformationMessage('Command memories reloaded!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to refresh: ${error}`)
      // Still refresh the view in case of partial success
      depCmdProvider.refresh()
    }
  })

  // 搜索命令
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
      await sendCommandToTerminal(selected.command)
    }
  })

  // 发送命令到终端
  useCommand(meta.commands.depCmdSendToTerminal, async (item: DepCmdTreeItem) => {
    if (item?.command?.command) {
      await sendCommandToTerminal(item.command.command)
    }
  })
}
