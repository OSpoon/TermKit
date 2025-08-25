import { describe, expect, it } from 'vitest'

// 简化的测试文件，专注于核心功能
describe('simplified tests', () => {
  describe('core modules', () => {
    it('should import all core modules successfully', async () => {
      // 测试所有模块能够正常导入
      const modules = await Promise.all([
        import('@src/types'),
        import('@src/utils'),
        import('@src/data/database'),
        import('@src/core/manager'),
        import('@src/core/detector'),
      ])

      modules.forEach((module) => {
        expect(module).toBeDefined()
      })
    })

    it('should export singleton classes', async () => {
      const { DatabaseManager } = await import('@src/data/database')
      const { ProjectDetector } = await import('@src/core/detector')

      expect(typeof DatabaseManager.getInstance).toBe('function')
      expect(typeof ProjectDetector.getInstance).toBe('function')
    })

    it('should export utility functions', async () => {
      const { logger, sendCommandToTerminal } = await import('@src/utils')

      expect(logger).toBeDefined()
      expect(typeof sendCommandToTerminal).toBe('function')
    })
  })

  describe('basic functionality', () => {
    it('should have logger with required methods', async () => {
      const { logger } = await import('@src/utils')

      expect(logger.info).toBeDefined()
      expect(logger.warn).toBeDefined()
      expect(logger.error).toBeDefined()
    })

    it('should handle database operations', async () => {
      const { DatabaseManager } = await import('@src/data/database')

      // 使用简单的mock context
      const mockContext = { globalStorageUri: { fsPath: '/test' } }
      const db = DatabaseManager.getInstance(mockContext as any)

      expect(db).toBeDefined()
      expect(typeof db.getAllCommands).toBe('function')
      expect(typeof db.addCommand).toBe('function')
    })
  })
})
