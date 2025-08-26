<div align="center">

# 🚀 DepCmd

**VS Code 开发命令管理器**

<p>
<img src="https://github.com/OSpoon/DepCmd/blob/main/res/icon.png?raw=true" alt="DepCmd Logo" width="128" height="128">
</p>

*一个专为开发者设计的 VS Code 扩展，旨在简化开发阶段各种终端命令的使用，减少记忆负担，提高开发效率*

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ospoon.dep-cmd.svg?style=for-the-badge&color=4A90E2&label=版本)](https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd)
[![VS Code Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/ospoon.dep-cmd.svg?style=for-the-badge&color=1ABC9C&label=下载量)](https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd)
[![VS Code Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ospoon.dep-cmd.svg?style=for-the-badge&color=E67E22&label=安装量)](https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd)
[![GitHub Stars](https://img.shields.io/github/stars/OSpoon/DepCmd?style=for-the-badge&color=F39C12&label=星标)](https://github.com/OSpoon/DepCmd)

<a href="https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd">
<img src="https://img.shields.io/badge/安装扩展-VS Code-007ACC?style=for-the-badge&logo=visual-studio-code" alt="Install Extension">
</a>

</div>

---

## 📸 预览

<p align="center">
<img src="https://github.com/OSpoon/DepCmd/blob/main/screenshots/preview.png?raw=true" alt="DepCmd Preview" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
</p>

## ✨ 为什么选择 DepCmd？

<table>
<tr>
<td width="50%">

### 🧠 告别记忆负担
不再需要记住复杂的命令参数，点击即可执行

### ⚡ 智能项目检测
自动识别项目类型，显示相关命令

### 🔄 跨设备同步
基于 VS Code 设置同步，随处可用

</td>
<td width="50%">

### 🎯 分类管理
按技术栈和用途分类，井然有序

### 🔍 快速搜索
实时搜索，瞬间找到所需命令

### 💾 数据安全
使用官方 API，数据稳定可靠

</td>
</tr>
</table>

## 🚀 核心特性

### 🤖 智能项目检测
```
自动识别项目类型 → 显示相关命令 → 提高工作效率
```
- ✅ **多技术栈支持**: NPM、Yarn、PNPM、Python、Rust、Go、Docker、Git
- ✅ **自定义检测规则**: 灵活配置项目检测逻辑
- ✅ **上下文感知**: 根据项目类型智能筛选命令

### 🗂️ 强大的命令管理
<div align="center">

| 功能 | 描述 | 状态 |
|------|------|------|
| 📝 **创建命令** | 轻松添加新命令 | ✅ |
| ✏️ **编辑命令** | 随时修改命令内容 | ✅ |
| 🗑️ **删除命令** | 清理不需要的命令 | ✅ |
| 📂 **分类管理** | 按技术栈分类整理 | ✅ |
| 📦 **批量操作** | 导入导出命令数据 | ✅ |

</div>

### 🔍 高效搜索与执行
- 🔎 **全文搜索**: 搜索命令标题、内容、描述、分类
- ⚡ **一键执行**: 点击即可发送到终端
- 📋 **快速复制**: 复制命令到剪贴板
- 🎯 **实时筛选**: 输入即搜，响应迅速

### 💾 现代化数据存储
- ☁️ **云端同步**: VS Code 设置同步，多设备共享
- 🔒 **数据安全**: 使用 VS Code 原生 API
- 📤 **导入导出**: JSON 格式，轻松备份迁移

## 🛠️ 支持的技术栈

<div align="center">

| 技术栈 | 检测标识 | 预置命令示例 | 状态 |
|:------:|:--------:|:------------|:----:|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" width="30"> **NPM** | `package-lock.json` | `npm install`, `npm run dev` | ✅ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/yarn/yarn-original.svg" width="30"> **Yarn** | `yarn.lock` | `yarn install`, `yarn dev` | ✅ |
| 📦 **PNPM** | `pnpm-lock.yaml` | `pnpm install`, `pnpm dev` | ✅ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="30"> **Python** | `requirements.txt` | `pip install`, `python run` | ✅ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg" width="30"> **Rust** | `Cargo.toml` | `cargo build`, `cargo run` | ✅ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="30"> **Go** | `go.mod` | `go build`, `go run` | ✅ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="30"> **Docker** | `Dockerfile` | `docker build`, `docker run` | ✅ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="30"> **Git** | `.git/` | `git status`, `git commit` | ✅ |

</div>

## 🎯 快速开始

### 第一步：安装扩展
```bash
# 方式一：VS Code 扩展市场搜索 "DepCmd"
# 方式二：命令行安装
code --install-extension ospoon.dep-cmd
```

### 第二步：打开命令面板
1. 在活动栏中点击 **DepCmd** 图标 📋
2. 开始管理你的开发命令

### 第三步：添加第一个命令
```
点击 ➕ 按钮 → 填写命令信息 → 保存 → 开始使用！
```

<details>
<summary>📋 <strong>完整命令列表</strong></summary>

| 命令 | 功能 | 快捷键 |
|------|------|--------|
| `depCmd.sendToTerminal` | 发送到终端 | - |
| `depCmd.refreshView` | 刷新视图 | - |
| `depCmd.searchCommands` | 搜索命令 | - |
| `depCmd.copyCommand` | 复制命令 | - |
| `depCmd.editCommand` | 编辑命令 | - |
| `depCmd.deleteCommand` | 删除命令 | - |
| `depCmd.addCommand` | 添加新命令 | - |
| `depCmd.editCategory` | 重命名分类 | - |
| `depCmd.deleteCategory` | 删除分类 | - |
| `depCmd.toggleProjectDetection` | 切换项目检测 | - |
| `depCmd.clearAllData` | 清空所有数据 | - |
| `depCmd.exportData` | 导出数据 | - |
| `depCmd.importData` | 导入数据 | - |

</details>

## ⚙️ 配置选项

<details>
<summary>🔧 <strong>高级配置</strong></summary>

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `depCmd.enableProjectDetection` | `boolean` | `true` | 启用自动项目检测 |
| `depCmd.defaultCategory` | `string` | `"all"` | 默认显示的分类 |
| `depCmd.projectDetection` | `object` | 见下表 | 自定义项目检测规则 |

### 默认项目检测规则
```json
{
  "pnpm": ["pnpm-lock.yaml"],
  "npm": ["package-lock.json"],
  "yarn": ["yarn.lock"],
  "python": ["requirements.txt", "pyproject.toml", "setup.py"],
  "rust": ["Cargo.toml"],
  "go": ["go.mod"],
  "docker": ["Dockerfile", "docker-compose.yml"],
  "git": [".git/"]
}
```

</details>

## 📊 数据管理

### 📤 导出数据
点击导出按钮，数据将以 JSON 格式保存：

```json
{
  "commands": [
    {
      "id": 1,
      "label": "安装依赖",
      "command": "npm install",
      "description": "安装项目依赖包",
      "category": "npm",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### 📥 导入数据
- **合并模式**: 与现有命令合并，保留原数据
- **替换模式**: 完全替换现有数据

### ☁️ 跨设备同步
开启 VS Code 设置同步，命令数据自动在所有设备间同步。

## 🔧 开发者信息

### 🛠️ 技术栈
- **TypeScript** - 主要开发语言
- **VS Code Extension API** - 扩展开发框架
- **Reactive VSCode** - 响应式编程支持
- **Vitest** - 单元测试框架

### 📁 项目结构
```
src/
├── 📂 core/           # 核心业务逻辑
│   ├── manager.ts     # 命令管理器
│   ├── detector.ts    # 项目检测器
│   └── config.ts      # 配置管理
├── 📂 data/           # 数据层
│   └── database.ts    # 数据库管理
├── 📂 ui/             # 用户界面
│   ├── provider.ts    # 树视图提供者
│   └── commands.ts    # 命令处理
├── 📂 types/          # 类型定义
└── 📂 utils/          # 工具函数
```

### 🚀 本地开发
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

## 🤝 参与贡献

我们欢迎所有形式的贡献！

### 🐛 报告问题
遇到 Bug？[提交 Issue](https://github.com/OSpoon/DepCmd/issues/new) 告诉我们

### 💡 功能建议
有好想法？[提交功能请求](https://github.com/OSpoon/DepCmd/issues/new)

### 🔧 代码贡献
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📈 路线图

- [ ] 🌐 支持更多编程语言
- [ ] 🎨 自定义主题支持
- [ ] 📱 移动端配套工具
- [ ] 🤖 AI 智能命令推荐
- [ ] 🔗 团队命令共享
- [ ] 📊 使用统计分析

## 💖 支持项目

如果 DepCmd 帮助到了您，请考虑：

<div align="center">

[![GitHub Star](https://img.shields.io/badge/GitHub-⭐%20Star-yellow?style=for-the-badge&logo=github)](https://github.com/OSpoon/DepCmd)
[![Sponsor](https://img.shields.io/badge/GitHub-💖%20Sponsor-red?style=for-the-badge&logo=github)](https://github.com/sponsors/OSpoon)

</div>

## 📄 许可证

[MIT License](./LICENSE.md) © 2025 [OSpoon](https://github.com/OSpoon)

---

<div align="center">

**🌟 如果觉得有用，别忘了给个 Star 哦！**

[🏠 首页](https://github.com/OSpoon/DepCmd) • [📦 下载](https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd) • [🐛 反馈](https://github.com/OSpoon/DepCmd/issues) • [💬 讨论](https://github.com/OSpoon/DepCmd/discussions)

Made with ❤️ by [OSpoon](https://github.com/OSpoon)

</div>
