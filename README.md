# DepCmd - 开发命令管理器

<p align="center">
<a href="https://github.com/OSpoon/DepCmd">
<img src="https://github.com/OSpoon/DepCmd/blob/main/res/icon.png?raw=true" alt="logo" width='126'/>
</a>
</p>

<p align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/ospoon.dep-cmd.svg?color=blue&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/d/ospoon.dep-cmd.svg?color=4bdbe3" alt="Visual Studio Marketplace Downloads" /></a>
<a href="https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/i/ospoon.dep-cmd.svg?color=63ba83" alt="Visual Studio Marketplace Installs" /></a>
</p>

一个专为开发者设计的 VS Code 扩展，旨在简化开发阶段各种终端命令的使用，减少记忆负担，提高开发效率。通过智能的项目检测和分类管理，让你告别命令行的繁琐记忆。

<p align='center'>
  <img src="https://github.com/OSpoon/DepCmd/blob/main/screenshots/preview.png?raw=true" alt='preview'>
</p>

## ✨ 核心特性

### 🤖 智能项目检测
- **自动识别项目类型**: 自动检测 npm/yarn/pnpm、Python、Rust、Go、Docker、Git 等项目
- **上下文相关命令**: 根据当前项目类型智能显示相关命令
- **配置灵活**: 支持自定义项目检测规则

### 🗂️ 强大的命令管理
- **分类管理**: 按技术栈和用途分类管理命令
- **完整的 CRUD 操作**: 轻松添加、编辑、删除命令和分类
- **批量操作**: 支持批量导入导出命令数据

### 🔍 高效的搜索与操作
- **快速搜索**: 实时搜索命令标题、命令内容、描述和分类
- **一键执行**: 点击即可将命令发送到终端执行
- **复制命令**: 快速复制命令到剪贴板

### 💾 现代化数据存储
- **云端同步**: 基于 VS Code 设置同步，数据自动跨设备同步
- **数据持久化**: 使用 VS Code 原生 globalState API，稳定可靠
- **导入导出**: 支持 JSON 格式的数据备份和迁移

## 🛠️ 支持的技术栈

| 技术栈 | 检测文件 | 预置命令示例 |
|--------|----------|-------------|
| **NPM** | `package-lock.json` | install, dev, build, test |
| **Yarn** | `yarn.lock` | install, dev, build |
| **PNPM** | `pnpm-lock.yaml` | install, dev, build |
| **Python** | `requirements.txt`, `pyproject.toml`, `setup.py` | pip install, python run |
| **Rust** | `Cargo.toml` | cargo build, cargo run |
| **Go** | `go.mod` | go build, go run |
| **Docker** | `Dockerfile`, `docker-compose.yml` | docker build, docker run |
| **Git** | `.git/` | git status, git add, git commit |

## 📋 命令面板

通过 VS Code 命令面板 (`Ctrl/Cmd + Shift + P`) 访问以下命令：

<!-- commands -->

| Command                         | Title                                           |
| ------------------------------- | ----------------------------------------------- |
| `depCmd.sendToTerminal`         | Send to Terminal                                |
| `depCmd.refreshView`            | Refresh                                         |
| `depCmd.searchCommands`         | Search Commands                                 |
| `depCmd.copyCommand`            | Copy Command                                    |
| `depCmd.editCommand`            | Edit Command                                    |
| `depCmd.deleteCommand`          | Delete Command                                  |
| `depCmd.addCommand`             | Add New Command                                 |
| `depCmd.editCategory`           | Dependencies Commands: Rename Category          |
| `depCmd.deleteCategory`         | Dependencies Commands: Delete Category          |
| `depCmd.toggleProjectDetection` | Dependencies Commands: Toggle Project Detection |
| `depCmd.clearAllData`           | Dependencies Commands: Clear All Command Data   |
| `depCmd.exportData`             | Dependencies Commands: Export Command Data      |
| `depCmd.importData`             | Dependencies Commands: Import Command Data      |

<!-- commands -->

## ⚙️ 配置选项

<!-- configs -->

| Key                             | Description                                                                                                                  | Type      | Default          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------- |
| `depCmd.enableProjectDetection` | Enable automatic project detection to filter commands based on project type                                                  | `boolean` | `true`           |
| `depCmd.defaultCategory`        | Default category to display (all or specific category name)                                                                  | `string`  | `"all"`          |
| `depCmd.projectDetection`       | Simple project detection mapping: each key is a command category, and the value is an array of files/directories to look for | `object`  | See package.json |

<!-- configs -->

### 配置说明

- **`enableProjectDetection`**: 启用/禁用自动项目检测
- **`defaultCategory`**: 默认显示的命令分类
- **`projectDetection`**: 自定义项目检测规则，可以添加新的技术栈

## 🚀 快速开始

1. **安装扩展**: 在 VS Code 扩展市场搜索 "DepCmd" 并安装
2. **打开命令面板**: 在活动栏中点击 DepCmd 图标
3. **添加命令**: 点击 "+" 按钮添加你的第一个命令
4. **一键执行**: 点击命令即可在终端中执行

## 📊 数据管理

### 导出数据
点击导出按钮，选择保存位置，数据将以 JSON 格式保存：

```json
{
  "commands": [
    {
      "id": 1,
      "label": "Install Dependencies",
      "command": "npm install",
      "description": "Install project dependencies",
      "category": "npm",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### 导入数据
- **合并模式**: 与现有命令合并，保留原有数据
- **替换模式**: 完全替换现有数据

### 跨设备同步
开启 VS Code 设置同步功能，命令数据将自动在所有设备间同步。

## 🔧 开发相关

### 技术栈
- **TypeScript**: 主要开发语言
- **VS Code Extension API**: 扩展开发框架
- **Reactive VSCode**: 响应式编程支持
- **Vitest**: 单元测试框架

### 项目结构
```
src/
├── core/           # 核心业务逻辑
│   ├── manager.ts  # 命令管理器
│   ├── detector.ts # 项目检测器
│   └── config.ts   # 配置管理
├── data/           # 数据层
│   └── database.ts # 数据库管理
├── ui/             # 用户界面
│   ├── provider.ts # 树视图提供者
│   └── commands.ts # 命令处理
├── types/          # 类型定义
└── utils/          # 工具函数
```

### 构建和测试
```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！请查看 [贡献指南](CONTRIBUTING.md) 了解更多信息。

## 📄 许可证

[MIT](./LICENSE.md) License © 2025 [OSpoon](https://github.com/OSpoon)

---

<p align="center">
  <a href="https://github.com/sponsors/OSpoon">💖 赞助作者</a>
</p>
