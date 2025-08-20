@echo off
REM rebuild-better-sqlite3.bat
REM 用于重新构建 better-sqlite3 和 electron 模块的 Windows 批处理脚本

echo 🔨 开始重新构建 better-sqlite3...

REM 进入 better-sqlite3 目录并构建
echo 📁 进入 better-sqlite3 目录...
cd node_modules\better-sqlite3

echo 🏗️  运行 npm run build-release...
call npm run build-release
if %errorlevel% neq 0 exit /b %errorlevel%

REM 返回项目根目录
echo ↩️  返回项目根目录...
cd ..\..

REM 运行 electron rebuild
echo ⚡ 运行 @electron/rebuild...
call npx @electron/rebuild --force --version=37.0.0 --module-dir node_modules/better-sqlite3
if %errorlevel% neq 0 exit /b %errorlevel%

echo ✅ better-sqlite3 重新构建完成！
