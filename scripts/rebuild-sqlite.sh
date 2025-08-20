#!/bin/bash

# rebuild-sqlite.js
# 跨平台的 better-sqlite3 重新构建脚本

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ "$OS" == "Windows_NT" ]]; then
    # Windows 环境
    ./scripts/rebuild-better-sqlite3.bat
else
    # Unix-like 环境 (macOS, Linux)
    ./scripts/rebuild-better-sqlite3.sh
fi