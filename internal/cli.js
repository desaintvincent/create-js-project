#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

const dryRun = process.argv.includes('--dry-run') || true
const yessAll = process.argv.includes('-y') || process.argv.includes('--yes') || true
const starterName = 'desaintvincent/starter'
const data = {
  project: {
    name: path.basename(process.cwd()),
    description: 'project description',
    keywords: 'just,some,keywords',
  },
  git: {
    user: '',
  },
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
  data.git.user = process.env.GIT_USER || await question('What is your git user?')
  readline.close()
}

async function createPackageJson () {
  const packageJson = await getFile('package.json')
  const packageJsonData = JSON.parse(packageJson)
  packageJsonData.name = data.project.name
  packageJsonData.description = data.project.description
  packageJsonData.version = '1.0.0'
  packageJsonData.keywords = data.project.keywords.split(',')
  packageJsonData.repository.url = `https://github.com/${data.git.user}/${data.project.name}.git`
  await writeFile('package.json', JSON.stringify(packageJsonData, null, 2))
}

async function createReadme () {
  const readme = await getFile('README.md')
  await writeFile('README.md', readme.replace(new RegExp(starterName, 'g'), `${data.git.user}/${data.project.name}`))
}

async function createChangelog () {
  await writeFile('CHANGELOG.md', '')
}

async function checkRequirements () {
  if (dryRun) {
    console.log('Running in dry-run mode')
  }

  return Promise.all([
    new Promise((resolve, reject) => {
      fs.mkdir(path.resolve(__dirname, '../dryRun'), '0744', function (err) {
        if (err && err.code !== 'EEXIST') {
          reject(err)
        } else {
          resolve(true)
        }
      })
    }),
  ])
}

async function git () {
  await run('rm -rf .git')
  await run('git init')
  await run('git add --all -- \':!internal\'')
  await run('git commit -m "feat(core): init project')
  await run('git branch -M main')
  await run(`git remote add origin git@github.com:${data.git.user}/${data.project.name}.git`)
  await run('git push -u origin main')
}

async function clean () {
  await run('rm -rf internal')
}

(async () => {
  await checkRequirements()
  await populateAllData()
  await Promise.all([
    createPackageJson(),
    createReadme(),
    createChangelog(),
  ])
  await git()
  await clean()
})()
