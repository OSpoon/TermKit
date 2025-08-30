import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { GoDetector, NodeJSDetector, PythonDetector, RustDetector } from '@src/core/detectors'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('command Extraction Tests', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'depcmd-test-'))
  })

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true })
  })

  describe('nodeJS Detector', () => {
    it('should extract scripts from package.json', async () => {
      const packageJson = {
        name: 'test-project',
        scripts: {
          build: 'tsc',
          start: 'node dist/index.js',
          test: 'jest',
          dev: 'ts-node src/index.ts',
        },
      }

      await fs.promises.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2),
      )

      const detector = new NodeJSDetector('nodejs', ['package.json'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      expect(result.scripts).toHaveLength(4)
      expect(result.scripts?.find(s => s.name === 'build')?.command).toBe('npm run build')
      expect(result.scripts?.find(s => s.name === 'start')?.command).toBe('npm run start')
    })
  })

  describe('python Detector', () => {
    it('should extract basic Python commands', async () => {
      await fs.promises.writeFile(path.join(tempDir, 'requirements.txt'), 'django>=4.0\n')

      const detector = new PythonDetector('python', ['requirements.txt'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      expect(result.scripts).toBeDefined()
      expect(result.scripts!.length).toBeGreaterThan(0)

      const commandNames = result.scripts!.map(s => s.name)
      expect(commandNames).toContain('run')
      expect(commandNames).toContain('install')
    })

    it('should detect Django project and add Django commands', async () => {
      await fs.promises.writeFile(path.join(tempDir, 'requirements.txt'), 'django>=4.0\n')
      await fs.promises.writeFile(path.join(tempDir, 'manage.py'), '#!/usr/bin/env python\n')

      const detector = new PythonDetector('python', ['requirements.txt'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      const commandNames = result.scripts!.map(s => s.name)
      expect(commandNames).toContain('django-run')
      expect(commandNames).toContain('django-migrate')
    })

    it('should extract Poetry scripts', async () => {
      const pyprojectToml = `
[tool.poetry]
name = "test-project"

[tool.poetry.scripts]
start = "app:main"
dev = "app:dev"
test = "pytest"
`
      await fs.promises.writeFile(path.join(tempDir, 'pyproject.toml'), pyprojectToml)

      const detector = new PythonDetector('python', ['pyproject.toml'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      const poetryScripts = result.scripts!.filter(s => s.name.startsWith('poetry-'))
      expect(poetryScripts.length).toBeGreaterThan(0)
    })
  })

  describe('rust Detector', () => {
    it('should extract basic Rust commands', async () => {
      const cargoToml = `
[package]
name = "test-project"
version = "0.1.0"
edition = "2021"
`
      await fs.promises.writeFile(path.join(tempDir, 'Cargo.toml'), cargoToml)

      const detector = new RustDetector('rust', ['Cargo.toml'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      expect(result.scripts).toBeDefined()
      expect(result.scripts!.length).toBeGreaterThan(0)

      const commandNames = result.scripts!.map(s => s.name)
      expect(commandNames).toContain('build')
      expect(commandNames).toContain('run')
      expect(commandNames).toContain('test')
    })

    it('should detect multiple binary targets', async () => {
      const cargoToml = `
[package]
name = "test-project"

[[bin]]
name = "server"
path = "src/bin/server.rs"

[[bin]]
name = "client"
path = "src/bin/client.rs"
`
      await fs.promises.writeFile(path.join(tempDir, 'Cargo.toml'), cargoToml)

      const detector = new RustDetector('rust', ['Cargo.toml'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      const commandNames = result.scripts!.map(s => s.name)
      expect(commandNames).toContain('run-server')
      expect(commandNames).toContain('run-client')
    })
  })

  describe('go Detector', () => {
    it('should extract basic Go commands', async () => {
      const goMod = `
module github.com/test/project

go 1.21
`
      await fs.promises.writeFile(path.join(tempDir, 'go.mod'), goMod)

      const detector = new GoDetector('go', ['go.mod'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      expect(result.scripts).toBeDefined()
      expect(result.scripts!.length).toBeGreaterThan(0)

      const commandNames = result.scripts!.map(s => s.name)
      expect(commandNames).toContain('build')
      expect(commandNames).toContain('run')
      expect(commandNames).toContain('test')
    })

    it('should detect main.go and add specific run command', async () => {
      const goMod = 'module test\ngo 1.21\n'
      await fs.promises.writeFile(path.join(tempDir, 'go.mod'), goMod)
      await fs.promises.writeFile(path.join(tempDir, 'main.go'), 'package main\n')

      const detector = new GoDetector('go', ['go.mod'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      const commandNames = result.scripts!.map(s => s.name)
      expect(commandNames).toContain('run-main')
    })

    it('should detect cmd directory structure', async () => {
      const goMod = 'module test\ngo 1.21\n'
      await fs.promises.writeFile(path.join(tempDir, 'go.mod'), goMod)

      // 创建 cmd 目录结构
      await fs.promises.mkdir(path.join(tempDir, 'cmd', 'server'), { recursive: true })
      await fs.promises.mkdir(path.join(tempDir, 'cmd', 'client'), { recursive: true })

      const detector = new GoDetector('go', ['go.mod'])
      const result = await detector.detect(tempDir)

      expect(result.detected).toBe(true)
      const commandNames = result.scripts!.map(s => s.name)
      expect(commandNames).toContain('run-server')
      expect(commandNames).toContain('run-client')
    })
  })
})
