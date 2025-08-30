import * as process from 'node:process'

import { displayName } from '@src/generated/meta'
import { useActiveTerminal, useLogger } from 'reactive-vscode'
import { window } from 'vscode'

export const logger = useLogger(displayName)

// Helper function to send command to terminal using reactive-vscode
export function sendCommandToTerminal(command: string) {
  try {
    const autoExecute = false
    const terminalName = 'Dep CMDs'
    const clearTerminalLine = true

    // Use reactive-vscode to get active terminal
    const activeTerminal = useActiveTerminal()
    let terminal = activeTerminal.value

    // 简化逻辑：只在没有激活终端或终端已退出时创建新终端
    if (!terminal || terminal.exitStatus !== undefined) {
      terminal = window.createTerminal({
        name: terminalName,
        hideFromUser: false,
      })
      logger.info(`No active terminal found, created new terminal: ${terminalName}`)
    }
    else {
      logger.info(`Using existing active terminal: ${terminal.name}`)
    }

    // 确保我们有一个有效的终端
    if (!terminal) {
      throw new Error('Failed to get or create a valid terminal')
    }

    // Show the terminal
    terminal.show(true) // preserveFocus = true to keep focus on the extension

    // 定义发送命令的函数
    const sendCommand = () => {
      try {
        if (!terminal || terminal.exitStatus !== undefined) {
          throw new Error('Terminal is not available or has been closed')
        }

        if (clearTerminalLine) {
          // 根据操作系统选择清除策略
          if (process.platform === 'win32') {
            // Windows 环境：使用 Ctrl+C 中断当前命令
            // 这在 PowerShell、Command Prompt 和 Windows Terminal 中都能正常工作
            terminal.sendText('\x03', false) // Ctrl+C 中断当前命令
          }
          else {
            // macOS 和 Linux 环境使用 Ctrl+U 清除行
            // 这在 bash、zsh、fish 等 shell 中都能正常工作
            terminal.sendText('\x15', false) // Ctrl+U 清除行（macOS/Linux）
          }
        }

        // 发送命令
        terminal.sendText(command, autoExecute)
        logger.info(`Command sent to terminal: ${command}`)
      }
      catch (sendError) {
        logger.error('Error sending command to terminal:', sendError)
        window.showErrorMessage(`Failed to send command: ${sendError instanceof Error ? sendError.message : String(sendError)}`)
      }
    }

    // 直接发送命令，移除所有等待检测
    sendCommand()
  }
  catch (error) {
    logger.error('Failed to send command to terminal:', error)
    window.showErrorMessage(`Failed to send command: ${error instanceof Error ? error.message : String(error)}`)
  }
}
