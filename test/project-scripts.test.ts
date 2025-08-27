import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { ProjectDetector } from '@src/core/detector'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('项目脚本检测', () => {
  let tempDir: string
  let detector: ProjectDetector

  beforeEach(async () => {
    // 创建临时目录
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'depcmd-test-'))
    detector = ProjectDetector.getInstance()
    // 清除检测器缓存
    detector.clearCache()
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

    // 调用私有方法进行测试
    const extractMethod = (detector as any).extractPackageJsonScripts.bind(detector)
    const scripts = await extractMethod(packageJsonPath, 'pnpm')

    expect(scripts).toHaveLength(4)
    expect(scripts).toEqual([
      { name: 'build', command: 'pnpm run build' },
      { name: 'dev', command: 'pnpm run dev' },
      { name: 'test', command: 'pnpm run test' },
      { name: 'lint', command: 'pnpm run lint' },
    ])
  })

  it('should handle package.json without scripts', async () => {
    // 创建没有 scripts 的 package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
    }

    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

    const extractMethod = (detector as any).extractPackageJsonScripts.bind(detector)
    const scripts = await extractMethod(packageJsonPath, 'npm')

    expect(scripts).toHaveLength(0)
  })

  it('should handle invalid package.json', async () => {
    // 创建无效的 package.json
    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, 'invalid json content')

    const extractMethod = (detector as any).extractPackageJsonScripts.bind(detector)
    const scripts = await extractMethod(packageJsonPath, 'npm')

    expect(scripts).toHaveLength(0)
  })

  it('should handle non-existent package.json', async () => {
    const packageJsonPath = path.join(tempDir, 'non-existent-package.json')

    const extractMethod = (detector as any).extractPackageJsonScripts.bind(detector)
    const scripts = await extractMethod(packageJsonPath, 'npm')

    expect(scripts).toHaveLength(0)
  })

  it('should not include project scripts in regular categories after detection', async () => {
    // 这个测试确保项目脚本不会影响常规分类
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        dev: 'vite dev',
        build: 'vite build',
      },
    }

    const packageJsonPath = path.join(tempDir, 'package.json')
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

    // 模拟工作区目录
    const mockWorkspace = tempDir
    const performDetectionMethod = (detector as any).performDetection.bind(detector)
    const result = await performDetectionMethod(mockWorkspace)

    // 项目脚本应该在结果中，但不应该影响分类检测
    expect(result.projectScripts).toHaveLength(2)
    expect(result.projectScripts).toEqual([
      { name: 'dev', command: 'npm run dev' },
      { name: 'build', command: 'npm run build' },
    ])
    expect(result.packageManager).toBe('npm')
  })

  it('should detect package manager correctly', async () => {
    // 测试 pnpm 检测
    const pnpmLockPath = path.join(tempDir, 'pnpm-lock.yaml')
    await fs.promises.writeFile(pnpmLockPath, 'lockfileVersion: 5.4')

    const detectMethod = (detector as any).detectPackageManager.bind(detector)
    let packageManager = await detectMethod(tempDir)
    expect(packageManager).toBe('pnpm')

    // 清理 pnpm lock 文件
    await fs.promises.unlink(pnpmLockPath)

    // 测试 yarn 检测
    const yarnLockPath = path.join(tempDir, 'yarn.lock')
    await fs.promises.writeFile(yarnLockPath, '# yarn lockfile v1')

    packageManager = await detectMethod(tempDir)
    expect(packageManager).toBe('yarn')

    // 清理 yarn lock 文件
    await fs.promises.unlink(yarnLockPath)

    // 测试 npm 检测
    const npmLockPath = path.join(tempDir, 'package-lock.json')
    await fs.promises.writeFile(npmLockPath, '{"lockfileVersion": 2}')

    packageManager = await detectMethod(tempDir)
    expect(packageManager).toBe('npm')

    // 清理 npm lock 文件
    await fs.promises.unlink(npmLockPath)

    // 测试默认情况（没有任何 lock 文件）
    packageManager = await detectMethod(tempDir)
    expect(packageManager).toBe('npm')
  })
})
