module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'cd',
      'ci',
      'lint',
      'test',
      'css',
      'js',
      'html',
      'cli',
    ]],
  },
}
