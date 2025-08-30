// 命令相关类型
export type {
  CategoryDefinition,
  CommandDefinition,
  CommandsData,
  UserCommand,
} from './command'

// 检测器相关类型
export type {
  DetectionResult,
  DetectorConfig,
  IProjectDetector,
  PackageJsonScript,
  PackageManager,
  ProjectTypeDetectionResult,
} from './detector'

// 检测器基类（作为类导出，不是类型）
export { BaseProjectDetector } from './detector'
