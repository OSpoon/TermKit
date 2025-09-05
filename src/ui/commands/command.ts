import type { CommandManager } from '@src/core/manager'
import type { TermKitProvider, TermKitTreeItem } from '../provider'

import * as meta from '@src/generated/meta'
import { getCommonCategoryIcons } from '@src/utils'
import { useCommand } from 'reactive-vscode'
import { env, window } from 'vscode'
import { configureCategorySettings } from './helpers'

/**
 * 命令操作相关命令
 */
export function useCommandOperations(commandManager: CommandManager, termKitProvider: TermKitProvider) {
  // 复制命令到剪贴板
  useCommand(meta.commands.termKitCopyCommand, async (item: TermKitTreeItem) => {
    const command = termKitProvider.getCommandByTreeItem(item)
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

  // 添加命令
  useCommand(meta.commands.termKitAddCommand, async () => {
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

        // 配置新分类的图标和依赖检测
        await configureCategorySettings(finalCategory, newCategory)
      }
      else {
        finalCategory = selectedCategory
      }

      // Icon selection for the command
      const iconOptions = [
        { label: '$(terminal) Use default icon', value: 'default' },
        { label: '$(edit) Choose custom icon', value: 'custom' },
      ]

      const iconChoice = await window.showQuickPick(iconOptions, {
        placeHolder: 'Choose an icon for this command',
      })

      if (!iconChoice) {
        return // User cancelled
      }

      let commandIcon: string | undefined
      if (iconChoice.value === 'custom') {
        const commonIcons = getCommonCategoryIcons()
        const selectedIcon = await window.showQuickPick(commonIcons, {
          placeHolder: 'Choose an icon for this command',
          matchOnDescription: true,
        })

        if (!selectedIcon) {
          return // User cancelled
        }

        commandIcon = selectedIcon.value
      }

      // Add the command
      await commandManager.addCommand({
        label,
        command,
        description: description || undefined,
        category: finalCategory,
        icon: commandIcon,
      })

      // Refresh the view
      termKitProvider.refresh()
      window.showInformationMessage('Command added successfully!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to add command: ${error}`)
    }
  })

  // 编辑命令
  useCommand(meta.commands.termKitEditCommand, async (item: TermKitTreeItem) => {
    try {
      const commandObj = termKitProvider.getCommandObjectByTreeItem(item)
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

      // Icon selection
      const iconOptions = [
        { label: '$(gear) Keep current icon', value: 'keep' },
        { label: '$(edit) Choose new icon', value: 'edit' },
      ]

      const iconChoice = await window.showQuickPick(iconOptions, {
        placeHolder: `Current icon: ${currentCommand.icon || 'none (using default)'}`,
      })

      if (!iconChoice) {
        return // User cancelled
      }

      let newIcon = currentCommand.icon
      if (iconChoice.value === 'edit') {
        const commonIcons = getCommonCategoryIcons()
        const selectedIcon = await window.showQuickPick(commonIcons, {
          placeHolder: 'Choose an icon for this command',
          matchOnDescription: true,
        })

        if (!selectedIcon) {
          return // User cancelled
        }

        newIcon = selectedIcon.value
      }

      // Update the command
      await commandManager.updateCommand(commandObj.id, {
        label: newLabel,
        command: newCommand,
        description: newDescription || undefined,
        icon: newIcon,
      })

      // Refresh the view
      termKitProvider.refresh()
      window.showInformationMessage('Command updated successfully!')
    }
    catch (error) {
      window.showErrorMessage(`Failed to edit command: ${error}`)
    }
  })

  // 删除命令
  useCommand(meta.commands.termKitDeleteCommand, async (item: TermKitTreeItem) => {
    try {
      const commandObj = termKitProvider.getCommandObjectByTreeItem(item)
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
        termKitProvider.refresh()
        window.showInformationMessage('Command deleted successfully!')
      }
    }
    catch (error) {
      window.showErrorMessage(`Failed to delete command: ${error}`)
    }
  })
}
