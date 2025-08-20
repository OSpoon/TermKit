import type { CommandItem } from './types'

// Pip Commands - Python package management
export const PIP_COMMANDS: CommandItem[] = [
  {
    label: 'Install Package',
    command: 'pip install package_name',
    description: 'Install a Python package',
    category: 'pip',
  },
  {
    label: 'Install Requirements',
    command: 'pip install -r requirements.txt',
    description: 'Install packages from requirements file',
    category: 'pip',
  },
  {
    label: 'Install Package (User)',
    command: 'pip install --user package_name',
    description: 'Install package for current user only',
    category: 'pip',
  },
  {
    label: 'Install Editable Package',
    command: 'pip install -e .',
    description: 'Install package in editable mode',
    category: 'pip',
  },
  {
    label: 'Uninstall Package',
    command: 'pip uninstall package_name',
    description: 'Uninstall a Python package',
    category: 'pip',
  },
  {
    label: 'Upgrade Package',
    command: 'pip install --upgrade package_name',
    description: 'Upgrade a package to latest version',
    category: 'pip',
  },
  {
    label: 'Upgrade Pip',
    command: 'pip install --upgrade pip',
    description: 'Upgrade pip itself',
    category: 'pip',
  },
  {
    label: 'List Packages',
    command: 'pip list',
    description: 'List installed packages',
    category: 'pip',
  },
  {
    label: 'List Outdated',
    command: 'pip list --outdated',
    description: 'List outdated packages',
    category: 'pip',
  },
  {
    label: 'Show Package Info',
    command: 'pip show package_name',
    description: 'Show package information',
    category: 'pip',
  },
  {
    label: 'Search Package',
    command: 'pip search package_name',
    description: 'Search for packages (deprecated)',
    category: 'pip',
  },
  {
    label: 'Freeze Requirements',
    command: 'pip freeze > requirements.txt',
    description: 'Export installed packages to requirements.txt',
    category: 'pip',
  },
  {
    label: 'Freeze (No Deps)',
    command: 'pip freeze --exclude-editable',
    description: 'Freeze without editable packages',
    category: 'pip',
  },
  {
    label: 'Check Dependencies',
    command: 'pip check',
    description: 'Check for dependency conflicts',
    category: 'pip',
  },
  {
    label: 'Download Package',
    command: 'pip download package_name',
    description: 'Download package without installing',
    category: 'pip',
  },
  {
    label: 'Pip Version',
    command: 'pip --version',
    description: 'Show pip version',
    category: 'pip',
  },
  {
    label: 'Pip Help',
    command: 'pip help',
    description: 'Show pip help',
    category: 'pip',
  },
  {
    label: 'Install from Index',
    command: 'pip install -i https://pypi.org/simple/ package_name',
    description: 'Install from specific index',
    category: 'pip',
  },
  {
    label: 'Install Specific Version',
    command: 'pip install package_name==1.0.0',
    description: 'Install specific package version',
    category: 'pip',
  },
  {
    label: 'Install from Git',
    command: 'pip install git+https://github.com/user/repo.git',
    description: 'Install package from git repository',
    category: 'pip',
  },
]
