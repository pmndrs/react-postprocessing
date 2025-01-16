module.exports = {
  branches: [
    'master',
    { name: 'alpha', prerelease: true },
    { name: 'beta', prerelease: true },
    { name: 'rc', prerelease: true },
    { name: 'canary-*', prerelease: true, channel: 'canary' },
  ],
}
