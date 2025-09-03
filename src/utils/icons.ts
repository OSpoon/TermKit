/**
 * VS Code 支持的常用图标列表
 * 来源：https://code.visualstudio.com/api/references/icons-in-labels
 */
const SUPPORTED_ICONS = new Set([
  // 常用基础图标
  'gear',
  'settings',
  'terminal',
  'package',
  'folder',
  'file',
  'home',
  'add',
  'plus',
  'remove',
  'trash',
  'delete',
  'edit',
  'pencil',
  'copy',
  'clipboard',
  'search',
  'eye',
  'close',
  'x',

  // Git 相关
  'git-branch',
  'git-commit',
  'git-pull-request',
  'git-merge',
  'cloud-upload',
  'cloud-download',
  'repo',
  'source-control',

  // 开发工具
  'debug',
  'bug',
  'play',
  'stop',
  'pause',
  'refresh',
  'pulse',
  'clock',
  'watch',
  'history',
  'timeline',

  // 导航和界面
  'arrow-up',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'arrow-swap',
  'chevron-up',
  'chevron-down',
  'chevron-left',
  'chevron-right',

  // 文件和文件夹
  'folder-opened',
  'folder-closed',
  'file-text',
  'file-code',
  'file-binary',
  'file-media',
  'file-zip',

  // 网络和连接
  'globe',
  'link',
  'server',
  'server-process',
  'database',
  'cloud',
  'rss',
  'broadcast',

  // 状态和通知
  'check',
  'error',
  'warning',
  'info',
  'question',
  'star',
  'heart',
  'bookmark',
  'tag',

  // 列表和表格
  'list-unordered',
  'list-ordered',
  'list-flat',
  'list-tree',
  'table',
  'organization',

  // 媒体控制
  'play-circle',
  'stop-circle',
  'record',
  'recording',

  // 扩展相关
  'extensions',
  'puzzle',
  'tools',
  'wrench',

  // 其他常用
  'bell',
  'megaphone',
  'comment',
  'mail',
  'person',
  'key',
  'lock',
  'unlock',
  'shield',
  'verified',
  'symbol-class',
  'symbol-method',
  'symbol-function',
  'symbol-variable',
  'symbol-property',
  'symbol-enum',
])

/**
 * 图标分类映射，用于为不同类型的命令提供合适的默认图标
 */
const ICON_CATEGORY_MAP: Record<string, string> = {
  // 包管理器
  npm: 'package',
  yarn: 'package',
  pnpm: 'package',
  nrm: 'settings',

  // 版本控制
  git: 'git-branch',

  // 容器化
  docker: 'server-process',

  // 编程语言
  python: 'symbol-class',
  rust: 'gear',
  go: 'symbol-function',
  nodejs: 'symbol-method',

  // 默认
  default: 'terminal',
}

/**
 * 验证图标是否被 VS Code 支持，如果不支持则返回合适的兜底图标
 * @param icon 要验证的图标名称
 * @param category 命令分类，用于选择合适的兜底图标
 * @returns 有效的图标名称
 */
export function validateIcon(icon?: string, category?: string): string {
  // 如果没有提供图标，使用分类默认图标
  if (!icon) {
    return getDefaultIconByCategory(category)
  }

  // 如果图标被支持，直接返回
  if (SUPPORTED_ICONS.has(icon)) {
    return icon
  }

  // 尝试一些常见的图标映射
  const iconMappings: Record<string, string> = {
    'stopwatch': 'clock',
    'unlink': 'close',
    'snake': 'symbol-class',
    'go': 'symbol-function',
    'settings-gear': 'settings',
    'terminal-cmd': 'terminal',
    'package-manager': 'package',
  }

  const mappedIcon = iconMappings[icon]
  if (mappedIcon && SUPPORTED_ICONS.has(mappedIcon)) {
    return mappedIcon
  }

  // 最后兜底：根据分类返回合适的图标
  return getDefaultIconByCategory(category)
}

/**
 * 根据分类获取默认图标
 * @param category 命令分类
 * @returns 默认图标名称
 */
export function getDefaultIconByCategory(category?: string): string {
  if (!category) {
    return ICON_CATEGORY_MAP.default
  }

  return ICON_CATEGORY_MAP[category.toLowerCase()] || ICON_CATEGORY_MAP.default
}

/**
 * 检查图标是否被 VS Code 支持
 * @param icon 图标名称
 * @returns 是否支持
 */
export function isIconSupported(icon: string): boolean {
  return SUPPORTED_ICONS.has(icon)
}

/**
 * 获取所有支持的图标列表，用于图标选择器
 * @returns 图标列表，包含显示标签和值
 */
export function getSupportedIconsForPicker(): Array<{ label: string, value: string }> {
  return Array.from(SUPPORTED_ICONS)
    .sort()
    .map(icon => ({
      label: `$(${icon}) ${icon}`,
      value: icon,
    }))
}

/**
 * 获取分类的常用图标列表
 * @returns 常用图标列表
 */
export function getCommonCategoryIcons(): Array<{ label: string, value: string }> {
  const commonIcons = [
    'package',
    'gear',
    'settings',
    'terminal',
    'git-branch',
    'server-process',
    'symbol-class',
    'symbol-function',
    'symbol-method',
    'tools',
    'database',
    'cloud',
    'globe',
    'extensions',
    'folder',
    'file-code',
  ]

  return commonIcons.map(icon => ({
    label: `$(${icon}) ${icon}`,
    value: icon,
  }))
}
