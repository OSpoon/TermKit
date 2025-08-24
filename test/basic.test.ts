import { logger, sendCommandToTerminal } from '@src/utils'

import { describe, expect, it } from 'vitest'

// Simple tests for basic functionality
describe('basic functionality', () => {
  describe('logger', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined()
      expect(logger.info).toBeDefined()
      expect(logger.warn).toBeDefined()
      expect(logger.error).toBeDefined()
    })
  })

  describe('sendCommandToTerminal', () => {
    it('should be a function', () => {
      expect(typeof sendCommandToTerminal).toBe('function')
    })
  })
})
