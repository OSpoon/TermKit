import type { CommandManager } from '@src/core/manager'
import type { TermKitProvider } from '../provider'

import { useCategoryOperations } from './category'
import { useCommandOperations } from './command'
import { useDataManagement } from './data'
import { useViewCommands } from './view'

/**
 * 主命令注册函数 - 整合所有命令模块
 */
export function useCommands(commandManager: CommandManager, termKitProvider: TermKitProvider) {
  // 注册视图相关命令
  useViewCommands(commandManager, termKitProvider)

  // 注册命令操作相关命令
  useCommandOperations(commandManager, termKitProvider)

  // 注册分类操作相关命令
  useCategoryOperations(commandManager, termKitProvider)

  // 注册数据管理相关命令
  useDataManagement(commandManager, termKitProvider)
}

// 重新导出所有模块供外部使用
export { useCategoryOperations } from './category'
export { useCommandOperations } from './command'
export { useDataManagement } from './data'
export * from './helpers'
export { useViewCommands } from './view'
