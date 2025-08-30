import { sendCommandToTerminal } from '@src/utils'
import * as reactiveVscode from 'reactive-vscode'
import { describe, expect, it, vi } from 'vitest'

import { vscode } from './setup'

describe('utils', () => {
  describe('sendCommandToTerminal', () => {
    it('should create new terminal when no active terminal exists', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
        name: 'Dep CMDs',
        exitStatus: undefined,
      }

      // Mock useActiveTerminal to return no active terminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: undefined,
      } as any)

      vscode.window.createTerminal = vi.fn().mockReturnValue(mockTerminal)

      sendCommandToTerminal('npm test')

      expect(vscode.window.createTerminal).toHaveBeenCalledWith({
        name: 'Dep CMDs',
        hideFromUser: false,
      })
      expect(mockTerminal.show).toHaveBeenCalledWith(true)
      expect(mockTerminal.sendText).toHaveBeenCalledWith('npm test', false)
    })

    it('should use active terminal when available', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
        name: 'existing-terminal',
        exitStatus: undefined,
      }

      // Mock useActiveTerminal to return an active terminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: mockTerminal,
      } as any)

      sendCommandToTerminal('pnpm build')

      expect(vscode.window.createTerminal).not.toHaveBeenCalled()
      expect(mockTerminal.show).toHaveBeenCalledWith(true)
      expect(mockTerminal.sendText).toHaveBeenCalledWith('pnpm build', false)
    })

    it('should clear terminal line when clearTerminalLine is enabled', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
        name: 'test-terminal',
        exitStatus: undefined,
      }

      // Mock useActiveTerminal to return an active terminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: mockTerminal,
      } as any)

      sendCommandToTerminal('yarn install')

      // Since we're on macOS (the current test environment), expect Ctrl+U
      expect(mockTerminal.sendText).toHaveBeenNthCalledWith(1, '\x15', false) // Ctrl+U for macOS/Linux
      expect(mockTerminal.sendText).toHaveBeenNthCalledWith(2, 'yarn install', false)
    })

    it('should handle errors gracefully', () => {
      // Mock useActiveTerminal to return no active terminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: undefined,
      } as any)

      vscode.window.createTerminal = vi.fn().mockImplementation(() => {
        throw new Error('Terminal creation failed')
      })

      sendCommandToTerminal('test command')

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to send command: Terminal creation failed')
    })
  })
})
