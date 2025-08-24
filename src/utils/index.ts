import { useLogger } from 'reactive-vscode'
import { window, workspace } from 'vscode'
import { displayName } from '../generated/meta'

export const logger = useLogger(displayName)

// Helper function to send command to terminal
export function sendCommandToTerminal(command: string) {
  try {
    const config = workspace.getConfiguration('depCmd')
    const autoExecute = config.get<boolean>('autoExecute', false)
    const showNotifications = config.get<boolean>('showNotifications', true)
    const terminalName = config.get<string>('terminalName', 'Development Commands')
    const clearTerminalLine = config.get<boolean>('clearTerminalLine', true)

    // Get or create a terminal
    let terminal = window.activeTerminal
    if (!terminal) {
      terminal = window.createTerminal(terminalName)
    }

    // Show the terminal
    terminal.show()

    if (clearTerminalLine) {
      terminal.sendText('\x03', false) // Send Ctrl+U (ASCII 21)
      // Send the command immediately since Ctrl+U doesn't need delay
      setTimeout(() => {
        terminal.sendText(command, autoExecute)
      }, 50)
    }
    else {
      // Send command directly without clearing
      terminal.sendText(command, autoExecute)
    }

    if (showNotifications) {
      const action = autoExecute ? 'executed' : 'sent to terminal'
      window.showInformationMessage(`Command ${action}: ${command}`)
    }
  }
  catch (error) {
    window.showErrorMessage(`Failed to send command: ${error}`)
  }
}
