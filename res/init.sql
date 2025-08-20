-- 创建命令表
CREATE TABLE IF NOT EXISTS commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    command TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_commands_category ON commands(category);
CREATE INDEX IF NOT EXISTS idx_commands_label ON commands(label);

-- 插入默认的Git命令
INSERT OR IGNORE INTO commands (label, command, description, category, icon) VALUES
('Status', 'git status', 'Show working tree status', 'git', 'git'),
('Add All', 'git add .', 'Add all files to staging area', 'git', 'git'),
('Commit', 'git commit -m "message"', 'Commit staged changes', 'git', 'git'),
('Push', 'git push', 'Push commits to remote repository', 'git', 'git'),
('Pull', 'git pull', 'Pull changes from remote repository', 'git', 'git'),
('Log', 'git log --oneline', 'Show commit history', 'git', 'git'),
('Diff', 'git diff', 'Show changes between commits', 'git', 'git'),
('Branch', 'git branch', 'List local branches', 'git', 'git'),
('Checkout', 'git checkout -b new-branch', 'Create and switch to new branch', 'git', 'git'),
('Merge', 'git merge branch-name', 'Merge specified branch', 'git', 'git');

-- 插入默认的NPM命令
INSERT OR IGNORE INTO commands (label, command, description, category, icon) VALUES
('Install', 'npm install', 'Install dependencies', 'npm', 'package'),
('Dev Server', 'npm run dev', 'Start development server', 'npm', 'play'),
('Build', 'npm run build', 'Build for production', 'npm', 'tools'),
('Test', 'npm test', 'Run tests', 'npm', 'beaker'),
('Install Package', 'npm install package-name', 'Install a specific package', 'npm', 'package'),
('Install Dev Package', 'npm install -D package-name', 'Install development dependency', 'npm', 'package'),
('Uninstall Package', 'npm uninstall package-name', 'Uninstall a package', 'npm', 'trash'),
('Update', 'npm update', 'Update dependencies', 'npm', 'sync'),
('Audit', 'npm audit', 'Check for vulnerabilities', 'npm', 'shield'),
('List', 'npm ls', 'List installed packages', 'npm', 'list-unordered');

-- 插入默认的Yarn命令
INSERT OR IGNORE INTO commands (label, command, description, category, icon) VALUES
('Install', 'yarn install', 'Install dependencies', 'yarn', 'package'),
('Dev Server', 'yarn dev', 'Start development server', 'yarn', 'play'),
('Build', 'yarn build', 'Build for production', 'yarn', 'tools'),
('Test', 'yarn test', 'Run tests', 'yarn', 'beaker'),
('Add Package', 'yarn add package-name', 'Add a package', 'yarn', 'package'),
('Add Dev Package', 'yarn add -D package-name', 'Add development dependency', 'yarn', 'package'),
('Remove Package', 'yarn remove package-name', 'Remove a package', 'yarn', 'trash'),
('Upgrade', 'yarn upgrade', 'Upgrade dependencies', 'yarn', 'sync'),
('Audit', 'yarn audit', 'Check for vulnerabilities', 'yarn', 'shield'),
('List', 'yarn list', 'List installed packages', 'yarn', 'list-unordered');

-- 插入默认的Docker命令
INSERT OR IGNORE INTO commands (label, command, description, category, icon) VALUES
('Build', 'docker build -t image-name .', 'Build Docker image', 'docker', 'package'),
('Run', 'docker run -it image-name', 'Run Docker container', 'docker', 'play'),
('List Images', 'docker images', 'List Docker images', 'docker', 'list-unordered'),
('List Containers', 'docker ps', 'List running containers', 'docker', 'list-unordered'),
('List All Containers', 'docker ps -a', 'List all containers', 'docker', 'list-flat'),
('Stop Container', 'docker stop container-id', 'Stop a container', 'docker', 'debug-stop'),
('Remove Container', 'docker rm container-id', 'Remove a container', 'docker', 'trash'),
('Remove Image', 'docker rmi image-id', 'Remove an image', 'docker', 'trash'),
('Logs', 'docker logs container-id', 'Show container logs', 'docker', 'output'),
('Exec', 'docker exec -it container-id /bin/bash', 'Execute command in container', 'docker', 'terminal');

-- 插入默认的Python/Pip命令
INSERT OR IGNORE INTO commands (label, command, description, category, icon) VALUES
('Install Package', 'pip install package-name', 'Install a package', 'pip', 'package'),
('Install Requirements', 'pip install -r requirements.txt', 'Install from requirements file', 'pip', 'package'),
('List Packages', 'pip list', 'List installed packages', 'pip', 'list-unordered'),
('Show Package', 'pip show package-name', 'Show package information', 'pip', 'info'),
('Freeze', 'pip freeze > requirements.txt', 'Generate requirements file', 'pip', 'save'),
('Uninstall', 'pip uninstall package-name', 'Uninstall a package', 'pip', 'trash'),
('Upgrade', 'pip install --upgrade package-name', 'Upgrade a package', 'pip', 'sync'),
('Search', 'pip search package-name', 'Search for packages', 'pip', 'search'),
('Check', 'pip check', 'Check dependencies', 'pip', 'checklist'),
('Install Editable', 'pip install -e .', 'Install in editable mode', 'pip', 'edit');

-- 插入默认的Conda命令
INSERT OR IGNORE INTO commands (label, command, description, category, icon) VALUES
('Create Environment', 'conda create -n env-name python=3.9', 'Create new environment', 'conda', 'add'),
('Activate Environment', 'conda activate env-name', 'Activate environment', 'conda', 'play'),
('Deactivate', 'conda deactivate', 'Deactivate current environment', 'conda', 'debug-stop'),
('List Environments', 'conda env list', 'List all environments', 'conda', 'list-unordered'),
('Install Package', 'conda install package-name', 'Install a package', 'conda', 'package'),
('List Packages', 'conda list', 'List installed packages', 'conda', 'list-flat'),
('Update Package', 'conda update package-name', 'Update a package', 'conda', 'sync'),
('Remove Package', 'conda remove package-name', 'Remove a package', 'conda', 'trash'),
('Export Environment', 'conda env export > environment.yml', 'Export environment', 'conda', 'save'),
('Create from File', 'conda env create -f environment.yml', 'Create from YAML file', 'conda', 'file');

-- 插入默认的Rust命令
INSERT OR IGNORE INTO commands (label, command, description, category, icon) VALUES
('New Project', 'cargo new project-name', 'Create new Rust project', 'rust', 'add'),
('Build', 'cargo build', 'Build the project', 'rust', 'tools'),
('Run', 'cargo run', 'Build and run the project', 'rust', 'play'),
('Test', 'cargo test', 'Run tests', 'rust', 'beaker'),
('Check', 'cargo check', 'Check code without building', 'rust', 'check'),
('Format', 'cargo fmt', 'Format code', 'rust', 'symbol-color'),
('Clippy', 'cargo clippy', 'Run Clippy linter', 'rust', 'warning'),
('Doc', 'cargo doc --open', 'Generate and open documentation', 'rust', 'book'),
('Clean', 'cargo clean', 'Clean build artifacts', 'rust', 'trash'),
('Update', 'cargo update', 'Update dependencies', 'rust', 'sync');

-- 创建触发器来自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_commands_timestamp 
    AFTER UPDATE ON commands
    FOR EACH ROW
BEGIN
    UPDATE commands SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
