<p align="center">
<a href="https://gith### 智能命令过滤
- 在 Node.js 项目中只显示对应的包管理器命令（npm/yarn/pnpm）
- 在 Python 项目中只显示相关的 Python 工具命令
- 自动隐藏与当前项目无关的命令分类

### 🔧 通用扩展系统
- **配置驱动**: 通过 JSON 配置文件扩展支持新的项目类型
- **零代码扩展**: 无需修改源码即可添加自定义项目检测
- **灵活规则**: 支持文件存在、内容匹配、自定义函数等检测规则
- **条件组合**: 复杂的条件逻辑支持精确的项目识别
- **插件化架构**: 支持多种扩展点和自定义函数

## 📚 文档

- [📖 基础项目检测](./docs/PROJECT_DETECTION.md) - 项目检测功能介绍
- [🔧 灵活检测配置](./docs/FLEXIBLE_DETECTION.md) - 高级配置和自定义指南
- [⚙️ 通用配置系统](./docs/UNIVERSAL_CONFIG.md) - 配置驱动的扩展指南
- [📋 升级指南](./docs/UPGRADE_GUIDE.md) - 版本升级说明oon/DepCmd">
<img src="https://github.com/OSpoon/DepCmd/blob/main/res/icon.png?raw=true" alt="logo" width='126'/>
</a>
</p>

<p align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/ospoon.dep-cmd.svg?color=blue&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/d/ospoon.dep-cmd.svg?color=4bdbe3" alt="Visual Studio Marketplace Downloads" /></a>
<a href="https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/i/ospoon.dep-cmd.svg?color=63ba83" alt="Visual Studio Marketplace Installs" /></a>
<br/>

DepCmd 是一个专为开发者设计的 VS Code 扩展，旨在简化开发阶段各种终端命令的使用，减少记忆负担，提高开发效率。

<p align='center'>
  <img src="https://github.com/OSpoon/DepCmd/blob/main/screenshots/preview.png?raw=true" alt='preview'>
</p>

## ✨ 特性

- 🖥️ **命令管理**: 分类管理各种开发工具的常用命令，支持增删改查操作
- 🔍 **快速搜索**: 支持快速搜索和筛选命令，无需记忆复杂的命令参数
- 🖱️ **一键执行**: 点击即可将命令发送到终端执行，提高开发效率
- 🎯 **智能项目检测**: 自动识别项目类型（Node.js、Python、Rust、Go、Java等），动态显示相关命令
- 📦 **包管理器识别**: 智能识别 npm/yarn/pnpm、pip/conda/poetry 等包管理器
- 🔧 **自适应界面**: 根据项目配置自动隐藏无关命令分类，保持界面简洁

## 🚀 新功能：项目检测

DepCmd 现在可以自动检测您的项目类型并智能过滤命令！

### 支持的项目类型
- **Node.js**: 自动检测 package.json、yarn.lock、pnpm-lock.yaml 等
- **Python**: 自动检测 requirements.txt、environment.yml、pyproject.toml 等
- **Rust**: 自动检测 Cargo.toml、Cargo.lock
- **Go**: 自动检测 go.mod、go.sum
- **Java**: 自动检测 pom.xml、build.gradle
- **Docker**: 自动检测 Dockerfile、docker-compose.yml
- **Git**: 自动检测 .git 目录

### 智能命令过滤
- 在 Node.js 项目中只显示对应的包管理器命令（npm/yarn/pnpm）
- 在 Python 项目中只显示相关的 Python 工具命令
- 自动隐藏与当前项目无关的命令分类

## � 文档

- [📖 基础项目检测](./docs/PROJECT_DETECTION.md) - 项目检测功能介绍
- [🔧 灵活检测配置](./docs/FLEXIBLE_DETECTION.md) - 高级配置和自定义指南
- [📋 升级指南](./docs/UPGRADE_GUIDE.md) - 版本升级说明
- [📝 配置示例](./examples/custom-project-detection.json) - 自定义配置参考

## License

[MIT](./LICENSE.md) License © 2025 [OSpoon](https://github.com/OSpoon)
