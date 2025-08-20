import type { CommandItem } from './types'

// Conda Commands - Python environment and package management
export const CONDA_COMMANDS: CommandItem[] = [
  {
    label: 'Create Environment',
    command: 'conda create -n env_name python=3.9',
    description: 'Create a new conda environment',
    category: 'conda',
  },
  {
    label: 'Activate Environment',
    command: 'conda activate env_name',
    description: 'Activate a conda environment',
    category: 'conda',
  },
  {
    label: 'Deactivate Environment',
    command: 'conda deactivate',
    description: 'Deactivate current environment',
    category: 'conda',
  },
  {
    label: 'List Environments',
    command: 'conda env list',
    description: 'List all conda environments',
    category: 'conda',
  },
  {
    label: 'Install Package',
    command: 'conda install package_name',
    description: 'Install a package using conda',
    category: 'conda',
  },
  {
    label: 'Update Package',
    command: 'conda update package_name',
    description: 'Update a package using conda',
    category: 'conda',
  },
  {
    label: 'Remove Package',
    command: 'conda remove package_name',
    description: 'Remove a package using conda',
    category: 'conda',
  },
  {
    label: 'List Packages',
    command: 'conda list',
    description: 'List installed packages',
    category: 'conda',
  },
  {
    label: 'Export Environment',
    command: 'conda env export > environment.yml',
    description: 'Export environment to YAML file',
    category: 'conda',
  },
  {
    label: 'Create from YAML',
    command: 'conda env create -f environment.yml',
    description: 'Create environment from YAML file',
    category: 'conda',
  },
  {
    label: 'Remove Environment',
    command: 'conda env remove -n env_name',
    description: 'Remove a conda environment',
    category: 'conda',
  },
  {
    label: 'Update Conda',
    command: 'conda update conda',
    description: 'Update conda itself',
    category: 'conda',
  },
  {
    label: 'Clean Conda Cache',
    command: 'conda clean --all',
    description: 'Clean conda package cache',
    category: 'conda',
  },
  {
    label: 'Conda Info',
    command: 'conda info',
    description: 'Show conda system information',
    category: 'conda',
  },
]
