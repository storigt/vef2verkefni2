export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
      },
    },

    rules: {
      'no-unused-vars': 'warn',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'eqeqeq': ['error', 'always'],
      'no-console': 'off',
    },
  },
];
