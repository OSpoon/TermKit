import type {
  DetectionResult,
  DetectionRule,
  PackageManagerDefinition,
  ProjectDetectionResult,
  ProjectTypeDefinition,
} from '@src/types'
import type { ConfigManager } from './configuration'

import * as fs from 'node:fs'
import * as path from 'node:path'
import { promisify } from 'node:util'

import { logger } from '@src/utils'
import * as vscode from 'vscode'

const access = promisify(fs.access)
const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

/**
 * 通用项目检测器
 */
export class ProjectDetector {
  private static _instance: ProjectDetector
  private _configManager: ConfigManager
  private _lastDetection: ProjectDetectionResult | null = null
  private _workspaceRoot: string = ''

  private constructor(configManager: ConfigManager) {
    this._configManager = configManager
  }

  public static getInstance(configManager: ConfigManager): ProjectDetector {
    if (!ProjectDetector._instance) {
      ProjectDetector._instance = new ProjectDetector(configManager)
    }
    return ProjectDetector._instance
  }

  /**
   * 检测项目类型
   */
  public async detectProject(forceRefresh: boolean = false): Promise<ProjectDetectionResult> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return this.createEmptyResult()
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath

    // 如果工作区没有改变且不是强制刷新，返回缓存结果
    if (!forceRefresh && this._lastDetection && this._workspaceRoot === workspaceRoot) {
      return this._lastDetection
    }

    this._workspaceRoot = workspaceRoot

    const result = await this.performDetection(workspaceRoot)
    this._lastDetection = result

    return result
  }

  /**
   * 执行检测
   */
  private async performDetection(workspaceRoot: string): Promise<ProjectDetectionResult> {
    const projectTypes = this._configManager.getProjectTypes()
    const detectionResults: Array<{
      projectType: ProjectTypeDefinition
      score: number
      details: any[]
    }> = []

    // 对每种项目类型进行检测
    for (const projectType of projectTypes) {
      const result = await this.detectProjectType(workspaceRoot, projectType)
      if (result.score > 0) {
        detectionResults.push({
          projectType,
          score: result.score,
          details: result.details || [],
        })
      }
    }

    // 根据优先级和得分排序
    detectionResults.sort((a, b) => {
      const priorityDiff = (b.projectType.priority || 0) - (a.projectType.priority || 0)
      if (priorityDiff !== 0)
        return priorityDiff
      return b.score - a.score
    })

    // 应用检测策略
    const config = vscode.workspace.getConfiguration('depCmd')
    const strategy = config.get<string>('detectionStrategy', 'balanced')
    const minScore = config.get<number>('minDetectionScore', 50)

    const filteredResults = this.applyDetectionStrategy(detectionResults, strategy, minScore)

    // 构建最终结果
    return this.buildDetectionResult(workspaceRoot, filteredResults)
  }

  /**
   * 检测单个项目类型
   */
  private async detectProjectType(
    workspaceRoot: string,
    projectType: ProjectTypeDefinition,
  ): Promise<{ score: number, details: any[] }> {
    let totalScore = 0
    const details: any[] = []
    let hasRequiredRule = false
    let requiredRulePassed = false

    for (const rule of projectType.detectionRules) {
      const result = await this.executeDetectionRule(rule, workspaceRoot)
      totalScore += result.score

      details.push({
        name: rule.name,
        matched: result.matched,
        score: result.score,
        details: result.details,
      })

      if (rule.required) {
        hasRequiredRule = true
        if (result.matched) {
          requiredRulePassed = true
        }
      }
    }

    // 如果有必需规则但未通过，则得分为0
    if (hasRequiredRule && !requiredRulePassed) {
      totalScore = 0
    }

    return { score: totalScore, details }
  }

  /**
   * 执行检测规则
   */
  private async executeDetectionRule(rule: DetectionRule, workspaceRoot: string): Promise<DetectionResult> {
    const weight = rule.weight || 10

    try {
      switch (rule.type) {
        case 'file_exists':
          return await this.checkFileExists(rule, workspaceRoot, weight)

        case 'directory_exists':
          return await this.checkDirectoryExists(rule, workspaceRoot, weight)

        case 'file_content':
          return await this.checkFileContent(rule, workspaceRoot, weight)

        case 'custom':
          return await this.executeCustomRule(rule, workspaceRoot, weight)

        default:
          logger.info(`Unknown detection rule type: ${rule.type}`)
          return { matched: false, score: 0 }
      }
    }
    catch (error) {
      logger.info(`Error executing detection rule ${rule.name}:`, error)
      return { matched: false, score: 0 }
    }
  }

  /**
   * 检查文件是否存在
   */
  private async checkFileExists(rule: DetectionRule, workspaceRoot: string, weight: number): Promise<DetectionResult> {
    const filePath = path.join(workspaceRoot, rule.target)

    try {
      await access(filePath)

      // 检查排除条件
      if (rule.config?.excludeIfExists) {
        for (const excludeFile of rule.config.excludeIfExists) {
          try {
            await access(path.join(workspaceRoot, excludeFile))
            return { matched: false, score: 0, details: { excluded: excludeFile } }
          }
          catch {
            // 排除文件不存在，继续检测
          }
        }
      }

      return { matched: true, score: weight, details: { path: filePath } }
    }
    catch {
      return { matched: false, score: 0 }
    }
  }

  /**
   * 检查目录是否存在
   */
  private async checkDirectoryExists(rule: DetectionRule, workspaceRoot: string, weight: number): Promise<DetectionResult> {
    const dirPath = path.join(workspaceRoot, rule.target)

    try {
      const stats = await stat(dirPath)
      if (stats.isDirectory()) {
        return { matched: true, score: weight, details: { path: dirPath } }
      }
      return { matched: false, score: 0 }
    }
    catch {
      return { matched: false, score: 0 }
    }
  }

  /**
   * 检查文件内容
   */
  private async checkFileContent(rule: DetectionRule, workspaceRoot: string, weight: number): Promise<DetectionResult> {
    const filePath = path.join(workspaceRoot, rule.target)

    try {
      const content = await readFile(filePath, 'utf-8')
      const pattern = rule.config?.pattern

      if (!pattern) {
        return { matched: false, score: 0 }
      }

      let matched = false
      if (typeof pattern === 'string') {
        matched = content.includes(pattern)
      }
      else if (pattern instanceof RegExp) {
        matched = pattern.test(content)
      }

      return {
        matched,
        score: matched ? weight : 0,
        details: { path: filePath, pattern: pattern.toString() },
      }
    }
    catch {
      return { matched: false, score: 0 }
    }
  }

  /**
   * 执行自定义规则
   */
  private async executeCustomRule(rule: DetectionRule, workspaceRoot: string, weight: number): Promise<DetectionResult> {
    // 对于自定义规则，可以调用配置管理器中的自定义函数
    if (rule.config?.customFunction) {
      try {
        const result = await this._configManager.executeCustomFunction(rule.config.customFunction, workspaceRoot)
        return {
          matched: result,
          score: result ? weight : 0,
          details: { customFunction: rule.config.customFunction },
        }
      }
      catch (error) {
        logger.info(`Custom function ${rule.config.customFunction} failed:`, error)
        return { matched: false, score: 0 }
      }
    }

    // 默认的通配符检测
    if (rule.target === '*') {
      try {
        const files = await readdir(workspaceRoot)
        return {
          matched: files.length > 0,
          score: files.length > 0 ? weight : 0,
          details: { fileCount: files.length },
        }
      }
      catch {
        return { matched: false, score: 0 }
      }
    }

    return { matched: false, score: 0 }
  }

  /**
   * 应用检测策略
   */
  private applyDetectionStrategy(
    results: Array<{ projectType: ProjectTypeDefinition, score: number, details: any[] }>,
    strategy: string,
    minScore: number,
  ): Array<{ projectType: ProjectTypeDefinition, score: number, details: any[] }> {
    // 过滤低分结果
    const filtered = results.filter(r => r.score >= minScore)

    switch (strategy) {
      case 'aggressive':
        // 保留所有通过最低分数的结果
        return filtered

      case 'conservative':
        // 只保留最高分的结果
        return filtered.length > 0 ? [filtered[0]] : []

      case 'balanced':
      default: {
        // 保留高于平均分的结果
        if (filtered.length === 0)
          return []

        const avgScore = filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length
        return filtered.filter(r => r.score >= avgScore * 0.8)
      }
    }
  }

  /**
   * 构建检测结果
   */
  private async buildDetectionResult(
    workspaceRoot: string,
    detectionResults: Array<{ projectType: ProjectTypeDefinition, score: number, details: any[] }>,
  ): Promise<ProjectDetectionResult> {
    const detectedTypes: string[] = []
    const detectedProjectTypes: Array<{ id: string, displayName: string, score: number, confidence: number }> = []
    const detectedPackageManagers: Array<{ id: string, displayName: string, projectType: string, score: number }> = []

    let hasGit = false
    let hasDocker = false
    let primaryPackageManager: string | undefined
    let primaryPythonManager: string | undefined

    // 处理检测到的项目类型
    for (const result of detectionResults) {
      const projectType = result.projectType
      detectedTypes.push(projectType.id)

      // 计算置信度
      const maxPossibleScore = projectType.detectionRules.reduce((sum, rule) => sum + (rule.weight || 10), 0)
      const confidence = Math.round((result.score / maxPossibleScore) * 100)

      detectedProjectTypes.push({
        id: projectType.id,
        displayName: projectType.displayName,
        score: result.score,
        confidence,
      })

      // 检测包管理器
      if (projectType.packageManagers) {
        const packageManagerResults = await this.detectPackageManagers(
          workspaceRoot,
          projectType.packageManagers,
          projectType.id,
        )
        detectedPackageManagers.push(...packageManagerResults)
      }

      // 特殊处理
      if (projectType.id === 'git') {
        hasGit = true
      }
      else if (projectType.id === 'docker') {
        hasDocker = true
      }
    }

    // 确定主要的包管理器
    if (detectedPackageManagers.length > 0) {
      detectedPackageManagers.sort((a, b) => b.score - a.score)
      const topManager = detectedPackageManagers[0]

      if (['npm', 'yarn', 'pnpm', 'bun'].includes(topManager.id)) {
        primaryPackageManager = topManager.id as any
      }
      else if (['pip', 'conda', 'poetry'].includes(topManager.id)) {
        primaryPythonManager = topManager.id as any
      }
    }

    return {
      types: detectedTypes.length > 0 ? detectedTypes as any[] : ['unknown' as any],
      packageManager: primaryPackageManager as any,
      pythonManager: primaryPythonManager as any,
      hasGit,
      hasDocker,
      workspaceRoot,
      detectedProjectTypes,
      detectedPackageManagers,
      detectionDetails: detectionResults.map(r => ({
        projectType: r.projectType.id,
        rules: r.details,
      })),
    }
  }

  /**
   * 检测包管理器
   */
  private async detectPackageManagers(
    workspaceRoot: string,
    packageManagers: PackageManagerDefinition[],
    projectTypeId: string,
  ): Promise<Array<{ id: string, displayName: string, projectType: string, score: number }>> {
    const results: Array<{ id: string, displayName: string, projectType: string, score: number }> = []

    for (const pm of packageManagers) {
      let totalScore = 0

      for (const rule of pm.detectionRules) {
        const result = await this.executeDetectionRule(rule, workspaceRoot)
        totalScore += result.score
      }

      if (totalScore > 0) {
        results.push({
          id: pm.id,
          displayName: pm.displayName,
          projectType: projectTypeId,
          score: totalScore,
        })
      }
    }

    return results
  }

  /**
   * 创建空结果
   */
  private createEmptyResult(): ProjectDetectionResult {
    return {
      types: ['unknown' as any],
      hasGit: false,
      hasDocker: false,
      workspaceRoot: '',
      detectedProjectTypes: [],
      detectedPackageManagers: [],
    }
  }

  /**
   * 获取当前检测结果
   */
  public getCurrentDetection(): ProjectDetectionResult | null {
    return this._lastDetection
  }

  /**
   * 获取项目类型显示名称
   */
  public getProjectTypeDisplayName(typeId: string): string {
    const projectType = this._configManager.getProjectType(typeId)
    return projectType?.displayName || typeId.charAt(0).toUpperCase() + typeId.slice(1)
  }
}
