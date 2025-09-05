<div align="center">

# 🚀 QuickCmd

![QuickCmd Logo](https://github.com/OSpoon/QuickCmd/blob/main/res/icon.png?raw=true)

**一个强大的 VS Code 开发命令管理扩展**

让复杂的终端命令变得简单易用

[![Version](https://img.shields.io/visual-studio-marketplace/v/ospoon.quick-cmd?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ospoon.quick-cmd)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/ospoon.quick-cmd?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ospoon.quick-cmd)
[![Stars](https://img.shields.io/github/stars/OSpoon/QuickCmd?style=flat-square)](https://github.com/OSpoon/QuickCmd)

[**立即安装**](https://marketplace.visualstudio.com/items?itemName=ospoon.quick-cmd) | [使用文档](#使用指南) | [问题反馈](https://github.com/OSpoon/QuickCmd/issues)

</div>

---

## ✨ 特性

- **📝 自定义命令** - 完全自定义您的命令集合，支持任何终端命令
- **⚡ 一键执行** - 点击即可发送到终端，告别复杂命令记忆
- **🔍 快速搜索** - 实时搜索，瞬间找到所需命令
- **🗂️ 分类管理** - 按需求分类整理，井然有序
- **🎨 图标定制** - 为命令和分类设置个性化图标
- **☁️ 云端同步** - 基于 VS Code 设置同步，多设备共享
- **📦 导入导出** - JSON 格式，轻松备份迁移
- **🔧 依赖检测** - 可选的工具依赖检测，只显示可用命令

## 📸 预览

![Preview](https://github.com/OSpoon/QuickCmd/blob/main/screenshots/preview.png?raw=true)

## 🚀 使用指南

### 安装

1. 在 VS Code 扩展市场搜索 "QuickCmd"
2. 点击安装

或通过命令行：
```bash
code --install-extension ospoon.quick-cmd
```

### 快速开始

1. **打开扩展** - 在活动栏中点击 QuickCmd 图标
2. **添加命令** - 点击 ➕ 按钮，创建您的第一个命令
3. **使用命令** - 点击命令即可执行，右键可复制或编辑

### 主要功能

- **命令管理** - 添加、编辑、删除自定义命令
- **分类管理** - 创建和管理命令分类，支持图标自定义
- **搜索功能** - 快速查找所需命令
- **依赖检测** - 可选配置工具依赖检测（如 `yarn --version`）
- **数据管理** - 导入/导出命令数据，支持云端同步

## ⚙️ 配置

在 VS Code 设置中搜索 `quickCmd` 可找到以下配置项：

- `quickCmd.defaultCategory` - 默认显示分类 (默认: "all")
- `quickCmd.categoryDisplay` - 分类显示配置（名称和图标）
- `quickCmd.dependencyDetection` - 工具依赖检测配置

### 依赖检测配置示例

```json
{
  "quickCmd.dependencyDetection": {
    "yarn": {
      "enabled": true,
      "command": "yarn --version",
      "timeout": 3000,
      "description": "Check if Yarn is installed"
    }
  }
}
```

## 🤝 贡献

欢迎贡献代码或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -m '添加新功能'`)
4. 推送分支 (`git push origin feature/新功能`)
5. 创建 Pull Request

## 🐛 问题反馈

遇到问题？请在 [Issues](https://github.com/OSpoon/QuickCmd/issues) 中反馈

## 📄 许可证

[MIT License](./LICENSE.md) © 2025 [OSpoon](https://github.com/OSpoon)

---

<div align="center">

**觉得有用？给个 ⭐ 支持一下！**

Made with ❤️ by [OSpoon](https://github.com/OSpoon)

</div>
