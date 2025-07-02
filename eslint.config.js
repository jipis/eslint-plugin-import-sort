import mochaPlugin from 'eslint-plugin-mocha';
import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  pluginJs.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.node,
      },
    },
    plugins: {
      mocha: mochaPlugin,
    },
    rules: {
      'mocha/no-exclusive-tests': 'warn',
      'mocha/no-skipped-tests': 'warn',
      'mocha/no-pending-tests': 'warn',
      // Add other plugin rules as needed
    },
    settings: {
      mocha: {
        additionalCustomNames: ['specify'], // Example: for mocha-each
      },
    },
  },
];
