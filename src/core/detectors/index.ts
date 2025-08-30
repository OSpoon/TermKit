// 导出所有检测器
export {
  GoDetector,
  PythonDetector,
  RustDetector,
} from './common'
export { NodeJSDetector } from './nodejs'

// 检测器类型映射
export const DETECTOR_TYPES = {
  NODEJS: 'nodejs',
  PYTHON: 'python',
  RUST: 'rust',
  GO: 'go',
  NPM: 'npm',
  YARN: 'yarn',
  PNPM: 'pnpm',
} as const

export type DetectorType = typeof DETECTOR_TYPES[keyof typeof DETECTOR_TYPES]
