import type { CommandManager } from '@src/core/manager'
import type { DepCmdProvider } from '../provider'

import * as meta from '@src/generated/meta'
import { useCommand } from 'reactive-vscode'
import { window, workspace } from 'vscode'

/**
 * 数据管理相关命令
 */
export function useDataManagement(commandManager: CommandManager, depCmdProvider: DepCmdProvider) {
  // 导出数据
  useCommand(meta.commands.depCmdExportData, async () => {
    try {
      const data = await commandManager.exportData()
      const jsonString = JSON.stringify(data, null, 2)

      // 让用户选择保存位置
      const uri = await window.showSaveDialog({
        defaultUri: workspace.workspaceFolders?.[0]?.uri,
        filters: {
          'JSON Files': ['json'],
        },
        saveLabel: 'Export Commands',
      })

      if (uri) {
        const fs = await import('node:fs/promises')
        await fs.writeFile(uri.fsPath, jsonString, 'utf8')
        window.showInformationMessage(`Commands exported to ${uri.fsPath}`)
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to export data: ${error}`)
    }
  })

  // 导入数据
  useCommand(meta.commands.depCmdImportData, async () => {
    try {
      // 让用户选择文件
      const uris = await window.showOpenDialog({
        defaultUri: workspace.workspaceFolders?.[0]?.uri,
        filters: {
          'JSON Files': ['json'],
        },
        openLabel: 'Import Commands',
        canSelectMany: false,
      })

      if (uris && uris[0]) {
        const fs = await import('node:fs/promises')
        const content = await fs.readFile(uris[0].fsPath, 'utf8')
        const data = JSON.parse(content)

        // 询问是否合并数据
        const result = await window.showInformationMessage(
          'How would you like to import the commands?',
          { modal: true },
          'Merge with existing',
          'Replace all data',
          'Cancel',
        )

        if (result === 'Merge with existing') {
          await commandManager.importData(data, true)
          depCmdProvider.refresh()
          window.showInformationMessage('Commands imported and merged successfully')
        }
        else if (result === 'Replace all data') {
          await commandManager.importData(data, false)
          depCmdProvider.refresh()
          window.showInformationMessage('Commands imported and replaced all existing data')
        }
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to import data: ${error}`)
    }
  })

  // 清除所有数据
  useCommand(meta.commands.depCmdClearAllData, async () => {
    try {
      const result = await window.showWarningMessage(
        'Are you sure you want to clear all command data? This action cannot be undone.',
        { modal: true },
        'Clear All Data',
        'Cancel',
      )

      if (result === 'Clear All Data') {
        await commandManager.clearAllData()
        depCmdProvider.refresh()
        window.showInformationMessage('All command data has been cleared')
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to clear data: ${error}`)
    }
  })
}
