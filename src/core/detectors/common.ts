import type { PackageJsonScript, ProjectTypeDetectionResult } from '@src/types'

import * as fs from 'node:fs'
import * as path from 'node:path'

import { BaseProjectDetector } from '@src/types/detector'
import { logger } from '@src/utils'

/**
 * Python 项目检测器
 * 检测基于 requirements.txt, pyproject.toml, setup.py 等的 Python 项目
 */
export class PythonDetector extends BaseProjectDetector {
  constructor(
    type: string,
    patterns: string[],
    priority: number = 20,
  ) {
    super(type, patterns, priority)
  }

  public async detect(workspaceRoot: string): Promise<ProjectTypeDetectionResult> {
    const { detected, matchedPatterns } = await this.checkPatterns(workspaceRoot, this.patterns)

    if (!detected) {
      return this.createResult(false)
    }

    const packageManager = this.inferPackageManager(matchedPatterns)
    const scripts = await this.extractPythonCommands(workspaceRoot, packageManager)

    const metadata = {
      configFiles: matchedPatterns,
      packageManager,
      scriptsCount: scripts.length,
    }

    return this.createResult(detected, matchedPatterns, scripts, metadata)
  }

  /**
   * 根据检测到的文件推断包管理器
   */
  private inferPackageManager(matchedPatterns: string[]): string {
    if (matchedPatterns.includes('Pipfile')) {
      return 'pipenv'
    }
    if (matchedPatterns.includes('pyproject.toml')) {
      return 'poetry'
    }
    if (matchedPatterns.includes('requirements.txt')) {
      return 'pip'
    }
    return 'pip'
  }

  /**
   * 提取 Python 项目的常用命令
   */
  private async extractPythonCommands(workspaceRoot: string, packageManager: string): Promise<PackageJsonScript[]> {
    const commands: PackageJsonScript[] = []

    try {
      // 基础命令
      if (packageManager === 'poetry') {
        commands.push(
          { name: 'install', command: 'poetry install' },
          { name: 'run', command: 'poetry run python main.py' },
          { name: 'shell', command: 'poetry shell' },
          { name: 'test', command: 'poetry run pytest' },
        )
      }
      else if (packageManager === 'pipenv') {
        commands.push(
          { name: 'install', command: 'pipenv install' },
          { name: 'run', command: 'pipenv run python main.py' },
          { name: 'shell', command: 'pipenv shell' },
          { name: 'test', command: 'pipenv run pytest' },
        )
      }
      else {
        // pip
        commands.push(
          { name: 'install', command: 'pip install -r requirements.txt' },
          { name: 'run', command: 'python main.py' },
          { name: 'test', command: 'pytest' },
        )
      }

      // 检查是否有 Django 项目
      const managePyPath = path.join(workspaceRoot, 'manage.py')
      if (await this.fileExists(managePyPath)) {
        commands.push(
          { name: 'django-run', command: 'python manage.py runserver' },
          { name: 'django-migrate', command: 'python manage.py migrate' },
          { name: 'django-shell', command: 'python manage.py shell' },
        )
      }

      // 检查是否有 Flask 应用
      const appPyPath = path.join(workspaceRoot, 'app.py')
      if (await this.fileExists(appPyPath)) {
        commands.push({ name: 'flask-run', command: 'flask run' })
      }

      // 检查 pyproject.toml 中的脚本
      if (packageManager === 'poetry') {
        const poetryScripts = await this.extractPoetryScripts(workspaceRoot)
        commands.push(...poetryScripts)
      }
    }
    catch (error) {
      logger.error('Failed to extract Python commands:', error)
    }

    return commands
  }

  /**
   * 提取 Poetry 项目中定义的脚本
   */
  private async extractPoetryScripts(workspaceRoot: string): Promise<PackageJsonScript[]> {
    try {
      const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml')
      if (!await this.fileExists(pyprojectPath)) {
        return []
      }

      const content = await fs.promises.readFile(pyprojectPath, 'utf-8')
      const scripts: PackageJsonScript[] = []

      // 简单的 TOML 解析 - 查找 [tool.poetry.scripts] 部分
      const scriptSectionMatch = content.match(/\[tool\.poetry\.scripts\]([\s\S]*?)(?=\n\[|$)/)
      if (scriptSectionMatch) {
        const scriptSection = scriptSectionMatch[1]
        const scriptLines = scriptSection.split('\n')

        for (const line of scriptLines) {
          const match = line.match(/^(\w+)\s*=\s*["']([^"']+)["']/)
          if (match) {
            const [, name, command] = match
            scripts.push({ name: `poetry-${name}`, command: `poetry run ${command}` })
          }
        }
      }

      return scripts
    }
    catch (error) {
      logger.error('Failed to parse pyproject.toml scripts:', error)
      return []
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath)
      return true
    }
    catch {
      return false
    }
  }
}

/**
 * Rust 项目检测器
 * 检测基于 Cargo.toml 的 Rust 项目
 */
export class RustDetector extends BaseProjectDetector {
  constructor(
    type: string,
    patterns: string[],
    priority: number = 20,
  ) {
    super(type, patterns, priority)
  }

  public async detect(workspaceRoot: string): Promise<ProjectTypeDetectionResult> {
    const { detected, matchedPatterns } = await this.checkPatterns(workspaceRoot, this.patterns)

    if (!detected) {
      return this.createResult(false)
    }

    const scripts = await this.extractRustCommands(workspaceRoot)

    const metadata = {
      packageManager: 'cargo',
      scriptsCount: scripts.length,
    }

    return this.createResult(detected, matchedPatterns, scripts, metadata)
  }

  /**
   * 提取 Rust 项目的常用命令
   */
  private async extractRustCommands(workspaceRoot: string): Promise<PackageJsonScript[]> {
    const commands: PackageJsonScript[] = []

    try {
      // 基础 Cargo 命令
      commands.push(
        { name: 'build', command: 'cargo build' },
        { name: 'run', command: 'cargo run' },
        { name: 'test', command: 'cargo test' },
        { name: 'check', command: 'cargo check' },
        { name: 'build-release', command: 'cargo build --release' },
        { name: 'run-release', command: 'cargo run --release' },
      )

      // 检查是否有多个二进制目标
      const cargoTomlPath = path.join(workspaceRoot, 'Cargo.toml')
      const cargoContent = await fs.promises.readFile(cargoTomlPath, 'utf-8')

      // 简单解析查找 [[bin]] 部分
      const binMatches = cargoContent.match(/\[\[bin\]\]\s*name\s*=\s*["']([^"']+)["']/g)
      if (binMatches) {
        for (const match of binMatches) {
          const nameMatch = match.match(/name\s*=\s*["']([^"']+)["']/)
          if (nameMatch) {
            const binName = nameMatch[1]
            commands.push({ name: `run-${binName}`, command: `cargo run --bin ${binName}` })
          }
        }
      }

      // 检查是否有工作空间
      if (cargoContent.includes('[workspace]')) {
        commands.push(
          { name: 'workspace-build', command: 'cargo build --workspace' },
          { name: 'workspace-test', command: 'cargo test --workspace' },
        )
      }
    }
    catch (error) {
      logger.error('Failed to extract Rust commands:', error)
    }

    return commands
  }
}

/**
 * Go 项目检测器
 * 检测基于 go.mod 的 Go 项目
 */
export class GoDetector extends BaseProjectDetector {
  constructor(
    type: string,
    patterns: string[],
    priority: number = 20,
  ) {
    super(type, patterns, priority)
  }

  public async detect(workspaceRoot: string): Promise<ProjectTypeDetectionResult> {
    const { detected, matchedPatterns } = await this.checkPatterns(workspaceRoot, this.patterns)

    if (!detected) {
      return this.createResult(false)
    }

    const scripts = await this.extractGoCommands(workspaceRoot)

    const metadata = {
      packageManager: 'go',
      scriptsCount: scripts.length,
    }

    return this.createResult(detected, matchedPatterns, scripts, metadata)
  }

  /**
   * 提取 Go 项目的常用命令
   */
  private async extractGoCommands(workspaceRoot: string): Promise<PackageJsonScript[]> {
    const commands: PackageJsonScript[] = []

    try {
      // 基础 Go 命令
      commands.push(
        { name: 'build', command: 'go build' },
        { name: 'run', command: 'go run .' },
        { name: 'test', command: 'go test ./...' },
        { name: 'mod-tidy', command: 'go mod tidy' },
        { name: 'mod-download', command: 'go mod download' },
        { name: 'vet', command: 'go vet ./...' },
        { name: 'fmt', command: 'go fmt ./...' },
      )

      // 检查是否有 main.go
      const mainGoPath = path.join(workspaceRoot, 'main.go')
      if (await this.fileExists(mainGoPath)) {
        commands.push({ name: 'run-main', command: 'go run main.go' })
      }

      // 检查是否有 cmd 目录（常见的 Go 项目结构）
      const cmdDir = path.join(workspaceRoot, 'cmd')
      if (await this.directoryExists(cmdDir)) {
        try {
          const cmdSubdirs = await fs.promises.readdir(cmdDir, { withFileTypes: true })
          for (const dirent of cmdSubdirs) {
            if (dirent.isDirectory()) {
              commands.push({
                name: `run-${dirent.name}`,
                command: `go run ./cmd/${dirent.name}`,
              })
            }
          }
        }
        catch {
          // 忽略读取错误
        }
      }

      // 检查是否有 Makefile
      const makefilePath = path.join(workspaceRoot, 'Makefile')
      if (await this.fileExists(makefilePath)) {
        commands.push({ name: 'make', command: 'make' })

        // 尝试解析 Makefile 中的目标
        try {
          const makefileContent = await fs.promises.readFile(makefilePath, 'utf-8')
          const targets = makefileContent.match(/^([\w-]+):/gm)
          if (targets) {
            for (const target of targets.slice(0, 5)) { // 限制数量
              const targetName = target.replace(':', '')
              if (!['all', 'clean', 'help'].includes(targetName)) {
                commands.push({ name: `make-${targetName}`, command: `make ${targetName}` })
              }
            }
          }
        }
        catch {
          // 忽略解析错误
        }
      }
    }
    catch (error) {
      logger.error('Failed to extract Go commands:', error)
    }

    return commands
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(filePath)
      return stat.isFile()
    }
    catch {
      return false
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(dirPath)
      return stat.isDirectory()
    }
    catch {
      return false
    }
  }
}
