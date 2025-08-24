import { sendCommandToTerminal } from '@src/utils'
import { describe, expect, it, vi } from 'vitest'

import { vscode } from './setup'

describe('utils', () => {
  describe('sendCommandToTerminal', () => {
    it('should create new terminal when no active terminal exists', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
      }

      ;(vscode.window as any).activeTerminal = undefined
      vscode.window.createTerminal = vi.fn().mockReturnValue(mockTerminal)
      vscode.workspace.getConfiguration = vi.fn().mockReturnValue({
        get: vi.fn((key: string, defaultValue: any) => {
          const configs: Record<string, any> = {
            autoExecute: false,
            showNotifications: true,
            terminalName: 'Test Terminal',
            clearTerminalLine: false,
          }
          return configs[key] ?? defaultValue
        }),
      })

      sendCommandToTerminal('npm test')

      expect(vscode.window.createTerminal).toHaveBeenCalledWith('Test Terminal')
      expect(mockTerminal.show).toHaveBeenCalled()
      expect(mockTerminal.sendText).toHaveBeenCalledWith('npm test', false)
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Command sent to terminal: npm test')
    })

    it('should use active terminal when available', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
      }

      ;(vscode.window as any).activeTerminal = mockTerminal
      vscode.workspace.getConfiguration = vi.fn().mockReturnValue({
        get: vi.fn((key: string, defaultValue: any) => {
          const configs: Record<string, any> = {
            autoExecute: true,
            showNotifications: false,
            clearTerminalLine: false,
          }
          return configs[key] ?? defaultValue
        }),
      })

      sendCommandToTerminal('pnpm build')

      expect(vscode.window.createTerminal).not.toHaveBeenCalled()
      expect(mockTerminal.show).toHaveBeenCalled()
      expect(mockTerminal.sendText).toHaveBeenCalledWith('pnpm build', true)
      expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
    })

    it('should clear terminal line when clearTerminalLine is enabled', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
      }

      ;(vscode.window as any).activeTerminal = mockTerminal
      vscode.workspace.getConfiguration = vi.fn().mockReturnValue({
        get: vi.fn((key: string, defaultValue: any) => {
          const configs: Record<string, any> = {
            autoExecute: false,
            showNotifications: true,
            clearTerminalLine: true,
          }
          return configs[key] ?? defaultValue
        }),
      })

      vi.useFakeTimers()
      sendCommandToTerminal('yarn install')

      expect(mockTerminal.sendText).toHaveBeenCalledWith('\x03', false)

      vi.advanceTimersByTime(50)
      expect(mockTerminal.sendText).toHaveBeenCalledWith('yarn install', false)

      vi.useRealTimers()
    })

    it('should handle errors gracefully', () => {
      ;(vscode.window as any).activeTerminal = undefined
      vscode.window.createTerminal = vi.fn().mockImplementation(() => {
        throw new Error('Terminal creation failed')
      })

      sendCommandToTerminal('test command')

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to send command: Error: Terminal creation failed')
    })
  })
})
