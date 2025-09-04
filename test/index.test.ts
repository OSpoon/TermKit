import { sendCommandToTerminal } from '@src/utils'
import * as reactiveVscode from 'reactive-vscode'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockControlledTerminal, mockShow, vscode } from './setup'

describe('utils', () => {
  describe('sendCommandToTerminal', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks()

      // Reset the controlled terminal state
      ;(mockControlledTerminal.value as any) = {
        name: 'Dep CMDs',
        exitStatus: undefined,
        sendText: vi.fn(), // Reset the sendText mock
        shellIntegration: undefined, // Add shellIntegration property
      }
    })

    it('should use controlled terminal and send command with shell integration', async () => {
      // Mock useActiveTerminal to return no active terminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: undefined,
      } as any)

      // Mock terminal with shell integration
      ;(mockControlledTerminal.value as any).shellIntegration = {}

      await sendCommandToTerminal('npm test')

      expect(mockShow).toHaveBeenCalled()

      // With shell integration: should send control characters first, then command
      // On non-Windows: \x15 (Ctrl+U), on Windows: \x03 (Ctrl+C)
      const expectedControlChar = process.platform === 'win32' ? '\x03' : '\x15'
      expect(mockControlledTerminal.value.sendText).toHaveBeenCalledWith(expectedControlChar, false)
      expect(mockControlledTerminal.value.sendText).toHaveBeenCalledWith('npm test', false)
    })

    it('should handle different active terminal gracefully without shell integration', async () => {
      const mockActiveTerminal = {
        name: 'other-terminal',
        exitStatus: undefined,
      }

      // Mock useActiveTerminal to return a different terminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: mockActiveTerminal,
      } as any)

      // Mock terminal without shell integration
      ;(mockControlledTerminal.value as any).shellIntegration = undefined

      await sendCommandToTerminal('pnpm build')

      // Should still use controlled terminal, not the active one
      expect(mockShow).toHaveBeenCalled()

      // Without shell integration: should eventually use fallback sendText
      expect(mockControlledTerminal.value.sendText).toHaveBeenCalledWith('pnpm build', false)
    }, 2000) // 2 second timeout - enough for 1 second polling + 50ms delay

    it('should work correctly with different terminal states', async () => {
      // Mock useActiveTerminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: undefined,
      } as any)

      // Test without shell integration (will trigger polling)
      ;(mockControlledTerminal.value as any).shellIntegration = undefined

      await sendCommandToTerminal('test command')

      // Should eventually use fallback sendText after polling timeout
      expect(mockControlledTerminal.value.sendText).toHaveBeenCalledWith('test command', false)
    }, 2000) // 2 second timeout

    it('should fallback to sendText when shell integration executeCommand fails', async () => {
      // Use fake timers for the 50ms delay
      vi.useFakeTimers()

      // Mock useActiveTerminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: undefined,
      } as any)

      // Mock terminal with shell integration (available immediately)
      ;(mockControlledTerminal.value as any).shellIntegration = {}

      const promise = sendCommandToTerminal('fallback test')

      expect(mockShow).toHaveBeenCalled()

      // Fast-forward time to handle the 50ms delay
      vi.advanceTimersByTime(50)

      await promise

      // Should use shell integration path (control char + command)
      const expectedControlChar = process.platform === 'win32' ? '\x03' : '\x15'
      expect(mockControlledTerminal.value.sendText).toHaveBeenCalledWith(expectedControlChar, false)
      expect(mockControlledTerminal.value.sendText).toHaveBeenCalledWith('fallback test', false)

      vi.useRealTimers()
    })

    it('should handle errors gracefully when terminal is closed', () => {
      // Set the controlled terminal as closed
      ;(mockControlledTerminal.value as any) = {
        name: 'Dep CMDs',
        exitStatus: 1, // Terminal has exited
      }

      // Mock useActiveTerminal
      vi.mocked(reactiveVscode.useActiveTerminal).mockReturnValue({
        value: undefined,
      } as any)

      sendCommandToTerminal('test command')

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send command'),
      )
    })
  })
})
