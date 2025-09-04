import type { CommandManager } from '@src/core/manager'
import type { DepCmdProvider, DepCmdTreeItem } from '../provider'

import * as meta from '@src/generated/meta'
import { useCommand } from 'reactive-vscode'
import { window } from 'vscode'
import {
  changeCategoryIcon,
  editAllCategorySettings,
  editDependencyDetection,
  renameCategoryOnly,
} from './helpers'

/**
 * 分类操作相关命令
 */
export function useCategoryOperations(commandManager: CommandManager, depCmdProvider: DepCmdProvider) {
  // 编辑分类
  useCommand(meta.commands.depCmdEditCategory, async (item: DepCmdTreeItem) => {
    try {
      const categoryName = depCmdProvider.getCategoryByTreeItem(item)
      if (!categoryName) {
        window.showErrorMessage('Cannot edit category: category name not found')
        return
      }

      // 显示编辑选项菜单
      const editOptions = [
        { label: '$(edit) Rename Category', value: 'rename' },
        { label: '$(symbol-color) Change Icon', value: 'icon' },
        { label: '$(gear) Configure Dependency Detection', value: 'dependency' },
        { label: '$(settings) Edit All Settings', value: 'all' },
      ]

      const selectedOption = await window.showQuickPick(editOptions, {
        placeHolder: `Choose what to edit for "${categoryName}" category`,
      })

      if (!selectedOption) {
        return // User cancelled
      }

      switch (selectedOption.value) {
        case 'rename':
          await renameCategoryOnly(categoryName)
          break
        case 'icon':
          await changeCategoryIcon(categoryName)
          break
        case 'dependency':
          await editDependencyDetection(categoryName)
          break
        case 'all':
          await editAllCategorySettings(categoryName)
          break
      }

      // Refresh the view
      depCmdProvider.refresh()
    }
    catch (error) {
      window.showErrorMessage(`Failed to edit category: ${error}`)
    }
  })

  // 删除分类
  useCommand(meta.commands.depCmdDeleteCategory, async (item: DepCmdTreeItem) => {
    try {
      const categoryName = depCmdProvider.getCategoryByTreeItem(item)
      if (!categoryName) {
        window.showErrorMessage('Cannot delete category: category name not found')
        return
      }

      // Get current category count
      const commandCount = await commandManager.getCategoryCommandCount(categoryName)

      // Confirm deletion
      const result = await window.showWarningMessage(
        `Are you sure you want to delete the category "${categoryName}"? This will delete ${commandCount} command(s).`,
        { modal: true },
        'Delete',
        'Cancel',
      )

      if (result === 'Delete') {
        await commandManager.deleteCategory(categoryName)
        depCmdProvider.refresh()
        window.showInformationMessage(`Category "${categoryName}" and ${commandCount} command(s) deleted successfully!`)
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to delete category: ${error}`)
    }
  })
}
