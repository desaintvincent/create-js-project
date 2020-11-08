const WARN = 1

module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  extends: ['standard', 'plugin:md/recommended', 'plugin:jest/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.md'],
      parser: 'markdown-eslint-parser',
    },
  ],
  rules: {
    'no-console': WARN,
    'no-else-return': ['error'],
    semi: ['error', 'never'],
    'no-extra-semi': ['error'],
    'newline-before-return': ['error'],
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
      },
    ],
  },
}
