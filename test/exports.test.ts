import { describe, expect, it } from 'vitest'

describe('core functionality tests', () => {
  describe('project types', () => {
    it('should define project types enum', async () => {
      const { ProjectType } = await import('@src/types')

      expect(ProjectType.NODE).toBe('node')
      expect(ProjectType.PYTHON).toBe('python')
      expect(ProjectType.DOCKER).toBe('docker')
      expect(ProjectType.GIT).toBe('git')
      expect(ProjectType.UNKNOWN).toBe('unknown')
    })
  })

  describe('database manager', () => {
    it('should export DatabaseManager class', async () => {
      const { DatabaseManager } = await import('@src/data/database')

      expect(DatabaseManager).toBeDefined()
      expect(typeof DatabaseManager).toBe('function')
      expect(DatabaseManager.getInstance).toBeDefined()
    })
  })

  describe('project detector', () => {
    it('should export ProjectDetector class', async () => {
      const { ProjectDetector } = await import('@src/core/detector')

      expect(ProjectDetector).toBeDefined()
      expect(typeof ProjectDetector).toBe('function')
      expect(ProjectDetector.getInstance).toBeDefined()
    })
  })

  describe('command manager', () => {
    it('should export CommandManager class', async () => {
      const { CommandManager } = await import('@src/core/manager')

      expect(CommandManager).toBeDefined()
      expect(typeof CommandManager).toBe('function')
      expect(CommandManager.getInstance).toBeDefined()
    })
  })

  describe('ui components', () => {
    it('should export DepCmdProvider class', async () => {
      const { DepCmdProvider } = await import('@src/ui/provider')

      expect(DepCmdProvider).toBeDefined()
      expect(typeof DepCmdProvider).toBe('function')
    })

    it('should export command functions', async () => {
      const commands = await import('@src/ui/commands')

      expect(commands.useCommands).toBeDefined()
      expect(typeof commands.useCommands).toBe('function')
    })
  })

  describe('utilities', () => {
    it('should export logger and sendCommandToTerminal', async () => {
      const utils = await import('@src/utils')

      expect(utils.logger).toBeDefined()
      expect(utils.sendCommandToTerminal).toBeDefined()
      expect(typeof utils.sendCommandToTerminal).toBe('function')
    })
  })
})
