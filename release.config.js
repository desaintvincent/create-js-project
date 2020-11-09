module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/git', {
      assets: ['package.json', 'README.md'],
      // eslint-disable-next-line no-template-curly-in-string
      message: 'chore(release): v${nextRelease.version}',
    }],
  ],
  preset: 'angular',
}
