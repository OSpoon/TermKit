// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // eslint ignore globs here
      '.github/**/*.md',
      '**/*.md',
      'dist/**',
      'node_modules/**',
    ],
  },
  {
    rules: {
      // overrides
    },
  },
)
