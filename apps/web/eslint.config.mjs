import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      indent: ['warn', 2, { SwitchCase: 1 }],
      quotes: ['warn', 'single', { avoidEscape: true }],
      semi: ['warn', 'always', { omitLastInOneLineBlock: true }],
      // The TypeScript-aware version: the core rule flags parameter names in function types.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      // New in eslint-plugin-react-hooks 7 (React Compiler rules). They flag existing,
      // working patterns; warn until the code is refactored for them.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  // Config files are CommonJS.
  { files: ['*.config.{js,ts}'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  // shadcn/ui components, vendored as generated.
  {
    files: ['src/components/ui/**'],
    rules: { '@typescript-eslint/no-empty-object-type': 'off', '@typescript-eslint/no-unused-vars': 'off' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**', 'coverage/**']),
]);
