import type { CommandManager } from '@src/core/manager'
import type { DepCmdProvider, DepCmdTreeItem } from './provider'

import { DependencyChecker } from '@src/core/checker'
import * as meta from '@src/generated/meta'
import { getCommonCategoryIcons, sendCommandToTerminal } from '@src/utils'
import { useCommand } from 'reactive-vscode'
import { env, window, workspace } from 'vscode'

export function useCommands(commandManager: CommandManager, depCmdProvider: DepCmdProvider) {
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

/**
 * 配置新分类的设置（图标和依赖检测）
 */
async function configureCategorySettings(categoryKey: string, displayName: string): Promise<void> {
  try {
    // 1. 选择图标
    const iconOptions = getCommonCategoryIcons()
    const selectedIcon = await window.showQuickPick(iconOptions, {
      placeHolder: `Choose an icon for "${displayName}" category`,
      matchOnDescription: true,
    })

    if (!selectedIcon) {
      // 用户取消了图标选择，使用默认图标
      return
    }

    // 2. 询问是否配置依赖检测
    const configDependencyDetection = await window.showQuickPick([
      { label: '$(check) Yes, configure dependency detection', value: true },
      { label: '$(x) No, skip dependency detection', value: false },
    ], {
      placeHolder: 'Configure dependency detection for this category?',
    })

    if (!configDependencyDetection) {
      return
    }

    // 更新配置
    const config = workspace.getConfiguration('depCmd')

    // 更新分类显示配置
    const categoryDisplay = config.get<Record<string, any>>('categoryDisplay', {})
    categoryDisplay[categoryKey] = {
      displayName,
      icon: selectedIcon.value,
    }
    await config.update('categoryDisplay', categoryDisplay, true)

    // 如果用户选择配置依赖检测
    if (configDependencyDetection.value) {
      await configureDependencyDetection(categoryKey, displayName)
    }

    window.showInformationMessage(`Category "${displayName}" configured successfully!`)
  }
  catch (error) {
    window.showErrorMessage(`Failed to configure category: ${error}`)
  }
}

/**
 * 配置依赖检测
 */
async function configureDependencyDetection(categoryKey: string, displayName: string): Promise<void> {
  const detectionCommands: Array<{ command: string, description: string }> = []

  // 最多配置3个检测命令
  for (let i = 1; i <= 3; i++) {
    const command = await window.showInputBox({
      prompt: `Enter detection command ${i} for "${displayName}" (optional, press Enter to skip)`,
      placeHolder: 'e.g., npm --version',
      validateInput: (value) => {
        // 允许空值跳过
        if (!value.trim()) {
          return null
        }
        // 简单验证：确保包含至少一个字符
        if (value.trim().length < 2) {
          return 'Command too short'
        }
        return null
      },
    })

    if (command === undefined) {
      // 用户取消
      return
    }

    if (command.trim()) {
      const description = await window.showInputBox({
        prompt: `Enter description for "${command}"`,
        placeHolder: `e.g., Check if ${displayName} is installed`,
        value: `Check if ${displayName} is installed`,
      })

      if (description === undefined) {
        // 用户取消
        return
      }

      detectionCommands.push({
        command: command.trim(),
        description: description.trim() || `Check if ${displayName} is installed`,
      })
    }
    else if (i === 1) {
      // 如果第一个命令为空，询问是否继续
      const continueWithoutDetection = await window.showQuickPick([
        { label: '$(check) Continue without dependency detection', value: true },
        { label: '$(x) Cancel category creation', value: false },
      ], {
        placeHolder: 'No detection command provided. What would you like to do?',
      })

      if (!continueWithoutDetection?.value) {
        return
      }
      break
    }
    else {
      // 对于第2、3个命令，如果为空就停止添加
      break
    }
  }

  // 如果有检测命令，更新配置
  if (detectionCommands.length > 0) {
    const config = workspace.getConfiguration('depCmd')
    const dependencyDetection = config.get<Record<string, any>>('dependencyDetection', {})

    // 如果只有一个检测命令，直接设置
    if (detectionCommands.length === 1) {
      dependencyDetection[categoryKey] = {
        command: detectionCommands[0].command,
        enabled: true,
        description: detectionCommands[0].description,
      }
    }
    else {
      // 如果有多个检测命令，创建主命令和备用命令
      dependencyDetection[categoryKey] = {
        command: detectionCommands[0].command,
        enabled: true,
        description: detectionCommands[0].description,
        alternativeCommands: detectionCommands.slice(1),
      }
    }

    await config.update('dependencyDetection', dependencyDetection, true)

    // 清除该分类的依赖检测缓存
    const dependencyChecker = DependencyChecker.getInstance()
    dependencyChecker.clearCategoryCache(categoryKey)
  }
}

/**
 * 重命名分类
 */
async function renameCategoryOnly(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('depCmd')
  const categoryDisplay = config.get<Record<string, any>>('categoryDisplay', {})
  const currentDisplayName = categoryDisplay[categoryName]?.displayName || categoryName

  const newDisplayName = await window.showInputBox({
    prompt: `Rename category "${currentDisplayName}"`,
    value: currentDisplayName,
    validateInput: (value) => {
      if (!value.trim()) {
        return 'Category display name cannot be empty'
      }
      return null
    },
  })

  if (newDisplayName === undefined) {
    return // User cancelled
  }

  if (newDisplayName.trim() === currentDisplayName) {
    window.showInformationMessage('Category name unchanged')
    return
  }

  // Update category display configuration
  if (categoryDisplay[categoryName]) {
    categoryDisplay[categoryName].displayName = newDisplayName.trim()
  }
  else {
    categoryDisplay[categoryName] = {
      displayName: newDisplayName.trim(),
      icon: 'gear', // default icon
    }
  }

  await config.update('categoryDisplay', categoryDisplay, true)
  window.showInformationMessage(`Category renamed to "${newDisplayName.trim()}"`)
}

/**
 * 更改分类图标
 */
async function changeCategoryIcon(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('depCmd')
  const categoryDisplay = config.get<Record<string, any>>('categoryDisplay', {})
  const currentIcon = categoryDisplay[categoryName]?.icon || 'gear'

  const iconOptions = getCommonCategoryIcons()
  const selectedIcon = await window.showQuickPick(iconOptions, {
    placeHolder: `Choose new icon for "${categoryName}" category (current: ${currentIcon})`,
    matchOnDescription: true,
  })

  if (!selectedIcon) {
    return // User cancelled
  }

  // Update category display configuration
  if (categoryDisplay[categoryName]) {
    categoryDisplay[categoryName].icon = selectedIcon.value
  }
  else {
    categoryDisplay[categoryName] = {
      displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      icon: selectedIcon.value,
    }
  }

  await config.update('categoryDisplay', categoryDisplay, true)
  window.showInformationMessage(`Icon updated to "${selectedIcon.value}" for "${categoryName}" category`)
}

/**
 * 编辑依赖检测配置
 */
async function editDependencyDetection(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('depCmd')
  const dependencyDetection = config.get<Record<string, any>>('dependencyDetection', {})
  const currentDetection = dependencyDetection[categoryName]

  const options = [
    { label: '$(add) Add/Edit Detection Commands', value: 'edit' },
    { label: '$(eye) Enable/Disable Detection', value: 'toggle' },
    { label: '$(trash) Remove Detection', value: 'remove' },
  ]

  if (currentDetection) {
    options.unshift({
      label: `$(info) Current: ${currentDetection.command} (${currentDetection.enabled ? 'enabled' : 'disabled'})`,
      value: 'info',
    })
  }
  else {
    options.unshift({
      label: '$(info) No dependency detection configured',
      value: 'info',
    })
  }

  const selectedOption = await window.showQuickPick(options, {
    placeHolder: `Manage dependency detection for "${categoryName}"`,
  })

  if (!selectedOption || selectedOption.value === 'info') {
    return
  }

  switch (selectedOption.value) {
    case 'edit':
      await configureDependencyDetection(categoryName, categoryName)
      break
    case 'toggle':
      if (currentDetection) {
        dependencyDetection[categoryName].enabled = !currentDetection.enabled
        await config.update('dependencyDetection', dependencyDetection, true)

        // 清除该分类的依赖检测缓存
        const dependencyChecker = DependencyChecker.getInstance()
        dependencyChecker.clearCategoryCache(categoryName)

        window.showInformationMessage(
          `Dependency detection ${dependencyDetection[categoryName].enabled ? 'enabled' : 'disabled'} for "${categoryName}"`,
        )
      }
      else {
        window.showWarningMessage('No dependency detection configured to toggle')
      }
      break
    case 'remove':
      if (currentDetection) {
        delete dependencyDetection[categoryName]
        await config.update('dependencyDetection', dependencyDetection, true)

        // 清除该分类的依赖检测缓存
        const dependencyChecker = DependencyChecker.getInstance()
        dependencyChecker.clearCategoryCache(categoryName)

        window.showInformationMessage(`Dependency detection removed for "${categoryName}"`)
      }
      else {
        window.showWarningMessage('No dependency detection configured to remove')
      }
      break
  }
}

/**
 * 编辑所有分类设置
 */
async function editAllCategorySettings(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('depCmd')
  const categoryDisplay = config.get<Record<string, any>>('categoryDisplay', {})
  const dependencyDetection = config.get<Record<string, any>>('dependencyDetection', {})

  const currentDisplayName = categoryDisplay[categoryName]?.displayName || categoryName
  const currentIcon = categoryDisplay[categoryName]?.icon || 'gear'

  // 1. Edit display name
  const newDisplayName = await window.showInputBox({
    prompt: `Edit display name for "${categoryName}"`,
    value: currentDisplayName,
    validateInput: (value) => {
      if (!value.trim()) {
        return 'Display name cannot be empty'
      }
      return null
    },
  })

  if (newDisplayName === undefined) {
    return // User cancelled
  }

  // 2. Edit icon
  const iconOptions = getCommonCategoryIcons()
  const selectedIcon = await window.showQuickPick(iconOptions, {
    placeHolder: `Choose icon for "${newDisplayName}" (current: ${currentIcon})`,
    matchOnDescription: true,
  })

  if (!selectedIcon) {
    return // User cancelled
  }

  // 3. Ask about dependency detection
  const currentDetection = dependencyDetection[categoryName]
  const detectionOptions = [
    { label: '$(check) Keep current detection settings', value: 'keep' },
    { label: '$(edit) Edit detection commands', value: 'edit' },
    { label: '$(trash) Remove detection', value: 'remove' },
  ]

  if (!currentDetection) {
    detectionOptions[0] = { label: '$(x) No detection configured', value: 'keep' }
    detectionOptions[1] = { label: '$(add) Add detection commands', value: 'edit' }
    detectionOptions.splice(2, 1) // Remove "Remove detection" option
  }

  const detectionChoice = await window.showQuickPick(detectionOptions, {
    placeHolder: 'What to do with dependency detection?',
  })

  if (!detectionChoice) {
    return // User cancelled
  }

  // Update category display
  categoryDisplay[categoryName] = {
    displayName: newDisplayName.trim(),
    icon: selectedIcon.value,
  }
  await config.update('categoryDisplay', categoryDisplay, true)

  // Handle dependency detection
  if (detectionChoice.value === 'edit') {
    await configureDependencyDetection(categoryName, newDisplayName.trim())
  }
  else if (detectionChoice.value === 'remove' && currentDetection) {
    delete dependencyDetection[categoryName]
    await config.update('dependencyDetection', dependencyDetection, true)
  }

  window.showInformationMessage(`Category "${categoryName}" settings updated successfully!`)
}
