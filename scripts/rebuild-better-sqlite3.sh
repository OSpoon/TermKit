#!/bin/bash

# rebuild-better-sqlite3.sh
# 用于重新构建 better-sqlite3 和 electron 模块的脚本

set -e  # 如果任何命令失败则退出

echo "🔨 开始重新构建 better-sqlite3..."

# 进入 better-sqlite3 目录并构建
echo "📁 进入 better-sqlite3 目录..."
cd node_modules/better-sqlite3

echo "🏗️  运行 npm run build-release..."
npm run build-release

# 返回项目根目录
echo "↩️  返回项目根目录..."
cd ../..

# 运行 electron rebuild
echo "⚡ 运行 @electron/rebuild..."
npx @electron/rebuild --force --version=37.0.0 --module-dir node_modules/better-sqlite3

echo "✅ better-sqlite3 重新构建完成！"
