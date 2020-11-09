/* eslint-disable no-template-curly-in-string */
module.exports = {
  debug: true,
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    '@semantic-release/npm',
    ['@semantic-release/git', {
      assets: ['package.json', 'yarn.lock', 'CHANGELOG.md'],
      message: 'chore(release): v${nextRelease.version}\n\n${nextRelease.notes}',
    }],
    '@semantic-release/github',
  ],
  preset: 'angular',
}
