import type { PackageJsonScript, PackageManager, ProjectTypeDetectionResult } from '@src/types'

import * as fs from 'node:fs'
import * as path from 'node:path'

import { BaseProjectDetector } from '@src/types'
import { logger } from '@src/utils'

/**
 * Node.js 项目检测器
 * 检测基于 package.json 的 JavaScript/TypeScript 项目
 */
export class NodeJSDetector extends BaseProjectDetector {
  constructor(type: string, patterns: string[], priority: number = 10) {
    super(type, patterns, priority)
  }

  public async detect(workspaceRoot: string): Promise<ProjectTypeDetectionResult> {
    const { detected, matchedPatterns } = await this.checkPatterns(workspaceRoot, this.patterns)

    if (!detected) {
      return this.createResult(false)
    }

    const packageJsonPath = path.join(workspaceRoot, 'package.json')
    const scripts = await this.extractPackageJsonScripts(packageJsonPath)
    const packageManager = await this.detectPackageManager(workspaceRoot)

    const metadata = {
      packageManager,
      scriptsCount: scripts.length,
    }

    return this.createResult(detected, matchedPatterns, scripts, metadata)
  }

  /**
   * 提取 package.json 中的 scripts
   */
  private async extractPackageJsonScripts(packageJsonPath: string): Promise<PackageJsonScript[]> {
    try {
      const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      if (!packageJson.scripts || typeof packageJson.scripts !== 'object') {
        return []
      }

      const packageManager = await this.detectPackageManager(path.dirname(packageJsonPath))
      const scripts: PackageJsonScript[] = []

      for (const [name, command] of Object.entries(packageJson.scripts)) {
        if (typeof command === 'string') {
          // 根据包管理器生成正确的执行命令
          const runCommand = `${packageManager} run ${name}`
          scripts.push({
            name,
            command: runCommand,
          })
        }
      }

      return scripts
    }
    catch (error) {
      logger.error(`Failed to parse package.json at ${packageJsonPath}:`, error)
      return []
    }
  }

  /**
   * 检测包管理器类型
   */
  private async detectPackageManager(workspaceRoot: string): Promise<PackageManager> {
    try {
      // 按优先级检测包管理器
      const pnpmLockPath = path.join(workspaceRoot, 'pnpm-lock.yaml')
      const yarnLockPath = path.join(workspaceRoot, 'yarn.lock')
      const npmLockPath = path.join(workspaceRoot, 'package-lock.json')

      // 检查 pnpm
      try {
        const pnpmStats = await fs.promises.stat(pnpmLockPath)
        if (pnpmStats.isFile()) {
          return 'pnpm'
        }
      }
      catch {
        // pnpm-lock.yaml 不存在，继续检查其他
      }

      // 检查 yarn
      try {
        const yarnStats = await fs.promises.stat(yarnLockPath)
        if (yarnStats.isFile()) {
          return 'yarn'
        }
      }
      catch {
        // yarn.lock 不存在，继续检查其他
      }

      // 检查 npm
      try {
        const npmStats = await fs.promises.stat(npmLockPath)
        if (npmStats.isFile()) {
          return 'npm'
        }
      }
      catch {
        // package-lock.json 不存在
      }

      // 默认返回 npm
      return 'npm'
    }
    catch (error) {
      logger.error(`Failed to detect package manager:`, error)
      return 'npm'
    }
  }
}
