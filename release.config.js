module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/git', {
      assets: ['package.json', 'CHANGELOG.md'],
    }],
    '@semantic-release/github',
  ],
  preset: 'angular',
}
