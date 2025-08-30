import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { NodeJSDetector, ProjectDetector } from '@src/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('项目脚本检测', () => {
  let tempDir: string
  let detector: ProjectDetector

  beforeEach(async () => {
    // 创建临时目录
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'depcmd-test-'))
    detector = ProjectDetector.getInstance()
    // 清除检测器缓存
    detector.clearCache()

    // Mock workspace folders
    const vscode = await import('vscode')
    vi.mocked(vscode.workspace).workspaceFolders = [
      { uri: { fsPath: tempDir } } as any,
    ]
  })

  afterEach(async () => {
    // 清理临时目录
    await fs.promises.rm(tempDir, { recursive: true })
  })

  it('should extract scripts from package.json with correct package manager', async () => {
    // 创建测试的 package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        build: 'npm run build:prod',
        dev: 'vite dev',
        test: 'vitest',
        lint: 'eslint .',
      },
    }

    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

    // 创建 pnpm-lock.yaml 来测试包管理器检测
    const pnpmLockPath = path.join(tempDir, 'pnpm-lock.yaml')
    await fs.promises.writeFile(pnpmLockPath, 'lockfileVersion: 5.4')

    // 使用 NodeJSDetector 进行测试
    const nodeDetector = new NodeJSDetector('nodejs', ['package.json'])
    const result = await nodeDetector.detect(tempDir)

    expect(result.detected).toBe(true)
    expect(result.scripts).toHaveLength(4)
    expect(result.scripts).toEqual([
      { name: 'build', command: 'pnpm run build' },
      { name: 'dev', command: 'pnpm run dev' },
      { name: 'test', command: 'pnpm run test' },
      { name: 'lint', command: 'pnpm run lint' },
    ])
    expect(result.metadata?.packageManager).toBe('pnpm')
  })

  it('should handle package.json without scripts', async () => {
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
    }

    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

    const nodeDetector = new NodeJSDetector('nodejs', ['package.json'])
    const result = await nodeDetector.detect(tempDir)

    expect(result.detected).toBe(true)
    expect(result.scripts).toHaveLength(0)
  })

  it('should handle invalid package.json', async () => {
    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, 'invalid json')

    const nodeDetector = new NodeJSDetector('nodejs', ['package.json'])
    const result = await nodeDetector.detect(tempDir)

    expect(result.detected).toBe(true) // 文件存在，但解析失败
    expect(result.scripts).toHaveLength(0)
  })

  it('should handle non-existent package.json', async () => {
    const nodeDetector = new NodeJSDetector('nodejs', ['package.json'])
    const result = await nodeDetector.detect(tempDir)

    expect(result.detected).toBe(false)
    expect(result.scripts).toHaveLength(0)
  })

  it('should not include project scripts in regular categories after detection', async () => {
    // 创建 package.json 和 npm scripts
    const packageJson = {
      name: 'test-project',
      scripts: {
        dev: 'vite dev',
        build: 'vite build',
      },
    }

    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

    // Mock 配置 - 直接通过全局mock处理
    const vscode = await import('vscode')
    const mockGetConfig = vi.fn((key: string) => {
      if (key === 'projectDetection') {
        return {
          nodejs: ['package.json'],
        }
      }
      return {}
    })

    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: mockGetConfig,
    } as any)

    // 重新初始化检测器以应用新配置
    detector.reinitialize()

    const result = await detector.detectProject(true)

    // 项目脚本应该在结果中，分类检测也应该正常工作
    expect(result.detectedCategories).toContain('nodejs')
    expect(result.projectScripts).toHaveLength(2)
    expect(result.projectScripts).toEqual([
      { name: 'dev', command: 'npm run dev' },
      { name: 'build', command: 'npm run build' },
    ])
  })

  it('should detect package manager correctly', async () => {
    // 创建基本的 package.json
    const packageJson = { name: 'test', version: '1.0.0' }
    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson))

    const nodeDetector = new NodeJSDetector('nodejs', ['package.json'])

    // 测试 pnpm
    const pnpmLockPath = path.join(tempDir, 'pnpm-lock.yaml')
    await fs.promises.writeFile(pnpmLockPath, 'lockfileVersion: 5.4')

    let result = await nodeDetector.detect(tempDir)
    expect(result.metadata?.packageManager).toBe('pnpm')

    // 清理 pnpm 文件，测试 yarn
    await fs.promises.unlink(pnpmLockPath)
    const yarnLockPath = path.join(tempDir, 'yarn.lock')
    await fs.promises.writeFile(yarnLockPath, '# yarn lockfile v1')

    result = await nodeDetector.detect(tempDir)
    expect(result.metadata?.packageManager).toBe('yarn')

    // 清理 yarn 文件，测试 npm
    await fs.promises.unlink(yarnLockPath)
    const npmLockPath = path.join(tempDir, 'package-lock.json')
    await fs.promises.writeFile(npmLockPath, '{"lockfileVersion": 1}')

    result = await nodeDetector.detect(tempDir)
    expect(result.metadata?.packageManager).toBe('npm')

    // 清理所有锁文件，测试默认值
    await fs.promises.unlink(npmLockPath)

    result = await nodeDetector.detect(tempDir)
    expect(result.metadata?.packageManager).toBe('npm') // 默认为 npm
  })
})
