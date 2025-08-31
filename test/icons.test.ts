import { getDefaultIconByCategory, isIconSupported, validateIcon } from '@src/utils/icons'
import { describe, expect, it } from 'vitest'

describe('icon utilities', () => {
  describe('isIconSupported', () => {
    it('should return true for supported icons', () => {
      expect(isIconSupported('gear')).toBe(true)
      expect(isIconSupported('terminal')).toBe(true)
      expect(isIconSupported('package')).toBe(true)
      expect(isIconSupported('git-branch')).toBe(true)
    })

    it('should return false for unsupported icons', () => {
      expect(isIconSupported('stopwatch')).toBe(false)
      expect(isIconSupported('unlink')).toBe(false)
      expect(isIconSupported('nonexistent-icon')).toBe(false)
    })
  })

  describe('getDefaultIconByCategory', () => {
    it('should return category-specific icons', () => {
      expect(getDefaultIconByCategory('npm')).toBe('package')
      expect(getDefaultIconByCategory('git')).toBe('git-branch')
      expect(getDefaultIconByCategory('docker')).toBe('server-process')
      expect(getDefaultIconByCategory('nrm')).toBe('settings')
    })

    it('should return default icon for unknown categories', () => {
      expect(getDefaultIconByCategory('unknown')).toBe('terminal')
      expect(getDefaultIconByCategory()).toBe('terminal')
    })

    it('should be case insensitive', () => {
      expect(getDefaultIconByCategory('NPM')).toBe('package')
      expect(getDefaultIconByCategory('Git')).toBe('git-branch')
    })
  })

  describe('validateIcon', () => {
    it('should return supported icons as-is', () => {
      expect(validateIcon('gear')).toBe('gear')
      expect(validateIcon('terminal')).toBe('terminal')
      expect(validateIcon('package')).toBe('package')
    })

    it('should map unsupported icons to supported ones', () => {
      expect(validateIcon('stopwatch')).toBe('clock')
      expect(validateIcon('unlink')).toBe('close')
      expect(validateIcon('settings-gear')).toBe('settings')
    })

    it('should use category default for unmapped unsupported icons', () => {
      expect(validateIcon('nonexistent-icon', 'npm')).toBe('package')
      expect(validateIcon('nonexistent-icon', 'git')).toBe('git-branch')
      expect(validateIcon('nonexistent-icon', 'unknown')).toBe('terminal')
    })

    it('should use category default when no icon provided', () => {
      expect(validateIcon(undefined, 'npm')).toBe('package')
      expect(validateIcon('', 'git')).toBe('git-branch')
      expect(validateIcon(null as any, 'docker')).toBe('server-process')
    })

    it('should handle missing category gracefully', () => {
      expect(validateIcon('nonexistent-icon')).toBe('terminal')
      expect(validateIcon()).toBe('terminal')
    })
  })
})
