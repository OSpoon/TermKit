import type { ExtensionContext } from 'vscode'

import { DatabaseManager } from '@src/data/database'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock VS Code API
const mockGlobalState = {
  get: vi.fn(),
  update: vi.fn(),
}

const mockContext = {
  globalState: mockGlobalState,
  globalStorageUri: { fsPath: '/mock/path' },
} as unknown as ExtensionContext

// Mock VS Code extensions API
vi.mock('vscode', () => ({
  extensions: {
    getExtension: vi.fn(() => ({
      extensionPath: '/mock/extension/path',
    })),
  },
}))

describe('databaseManager', () => {
  let database: DatabaseManager

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton instance
    ;(DatabaseManager as any)._instance = null
    database = DatabaseManager.getInstance(mockContext)
  })

  describe('basic functionality', () => {
    it('should be a singleton', () => {
      const instance1 = DatabaseManager.getInstance(mockContext)
      const instance2 = DatabaseManager.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should initialize with empty commands', async () => {
      mockGlobalState.get.mockReturnValue([])

      await database.initialize()

      expect(database.getAllCommands()).toEqual([])
    })

    it('should load existing commands from global state', async () => {
      const existingCommands = [
        { id: 1, label: 'Test Command', command: 'echo test', category: 'test' },
      ]

      mockGlobalState.get
        .mockReturnValueOnce(existingCommands) // for commands
        .mockReturnValueOnce(2) // for next ID

      await database.initialize()

      expect(database.getAllCommands()).toEqual(existingCommands)
    })
  })

  describe('command operations', () => {
    beforeEach(async () => {
      mockGlobalState.get.mockReturnValue([])
      await database.initialize()
    })

    it('should add a new command', () => {
      const newCommand = {
        label: 'New Command',
        command: 'echo new',
        category: 'test',
      }

      const result = database.addCommand(newCommand)

      expect(result).toMatchObject(newCommand)
      expect(result.id).toBeDefined()
      expect(result.created_at).toBeDefined()
      expect(result.updated_at).toBeDefined()
    })

    it('should delete a command', () => {
      // Add a command first
      const added = database.addCommand({
        label: 'To Delete',
        command: 'echo delete',
        category: 'test',
      })

      expect(database.getAllCommands()).toHaveLength(1)

      database.deleteCommand(added.id!)

      expect(database.getAllCommands()).toHaveLength(0)
    })

    it('should search commands', () => {
      database.addCommand({
        label: 'Install Dependencies',
        command: 'npm install',
        category: 'npm',
      })

      database.addCommand({
        label: 'Build Project',
        command: 'npm run build',
        category: 'npm',
      })

      const results = database.searchCommands('npm')
      expect(results).toHaveLength(2)
    })
  })

  describe('category operations', () => {
    beforeEach(async () => {
      mockGlobalState.get.mockReturnValue([])
      await database.initialize()

      // Add some test commands
      database.addCommand({ label: 'NPM Install', command: 'npm install', category: 'npm' })
      database.addCommand({ label: 'Git Status', command: 'git status', category: 'git' })
    })

    it('should get available categories', () => {
      const categories = database.getAvailableCategories()
      expect(categories).toEqual(['git', 'npm'])
    })

    it('should get commands by category', () => {
      const npmCommands = database.getCommandsByCategory('npm')
      expect(npmCommands).toHaveLength(1)
      expect(npmCommands[0].category).toBe('npm')
    })
  })
})
