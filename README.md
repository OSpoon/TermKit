<div align="center">

# 🚀 DepCmd

![DepCmd Logo](https://github.com/OSpoon/DepCmd/blob/main/res/icon.png?raw=true)

**一个强大的 VS Code 开发命令管理扩展**

让复杂的终端命令变得简单易用

[![Version](https://img.shields.io/visual-studio-marketplace/v/ospoon.dep-cmd?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/ospoon.dep-cmd?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd)
[![Stars](https://img.shields.io/github/stars/OSpoon/DepCmd?style=flat-square)](https://github.com/OSpoon/DepCmd)

[**立即安装**](https://marketplace.visualstudio.com/items?itemName=ospoon.dep-cmd) | [使用文档](#使用指南) | [问题反馈](https://github.com/OSpoon/DepCmd/issues)

</div>

---

## ✨ 特性

- **🤖 智能检测** - 自动识别项目类型，显示相关命令
- **⚡ 一键执行** - 点击即可发送到终端，告别复杂命令
- **🔍 快速搜索** - 实时搜索，瞬间找到所需命令
- **🗂️ 分类管理** - 按技术栈整理，井然有序
- **☁️ 云端同步** - 基于 VS Code 设置同步，多设备共享
- **📦 导入导出** - JSON 格式，轻松备份迁移

## 🎯 支持的技术栈

| 技术 | 检测文件 | 预置命令 |
|:---:|:---:|:---:|
| NPM | `package-lock.json` | `npm install`, `npm run dev` |
| Yarn | `yarn.lock` | `yarn install`, `yarn dev` |
| PNPM | `pnpm-lock.yaml` | `pnpm install`, `pnpm dev` |
| Python | `requirements.txt` | `pip install`, `python run` |
| Rust | `Cargo.toml` | `cargo build`, `cargo run` |
| Go | `go.mod` | `go build`, `go run` |
| Docker | `Dockerfile` | `docker build`, `docker run` |
| Git | `.git/` | `git status`, `git commit` |

## 📸 预览

![Preview](https://github.com/OSpoon/DepCmd/blob/main/screenshots/preview.png?raw=true)

## 🚀 使用指南

### 安装

1. 在 VS Code 扩展市场搜索 "DepCmd"
2. 点击安装

或通过命令行：
```bash
code --install-extension ospoon.dep-cmd
```

### 快速开始

1. **打开扩展** - 在活动栏中点击 DepCmd 图标
2. **添加命令** - 点击 ➕ 按钮，填写命令信息
3. **使用命令** - 点击命令即可执行，右键可复制

### 主要功能

- **添加命令** - 创建自定义命令
- **编辑命令** - 修改现有命令
- **搜索命令** - 实时搜索功能
- **项目检测** - 根据项目类型筛选命令
- **数据管理** - 导入/导出命令数据

## ⚙️ 配置

在 VS Code 设置中搜索 `depCmd` 可找到以下配置项：

- `depCmd.enableProjectDetection` - 启用项目自动检测 (默认: true)
- `depCmd.defaultCategory` - 默认显示分类 (默认: "all")
- `depCmd.projectDetection` - 自定义项目检测规则

## 🤝 贡献

欢迎贡献代码或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -m '添加新功能'`)
4. 推送分支 (`git push origin feature/新功能`)
5. 创建 Pull Request

## 📋 Todo

- [ ] 支持更多编程语言
- [ ] 自定义主题
- [ ] AI 智能命令推荐
- [ ] 团队命令共享

## 🐛 问题反馈

遇到问题？请在 [Issues](https://github.com/OSpoon/DepCmd/issues) 中反馈

## 📄 许可证

[MIT License](./LICENSE.md) © 2025 [OSpoon](https://github.com/OSpoon)

---

<div align="center">

**觉得有用？给个 ⭐ 支持一下！**

Made with ❤️ by [OSpoon](https://github.com/OSpoon)

</div>
