import * as process from 'node:process'

import { displayName } from '@src/generated/meta'
import { useControlledTerminal, useLogger } from 'reactive-vscode'
import { window } from 'vscode'

export const logger = useLogger(displayName)

// Export icon utilities
export * from './icons'

// Terminal instance holder
let terminalInstance: ReturnType<typeof useControlledTerminal> | null = null

// Helper to get or create controlled terminal
function getOrCreateControlledTerminal() {
  if (!terminalInstance) {
    const terminalName = 'Dep CMDs'
    terminalInstance = useControlledTerminal(terminalName)
  }
  return terminalInstance
}

// Export terminal control functions
export function showTermKitTerminal() {
  const { show } = getOrCreateControlledTerminal()
  show()
}

// 配置常量
const POLLING_CONFIG = {
  interval: 50, // 检测间隔 50ms
  maxAttempts: 20, // 最大检测次数（20次 = 1秒）
  timeout: 1000, // 超时时间 1秒
} as const

// 通用轮询检测函数
async function pollForCondition<T>(
  checkCondition: () => T | null,
  options: {
    interval?: number
    maxAttempts?: number
    onSuccess?: (result: T) => void
    onTimeout?: () => void
    onError?: (error: Error) => void
  } = {},
): Promise<T | null> {
  const {
    interval = POLLING_CONFIG.interval,
    maxAttempts = POLLING_CONFIG.maxAttempts,
    onSuccess,
    onTimeout,
    onError,
  } = options

  return new Promise((resolve) => {
    let attempts = 0

    const poll = () => {
      try {
        attempts++
        const result = checkCondition()

        if (result !== null) {
          // 条件满足
          onSuccess?.(result)
          resolve(result)
          return
        }

        if (attempts >= maxAttempts) {
          // 超时
          logger.warn(`⚠️ Polling timeout after ${attempts} attempts (${attempts * interval}ms)`)
          onTimeout?.()
          resolve(null)
          return
        }

        // 继续检测
        setTimeout(poll, interval)
      }
      catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('❌ Polling error:', err)
        onError?.(err)
        resolve(null)
      }
    }

    poll()
  })
}

// Shell Integration 检测函数
async function waitForShellIntegration(terminal: any): Promise<any | null> {
  return pollForCondition(
    () => terminal.value?.shellIntegration || null,
    {
      interval: POLLING_CONFIG.interval,
      maxAttempts: POLLING_CONFIG.maxAttempts,
      onSuccess: (_shellIntegration) => {
        logger.info('✅ Shell integration became available')
      },
      onTimeout: () => {
        logger.warn('⚠️ Shell integration not available, using fallback method')
      },
      onError: (error) => {
        logger.error('❌ Error while waiting for shell integration:', error)
      },
    },
  )
}

// 发送命令的核心逻辑
async function executeCommandWithShellIntegration(terminal: any, command: string) {
  // 发送控制字符清空当前行
  if (process.platform === 'win32') {
    terminal.sendText('\x03', false) // Windows: Ctrl+C
  }
  else {
    terminal.sendText('\x15', false) // Unix/macOS: Ctrl+U
  }

  // 添加50毫秒延迟，确保控制字符处理完成
  await new Promise(resolve => setTimeout(resolve, 50))

  // 发送命令（不自动执行）
  terminal.sendText(command, false)
  logger.info(`✅ Command executed via shell integration: ${command}`)
}

// 降级方案：简单发送命令
async function executeCommandFallback(terminal: any, command: string) {
  // 添加50毫秒延迟，确保终端状态稳定
  await new Promise(resolve => setTimeout(resolve, 50))

  terminal.sendText(command, false)
  logger.info(`✅ Command sent via fallback method: ${command}`)
}

// 主要的命令发送函数 - 重构后的简洁版本
export async function sendCommandToTerminal(command: string) {
  try {
    // 获取控制终端实例
    const { terminal: controlledTerminal, show: showTerminal } = getOrCreateControlledTerminal()

    // 显示终端
    showTerminal()

    // 检查终端可用性
    if (!controlledTerminal.value || controlledTerminal.value.exitStatus !== undefined) {
      throw new Error('Controlled terminal is not available or has been closed')
    }

    // 立即检查 Shell Integration 是否可用
    if (controlledTerminal.value.shellIntegration) {
      await executeCommandWithShellIntegration(controlledTerminal.value, command)
      return
    }

    // 如果不可用，等待 Shell Integration
    logger.info('Shell integration not ready, waiting...')
    const shellIntegration = await waitForShellIntegration(controlledTerminal)

    if (shellIntegration) {
      // Shell Integration 可用
      await executeCommandWithShellIntegration(controlledTerminal.value, command)
    }
    else {
      // 使用降级方案
      await executeCommandFallback(controlledTerminal.value, command)
    }
  }
  catch (error) {
    logger.error('❌ Failed to send command to terminal:', error)
    window.showErrorMessage(`Failed to send command: ${error instanceof Error ? error.message : String(error)}`)
  }
}
