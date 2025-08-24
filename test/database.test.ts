import type { UserCommand } from '@src/types'

import { DatabaseManager } from '@src/data/database'

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Node.js modules
vi.mock('node:fs', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
}))

vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
  dirname: vi.fn(path => path.split('/').slice(0, -1).join('/')),
}))

// Mock vscode
const mockContext = {
  globalStorageUri: {
    fsPath: '/mock/storage/path',
  },
}

describe('databaseManager', () => {
  let databaseManager: DatabaseManager
  const mockCommands: UserCommand[] = [
    {
      id: 1,
      label: 'npm install',
      command: 'npm install',
      category: 'npm',
      description: 'Install dependencies',
    },
    {
      id: 2,
      label: 'npm test',
      command: 'npm test',
      category: 'npm',
      description: 'Run tests',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    databaseManager = DatabaseManager.getInstance(mockContext as any)
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseManager.getInstance(mockContext as any)
      const instance2 = DatabaseManager.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('getAllCommands', () => {
    it('should return all commands', () => {
      // Add some test commands directly to internal state for testing
      ;(databaseManager as any)._commands = mockCommands

      const result = databaseManager.getAllCommands()

      expect(result).toEqual(mockCommands)
    })
  })

  describe('getCommandsByCategory', () => {
    it('should return commands filtered by category', () => {
      ;(databaseManager as any)._commands = [
        ...mockCommands,
        {
          id: 3,
          label: 'docker build',
          command: 'docker build .',
          category: 'docker',
          description: 'Build Docker image',
        },
      ]

      const result = databaseManager.getCommandsByCategory('npm')

      expect(result).toHaveLength(2)
      expect(result.every(cmd => cmd.category === 'npm')).toBe(true)
    })
  })

  describe('addCommand', () => {
    it('should add a new command', () => {
      const newCommand = {
        label: 'npm build',
        command: 'npm run build',
        category: 'npm',
        description: 'Build the project',
      }

      databaseManager.addCommand(newCommand)

      const allCommands = databaseManager.getAllCommands()
      const addedCommand = allCommands.find(cmd => cmd.label === 'npm build')

      expect(addedCommand).toBeDefined()
      expect(addedCommand?.id).toBeDefined()
      expect(addedCommand?.created_at).toBeDefined()
      expect(addedCommand?.updated_at).toBeDefined()
    })
  })

  describe('updateCommand', () => {
    it('should update an existing command', () => {
      // Initialize with test data
      ;(databaseManager as any)._commands = [...mockCommands]

      const updates = {
        label: 'npm install --save',
        description: 'Install and save dependencies',
      }

      databaseManager.updateCommand(1, updates)

      const updatedCommand = databaseManager.getAllCommands().find(cmd => cmd.id === 1)

      expect(updatedCommand?.label).toBe('npm install --save')
      expect(updatedCommand?.description).toBe('Install and save dependencies')
      expect(updatedCommand?.updated_at).toBeDefined()
    })

    it('should throw error when command not found', () => {
      ;(databaseManager as any)._commands = [...mockCommands]

      expect(() => {
        databaseManager.updateCommand(999, { label: 'non-existent' })
      }).toThrow(/Command.*not found/)
    })
  })

  describe('deleteCommand', () => {
    it('should delete an existing command', () => {
      ;(databaseManager as any)._commands = [...mockCommands]

      databaseManager.deleteCommand(1)

      const remainingCommands = databaseManager.getAllCommands()
      expect(remainingCommands).toHaveLength(1)
      expect(remainingCommands.find(cmd => cmd.id === 1)).toBeUndefined()
    })

    it('should throw error when command not found', () => {
      ;(databaseManager as any)._commands = [...mockCommands]

      expect(() => {
        databaseManager.deleteCommand(999)
      }).toThrow(/Command.*not found/)
    })
  })

  describe('searchCommands', () => {
    it('should search commands by label and command text', () => {
      ;(databaseManager as any)._commands = [
        ...mockCommands,
        {
          id: 3,
          label: 'npm start',
          command: 'npm start',
          category: 'npm',
          description: 'Start development server',
        },
      ]

      const result = databaseManager.searchCommands('install')

      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('npm install')
    })

    it('should return empty array when no matches found', () => {
      ;(databaseManager as any)._commands = [...mockCommands]

      const result = databaseManager.searchCommands('nonexistent')

      expect(result).toHaveLength(0)
    })
  })

  describe('getCategoryCommandCount', () => {
    it('should return correct command count for category', () => {
      ;(databaseManager as any)._commands = [
        ...mockCommands,
        {
          id: 3,
          label: 'docker build',
          command: 'docker build .',
          category: 'docker',
          description: 'Build Docker image',
        },
      ]

      const npmCount = databaseManager.getCategoryCommandCount('npm')
      const dockerCount = databaseManager.getCategoryCommandCount('docker')
      const emptyCount = databaseManager.getCategoryCommandCount('nonexistent')

      expect(npmCount).toBe(2)
      expect(dockerCount).toBe(1)
      expect(emptyCount).toBe(0)
    })
  })
})
