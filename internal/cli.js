#!/usr/bin/env node
const sodium = require('tweetsodium')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const request = require('request')
const { version } = require('../package.json')

const dryRun = process.argv.includes('--dry-run') || false
const yessAll = process.argv.includes('-y') || process.argv.includes('--yes') || false
const noGit = process.argv.includes('-g') || process.argv.includes('--no-git') || false
const originalGithubUserName = 'desaintvincent'
const originalProjectName = 'create-js-project'

const data = {
  project: {
    name: path.basename(process.cwd()),
    description: 'project description',
    keywords: 'just,some,keywords',
  },
  git: {
    user: process.env.GIT_USER || 'fakeUser',
    public: true,
  },
}

function encrypt (value, key) {
  const messageBytes = Buffer.from(value)
  const keyBytes = Buffer.from(key, 'base64')

  const encryptedBytes = sodium.seal(messageBytes, keyBytes)

  return Buffer.from(encryptedBytes).toString('base64')
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question (questionText, defaultAnswer = '') {
  return new Promise((resolve, reject) => {
    if (yessAll && defaultAnswer) {
      resolve(defaultAnswer)

      return
    }
    const text = defaultAnswer ? `${questionText} (${defaultAnswer}) ` : `${questionText} `
    readline.question(text, (answer) => {
      resolve(answer || defaultAnswer || question(questionText, defaultAnswer))
    })
  })
}

function booleanQuestion (questionText, response = null) {
  const text = (() => {
    if (response === true) return `${questionText} (Y/n) `
    if (response === false) return `${questionText} (y/N) `

    return `${questionText} (y/n) `
  })()

  return new Promise((resolve) => {
    if (yessAll) {
      resolve(response || true)

      return
    }
    readline.question(text, (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        return resolve(true)
      }
      if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
        return resolve(false)
      }
      if (!answer && response !== null) {
        return resolve(response)
      }

      resolve(booleanQuestion(questionText, response))
    })
  })
}

function getFile (file) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, '../', file), 'utf8', function (err, data) {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

function writeFile (file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(__dirname, dryRun ? '../dryRun' : '../', file), data, 'utf8', function (err, data) {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

function run (command, preventInDryRun = true) {
  if (dryRun && preventInDryRun) {
    console.log(`[dryRun]: "${command}"`)

    return Promise.resolve(true)
  }

  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }
      if (stderr) {
        reject(stderr)
      }
      resolve(stdout)
    })
  })
}

async function populateAllData () {
  data.project.name = await question('What is your project name?', data.project.name)
  data.project.description = await question('What is your project description?', data.project.description)
  data.project.keywords = await question('What is your project keywords?', data.project.keywords)
  data.git.user = await question('What is your git user?', data.git.user)
}

async function createPackageJson () {
  const packageJson = await getFile('package.json')
  const packageJsonData = JSON.parse(packageJson)
  packageJsonData.name = data.project.name
  packageJsonData.description = data.project.description
  packageJsonData.version = '1.0.0'
  packageJsonData.keywords = data.project.keywords.split(',')
  packageJsonData.repository.url = `https://github.com/${data.git.user}/${data.project.name}.git`
  delete packageJsonData.scripts.setup
  delete packageJsonData.devDependencies.tweetsodium
  await writeFile('package.json', JSON.stringify(packageJsonData, null, 2))
}

async function createReadme () {
  const readme = await getFile('README.md')
  await writeFile('README.md', readme
    .replace(/<!--- -->((.|\n)*)<!--- -->/gmis, `${data.project.description}\n# Install\n\`\`\`sh\nyarn install\n\`\`\``)
    .replace(new RegExp(originalGithubUserName, 'g'), data.git.user)
    .replace(new RegExp(originalProjectName, 'g'), data.project.name),
  )
}

async function createLicense () {
  const license = await getFile('LICENSE.md')
  await writeFile('LICENSE.md', license
    .replace(new RegExp(originalGithubUserName, 'g'), data.git.user)
    .replace(/Copyright \(c\) \d{4}/gi, `Copyright (c) ${new Date().getFullYear()}`),
  )
}

async function createChangelog () {
  await writeFile('CHANGELOG.md', '')
}

async function checkRequirements () {
  console.log(`Using ${originalProjectName} v${version}`)
  if (dryRun) {
    console.log('Running in dry-run mode. All created files will be in ./dryRun folder')
  }

  return Promise.all([
    new Promise((resolve, reject) => {
      if (dryRun) {
        fs.mkdir(path.resolve(__dirname, '../dryRun'), '0744', function (err) {
          if (err && err.code !== 'EEXIST') {
            reject(err)
          } else {
            resolve(true)
          }
        })
      } else {
        resolve(true)
      }
    }),
  ])
}

function createRepo (gitUser, projecName) {
  const url = 'https://api.github.com/user/repos'
  const credentials = Buffer.from(`${gitUser}:${process.env.GH_TOKEN}`).toString('base64')

  const postParam = {
    url: url,
    headers: {
      'User-Agent': 'create-js-project',
      Authorization: `Basic ${credentials}`,
      Accept: 'application/vnd.github.v3+json',
    },
    method: 'POST',
    body: JSON.stringify({
      allow_merge_commit: false,
      allow_rebase_merge: false,
      delete_branch_on_merge: true,
      name: projecName,
      private: !data.git.public,
      description: data.project.description,
      homepage: `https://${gitUser}.github.io/${projecName}/`,
    }),
  }

  if (dryRun) {
    console.log('=== create repo===', postParam)

    return Promise.resolve(true)
  }

  return new Promise((resolve, reject) => {
    request.post(postParam, (error, response, body) => {
      if (error) {
        return resolve(false)
      }
      if (response.statusCode === 422) {
        console.log('Repository not created because already exists')
      }
      resolve(response.statusCode === 201)
    })
  })
}

function reposExists (gitUser, projecName) {
  const credentials = Buffer.from(`${gitUser}:${process.env.GH_TOKEN}`).toString('base64')

  return new Promise((resolve, reject) => {
    request.get({
      headers: {
        'User-Agent': 'create-js-project',
        Authorization: `Basic ${credentials}`,
        Accept: 'application/vnd.github.v3+json',
      },
      uri: `https://api.github.com/repos/${gitUser}/${projecName}`,
      method: 'GET',
    }, (error, response) => {
      if (error) {
        return resolve(false)
      }
      resolve(response.statusCode === 200)
    })
  })
}

async function setSecret (gitUser, projecName) {
  const credentials = Buffer.from(`${gitUser}:${process.env.GH_TOKEN}`).toString('base64')

  const { key, key_id: keyId } = await new Promise((resolve, reject) => {
    request.get({
      headers: {
        'User-Agent': 'create-js-project',
        Authorization: `Basic ${credentials}`,
        Accept: 'application/vnd.github.v3+json',
      },
      uri: `https://api.github.com/repos/${gitUser}/${projecName}/actions/secrets/public-key`,
      method: 'GET',
    }, (error, response) => {
      if (error) {
        return reject(error)
      }
      resolve(JSON.parse(response.body))
    })
  })

  const options = {
    method: 'PUT',
    uri: `https://api.github.com/repos/${gitUser}/${projecName}/actions/secrets/GH_TOKEN`,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Basic ${credentials}`,
      'User-Agent': 'create-js-project',
    },
    body: JSON.stringify({
      encrypted_value: encrypt(process.env.GH_TOKEN, key),
      key_id: keyId,
    }),
  }

  await new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (error) {
        reject(error)

        return
      }
      if (response.statusCode !== 201) {
        reject(response)

        return
      }
      resolve(true)
    })
  })
}

async function git () {
  if (noGit || !process.env.GH_TOKEN) {
    return
  }

  const gitExisted = await reposExists(data.git.user, data.project.name)
  if (!gitExisted) {
    console.log(`github repo "${data.git.user}/${data.project.name}" does not exist, will be created...`)
    data.git.public = await booleanQuestion('is github repo public?', true)
    await createRepo(data.git.user, data.project.name)
    await setSecret(data.git.user, data.project.name)
  }
  await run('rm -rf .git')
  await run('git init')
  await run('git add --all -- \':!internal\'')
  await run('git commit -m "feat(core): init project"')
  await run('git branch -M main')
  await run(`git remote add origin git@github.com:${data.git.user}/${data.project.name}.git`)
  if (!gitExisted) {
    try {
      await run('git push -u origin main')
      console.log(`Github repository pushed: https://github.com/${data.git.user}/${data.project.name}`)
    } catch (err) {
      console.log('[warning]: could not push project. Did you create the repos?')
    }
  }
}

async function clean () {
  readline.close()
  await run('rm -rf internal')
  console.log('All done. Happy coding!')
}

(async () => {
  try {
    await checkRequirements()
    await populateAllData()
    await Promise.all([
      createPackageJson(),
      createReadme(),
      createLicense(),
      createChangelog(),
    ])
    await git()
    await clean()
  } catch (error) {
    console.log('error', error)
  }
})()
