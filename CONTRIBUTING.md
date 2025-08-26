# 贡献指南

感谢您对 DepCmd 项目的关注和贡献！我们欢迎所有形式的贡献，包括但不限于代码、文档、问题报告和功能建议。

## 🤝 贡献方式

### 报告问题 (Issues)
- 使用 [GitHub Issues](https://github.com/OSpoon/DepCmd/issues) 报告 bug
- 提交功能请求和改进建议
- 参与现有问题的讨论

### 提交代码 (Pull Requests)
- 修复 bug
- 实现新功能
- 改进文档
- 优化性能

### 其他贡献
- 改进文档和 README
- 增加测试用例
- 翻译文档
- 分享使用经验

## 🛠️ 开发环境设置

### 前置要求
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (推荐) 或 npm/yarn
- **VS Code**: 用于测试扩展
- **Git**: 版本控制

### 本地开发设置

1. **Fork 仓库**
   ```bash
   # 访问 https://github.com/OSpoon/DepCmd 点击 Fork
   ```

2. **克隆仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/DepCmd.git
   cd DepCmd
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **开发模式**
   ```bash
   pnpm dev
   ```

5. **在 VS Code 中测试**
   - 按 `F5` 启动扩展开发主机
   - 或者在命令面板中运行 "Extensions: Install from VSIX"

## 📋 开发工作流

### 分支管理
- `main`: 主分支，包含稳定的代码
- `feature/*`: 功能分支，用于开发新功能
- `bugfix/*`: 修复分支，用于修复 bug
- `docs/*`: 文档分支，用于文档更新

### 提交规范
我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 提交类型 (type)
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具、依赖更新等

#### 示例
```bash
feat: add import/export functionality
fix: resolve project detection issue
docs: update README with new features
test: add unit tests for database manager
```

### Pull Request 流程

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发和测试**
   ```bash
   # 开发代码...
   pnpm build
   pnpm test
   pnpm typecheck
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **创建 Pull Request**
   - 访问 GitHub 仓库页面
   - 点击 "Compare & pull request"
   - 填写 PR 模板

## 🧪 测试指南

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行单次测试
pnpm test:run

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监听模式运行测试
pnpm test:watch
```

### 测试要求
- 新功能必须包含相应的单元测试
- bug 修复应该包含回归测试
- 测试覆盖率应保持在 80% 以上
- 所有测试必须通过

### 编写测试
测试文件位于 `test/` 目录下，使用 Vitest 框架：

```typescript
import { describe, expect, it } from 'vitest'
import { YourModule } from '@src/your-module'

describe('YourModule', () => {
  it('should work correctly', () => {
    const result = YourModule.someMethod()
    expect(result).toBe('expected')
  })
})
```

## 📁 项目结构

```
DepCmd/
├── src/                    # 源代码
│   ├── core/              # 核心业务逻辑
│   │   ├── manager.ts     # 命令管理器
│   │   ├── detector.ts    # 项目检测器
│   │   └── config.ts      # 配置管理
│   ├── data/              # 数据层
│   │   └── database.ts    # 数据库管理
│   ├── ui/                # 用户界面
│   │   ├── provider.ts    # 树视图提供者
│   │   └── commands.ts    # 命令处理
│   ├── types/             # 类型定义
│   │   ├── command.ts     # 命令类型
│   │   └── index.ts       # 导出类型
│   ├── utils/             # 工具函数
│   │   └── index.ts       # 工具函数
│   ├── generated/         # 自动生成的文件
│   │   └── meta.ts        # VS Code 扩展元数据
│   └── index.ts           # 入口文件
├── test/                  # 测试文件
├── config/                # 配置文件
│   └── default-commands.json # 默认命令配置
├── res/                   # 资源文件
├── screenshots/           # 截图
└── dist/                  # 构建输出
```

## 📝 代码规范

### TypeScript 规范
- 使用 TypeScript 严格模式
- 优先使用接口 (interface) 而不是类型别名 (type)
- 为所有公共 API 提供类型注释
- 使用有意义的变量和函数命名

### ESLint 配置
项目使用 `@antfu/eslint-config` 配置：

```bash
# 检查代码规范
pnpm lint

# 自动修复可修复的问题
pnpm lint --fix
```

### 代码风格
- 使用 2 空格缩进
- 使用单引号
- 行尾不要分号（除非必要）
- 每行最大 120 字符
- 使用尾逗号

## 🔧 常用命令

```bash
# 开发相关
pnpm dev                   # 开发模式（监听文件变化）
pnpm build                 # 构建项目
pnpm typecheck            # 类型检查

# 测试相关
pnpm test                 # 运行测试（监听模式）
pnpm test:run            # 运行单次测试
pnpm test:coverage       # 生成测试覆盖率报告

# 代码质量
pnpm lint                # 代码检查
pnpm lint --fix          # 自动修复代码问题

# 扩展相关
pnpm update              # 更新生成的元数据文件
pnpm pack                # 打包扩展
pnpm publish             # 发布扩展（需要权限）

# 版本管理
pnpm release             # 自动版本发布
```

## 🐛 调试指南

### VS Code 调试
1. 在 VS Code 中打开项目
2. 按 `F5` 启动扩展开发主机
3. 在新窗口中测试扩展功能
4. 使用断点调试代码

### 日志调试
```typescript
import { logger } from '@src/utils'

logger.info('Debug information')
logger.error('Error occurred:', error)
```

### 常见问题
- **扩展无法加载**: 检查 `package.json` 中的 `activationEvents`
- **命令不工作**: 确保命令已在 `package.json` 中正确注册
- **数据无法保存**: 检查 VS Code globalState 权限

## 📋 Pull Request 模板

创建 PR 时请包含以下信息：

```markdown
## 变更类型
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## 变更说明
简要描述此次变更的内容和原因。

## 测试
- [ ] 我已经添加了测试用例
- [ ] 所有测试都通过
- [ ] 我已经手动测试了相关功能

## 检查清单
- [ ] 我的代码符合项目的代码规范
- [ ] 我已经进行了自我代码审查
- [ ] 我已经添加了必要的注释
- [ ] 我已经更新了相关文档
```

## 📄 许可证

通过向此项目贡献代码，您同意您的贡献将在 [MIT 许可证](./LICENSE.md) 下获得许可。

## 🆘 获得帮助

如果您在贡献过程中遇到问题，可以通过以下方式获得帮助：

- 创建 [GitHub Issue](https://github.com/OSpoon/DepCmd/issues)
- 参与 [GitHub Discussions](https://github.com/OSpoon/DepCmd/discussions)
- 发送邮件至 [zxin088@gmail.com](mailto:zxin088@gmail.com)

## 🙏 感谢

感谢所有为 DepCmd 项目做出贡献的开发者！

---

再次感谢您的贡献！每一个贡献都让 DepCmd 变得更好！🎉
