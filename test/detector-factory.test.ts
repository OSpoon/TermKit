import {
  GoDetector,
  NodeJSDetector,
  ProjectDetectorFactory,
  PythonDetector,
  RustDetector,
} from '@src/core'
import { describe, expect, it } from 'vitest'

describe('项目检测器工厂', () => {
  it('应该能够创建工厂实例', () => {
    const factory = ProjectDetectorFactory.getInstance()
    expect(factory).toBeDefined()
  })

  it('应该能够注册检测器', () => {
    const factory = ProjectDetectorFactory.getInstance()

    factory.registerDetector('test-nodejs', NodeJSDetector)
    factory.registerDetector('test-python', PythonDetector)

    expect(factory.supportsType('test-nodejs')).toBe(false) // 注册了但未创建实例

    // 创建检测器实例
    const nodeDetector = factory.createDetector({
      type: 'test-nodejs',
      patterns: ['package.json'],
      priority: 10,
    })

    expect(nodeDetector).toBeDefined()
    expect(factory.supportsType('test-nodejs')).toBe(true)
  })

  it('应该能够按优先级排序检测器', () => {
    const factory = ProjectDetectorFactory.getInstance()

    // 清除现有检测器
    factory.clearDetectors()

    // 注册不同优先级的检测器
    factory.registerDetector('high-priority', NodeJSDetector)
    factory.registerDetector('low-priority', PythonDetector)

    factory.createDetector({
      type: 'high-priority',
      patterns: ['package.json'],
      priority: 5,
    })

    factory.createDetector({
      type: 'low-priority',
      patterns: ['requirements.txt'],
      priority: 10,
    })

    const sortedDetectors = factory.getDetectorsByPriority()
    expect(sortedDetectors).toHaveLength(2)
    expect(sortedDetectors[0].priority).toBeLessThanOrEqual(sortedDetectors[1].priority)
  })

  it('应该能够获取检测器统计信息', () => {
    const factory = ProjectDetectorFactory.getInstance()
    factory.clearDetectors()

    factory.registerDetector('nodejs', NodeJSDetector)
    factory.registerDetector('python', PythonDetector)
    factory.registerDetector('rust', RustDetector)

    factory.createDetector({ type: 'nodejs', patterns: ['package.json'] })
    factory.createDetector({ type: 'python', patterns: ['requirements.txt'] })

    const stats = factory.getStats()

    expect(stats.totalDetectors).toBe(2)
    expect(stats.constructorCount).toBeGreaterThanOrEqual(3) // 因为工厂是单例，可能有之前的注册
    expect(stats.registeredTypes).toContain('nodejs')
    expect(stats.registeredTypes).toContain('python')
  })
})

describe('具体检测器测试', () => {
  it('nodeJS检测器应该正确设置类型和模式', () => {
    const detector = new NodeJSDetector('nodejs', ['package.json'])

    expect(detector.type).toBe('nodejs')
    expect(detector.priority).toBe(10)
    expect(detector.getSupportedPatterns()).toContain('package.json')
    expect(detector.canHandle('nodejs')).toBe(true)
    expect(detector.canHandle('python')).toBe(false)
  })

  it('python检测器应该正确设置类型和模式', () => {
    const detector = new PythonDetector('python', ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'])

    expect(detector.type).toBe('python')
    expect(detector.priority).toBe(20)
    const patterns = detector.getSupportedPatterns()
    expect(patterns).toContain('requirements.txt')
    expect(patterns).toContain('pyproject.toml')
    expect(patterns).toContain('setup.py')
    expect(patterns).toContain('Pipfile')
  })

  it('rust检测器应该正确设置类型和模式', () => {
    const detector = new RustDetector('rust', ['Cargo.toml'])

    expect(detector.type).toBe('rust')
    expect(detector.getSupportedPatterns()).toContain('Cargo.toml')
  })

  it('go检测器应该正确设置类型和模式', () => {
    const detector = new GoDetector('go', ['go.mod'])

    expect(detector.type).toBe('go')
    expect(detector.getSupportedPatterns()).toContain('go.mod')
  })
})
