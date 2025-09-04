import { beforeEach, vi } from 'vitest'

// Mock vscode module
const vscode = {
  window: {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    createTreeView: vi.fn(),
    activeTerminal: undefined,
    createTerminal: vi.fn(() => ({
      show: vi.fn(),
      sendText: vi.fn(),
    })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue?: any) => defaultValue),
    })),
    workspaceFolders: [],
  },
  commands: {
    executeCommand: vi.fn(),
    registerCommand: vi.fn(),
  },
  TreeItem: vi.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  Uri: {
    file: vi.fn((path: string) => ({ fsPath: path })),
  },
  EventEmitter: vi.fn(() => ({
    fire: vi.fn(),
    event: vi.fn(),
  })),
}

vi.mock('vscode', () => vscode)

// Mock reactive-vscode
const mockTerminalSendText = vi.fn()
const mockControlledTerminal = {
  value: {
    name: 'Dep CMDs',
    exitStatus: undefined,
    sendText: mockTerminalSendText, // Add sendText method to the terminal object
    shellIntegration: undefined, // Add shellIntegration property for testing
  },
}
const mockShow = vi.fn()
const mockSendText = vi.fn()

vi.mock('reactive-vscode', () => ({
  useLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  defineExtension: vi.fn(fn => ({
    activate: fn,
    deactivate: vi.fn(),
  })),
  defineConfigObject: vi.fn(() => ({
    get: vi.fn((key: string, defaultValue?: any) => defaultValue),
    update: vi.fn(),
  })),
  useActiveTerminal: vi.fn(() => ({
    value: undefined,
  })),
  useControlledTerminal: vi.fn(() => ({
    terminal: mockControlledTerminal,
    show: mockShow,
    sendText: mockSendText,
    close: vi.fn(),
    state: {
      value: {
        exitStatus: undefined,
      },
    },
  })),
}))

// Export the mocks so tests can access them
export { mockControlledTerminal, mockSendText, mockShow, mockTerminalSendText }

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

export { vscode }
