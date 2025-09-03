import type { CommandManager } from '@src/core/manager'
import type { DepCmdProvider, DepCmdTreeItem } from './provider'

import * as meta from '@src/generated/meta'
import { sendCommandToTerminal } from '@src/utils'
import { useCommand } from 'reactive-vscode'
import { env, window, workspace } from 'vscode'

export function useCommands(commandManager: CommandManager, depCmdProvider: DepCmdProvider) {
  useCommand(meta.commands.depCmdRefreshView, async () => {
    try {
      await commandManager.reloadFromDatabase()

      // 恢复缺失的默认命令分类（如被删除的NRM等）
      await commandManager.restoreMissingDefaultCategories()

      depCmdProvider.refresh()

      window.showInformationMessage('Command memories reloaded!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to refresh: ${error}`)
      // Still refresh the view in case of partial success
      depCmdProvider.refresh()
    }
  })

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
      sendCommandToTerminal(selected.command)
    }
  })

  useCommand(meta.commands.depCmdSendToTerminal, async (item: DepCmdTreeItem) => {
    const command = depCmdProvider.getCommandByTreeItem(item)
    if (command) {
      sendCommandToTerminal(command)
    }
    else {
      window.showWarningMessage('No command found for this item')
    }
  })

  useCommand(meta.commands.depCmdCopyCommand, async (item: DepCmdTreeItem) => {
    const command = depCmdProvider.getCommandByTreeItem(item)
    if (command) {
      env.clipboard.writeText(command)
      const showNotifications = true

      if (showNotifications) {
        window.showInformationMessage(`Command copied to clipboard: ${command}`)
      }
    }
    else {
      window.showWarningMessage('No command found for this item')
    }
  })

  useCommand(meta.commands.depCmdEditCommand, async (item: DepCmdTreeItem) => {
    try {
      const commandObj = depCmdProvider.getCommandObjectByTreeItem(item)
      if (!commandObj.id) {
        window.showErrorMessage('Cannot edit command: missing command ID')
        return
      }

      // Get all commands to find the current one
      const allCommands = await commandManager.getAllCommands()
      const currentCommand = allCommands.find(cmd => cmd.id === commandObj.id)

      if (!currentCommand) {
        window.showErrorMessage('Command not found')
        return
      }

      // Show input boxes for editing
      const newLabel = await window.showInputBox({
        prompt: 'Enter command label',
        value: currentCommand.label,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Label cannot be empty'
          }
          return null
        },
      })

      if (newLabel === undefined)
        return // User cancelled

      const newCommand = await window.showInputBox({
        prompt: 'Enter command',
        value: currentCommand.command,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Command cannot be empty'
          }
          return null
        },
      })

      if (newCommand === undefined)
        return // User cancelled

      const newDescription = await window.showInputBox({
        prompt: 'Enter command description (optional)',
        value: currentCommand.description || '',
      })

      if (newDescription === undefined)
        return // User cancelled

      // Update the command
      await commandManager.updateCommand(commandObj.id, {
        label: newLabel,
        command: newCommand,
        description: newDescription || undefined,
      })

      // Refresh the view
      depCmdProvider.refresh()
      window.showInformationMessage('Command updated successfully!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to edit command: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdDeleteCommand, async (item: DepCmdTreeItem) => {
    try {
      const commandObj = depCmdProvider.getCommandObjectByTreeItem(item)
      if (!commandObj.id) {
        window.showErrorMessage('Cannot delete command: missing command ID')
        return
      }

      // Confirm deletion
      const result = await window.showWarningMessage(
        `Are you sure you want to delete the command "${item.label}"?`,
        { modal: true },
        'Delete',
        'Cancel',
      )

      if (result === 'Delete') {
        await commandManager.deleteCommand(commandObj.id)
        depCmdProvider.refresh()
        window.showInformationMessage('Command deleted successfully!')
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to delete command: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdAddCommand, async () => {
    try {
      // Get available categories
      const categories = await commandManager.getAvailableCategories()

      // Get command details from user
      const label = await window.showInputBox({
        prompt: 'Enter command label',
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Label cannot be empty'
          }
          return null
        },
      })

      if (label === undefined)
        return // User cancelled

      const command = await window.showInputBox({
        prompt: 'Enter command',
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Command cannot be empty'
          }
          return null
        },
      })

      if (command === undefined)
        return // User cancelled

      const description = await window.showInputBox({
        prompt: 'Enter command description (optional)',
      })

      if (description === undefined)
        return // User cancelled

      // Select category
      const categoryOptions = [
        ...categories,
        '$(add) Create new category...',
      ]

      const selectedCategory = await window.showQuickPick(categoryOptions, {
        placeHolder: 'Select a category for this command',
      })

      if (!selectedCategory)
        return // User cancelled

      let finalCategory: string
      if (selectedCategory === '$(add) Create new category...') {
        const newCategory = await window.showInputBox({
          prompt: 'Enter new category name',
          validateInput: (value) => {
            if (!value.trim()) {
              return 'Category name cannot be empty'
            }
            if (categories.includes(value.toLowerCase())) {
              return 'Category already exists'
            }
            return null
          },
        })

        if (!newCategory)
          return // User cancelled
        finalCategory = newCategory.toLowerCase()
      }
      else {
        finalCategory = selectedCategory
      }

      // Add the command
      await commandManager.addCommand({
        label,
        command,
        description: description || undefined,
        category: finalCategory,
      })

      // Refresh the view
      depCmdProvider.refresh()
      window.showInformationMessage('Command added successfully!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to add command: ${error}`)
    }
  })

  useCommand(meta.commands.depCmdEditCategory, async (item: DepCmdTreeItem) => {
    try {
      const categoryName = depCmdProvider.getCategoryByTreeItem(item)
      if (!categoryName) {
        window.showErrorMessage('Cannot edit category: category name not found')
        return
      }

      // Get current category count
      const commandCount = await commandManager.getCategoryCommandCount(categoryName)

      const newCategoryName = await window.showInputBox({
        prompt: `Rename category "${categoryName}" (contains ${commandCount} commands)`,
        value: categoryName,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'Category name cannot be empty'
          }
          if (value.toLowerCase() === categoryName.toLowerCase()) {
            return null // Same name is OK
          }
          // Check if new name already exists
          return null // For now, allow duplicates
        },
      })

      if (newCategoryName === undefined) {
        return // User cancelled
      }

      if (newCategoryName.toLowerCase() === categoryName.toLowerCase()) {
        window.showInformationMessage('Category name unchanged')
        return
      }

      // Update category
      await commandManager.updateCategory(categoryName, newCategoryName.toLowerCase())

      // Refresh the view
      depCmdProvider.refresh()
      window.showInformationMessage(`Category renamed from "${categoryName}" to "${newCategoryName.toLowerCase()}"`)
    }
    catch (error) {
      window.showErrorMessage(`Failed to edit category: ${error}`)
    }
  })

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
