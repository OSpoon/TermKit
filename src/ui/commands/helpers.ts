import { DependencyChecker } from '@src/core/checker'
import { getCommonCategoryIcons } from '@src/utils'
import { window, workspace } from 'vscode'

/**
 * 配置新分类的设置（图标和依赖检测）
 */
export async function configureCategorySettings(categoryKey: string, displayName: string): Promise<void> {
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
    const config = workspace.getConfiguration('quickCmd')

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
export async function configureDependencyDetection(categoryKey: string, displayName: string): Promise<void> {
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
    const config = workspace.getConfiguration('quickCmd')
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
export async function renameCategoryOnly(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('quickCmd')
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
export async function changeCategoryIcon(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('quickCmd')
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
export async function editDependencyDetection(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('quickCmd')
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
export async function editAllCategorySettings(categoryName: string): Promise<void> {
  const config = workspace.getConfiguration('quickCmd')
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
