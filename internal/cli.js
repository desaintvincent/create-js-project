#!/usr/bin/env node
const path = require('path')
const fs = require('fs')

const dryRun = process.argv.includes('--dry-run') || true
const yessAll = process.argv.includes('-y') || process.argv.includes('--yes') || true
const data = {
  project: {
    name: path.basename(process.cwd()),
    description: '',
    keywords: 'just,some,keywords',
  },
}
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question (questionText, defaultAnswer = '') {
  return new Promise((resolve, reject) => {
    if (yessAll) {
      resolve(defaultAnswer)

      return
    }
    const text = defaultAnswer ? `${questionText} (${defaultAnswer}) ` : `${questionText} `
    readline.question(text, (answer) => {
      resolve(answer || defaultAnswer)
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

async function populateAllData () {
  data.project.name = await question('What is your project name?', data.project.name)
  data.project.description = await question('What is your project description?')
  data.project.keywords = await question('What is your project keywords?', data.project.keywords)
  readline.close()
}

async function createPackageJson () {
  const packageJson = await getFile('package.json')
  const packageJsonData = JSON.parse(packageJson)
  packageJsonData.name = data.project.name
  packageJsonData.description = data.project.description
  packageJsonData.version = '1.0.0'
  packageJsonData.keywords = data.project.keywords.split(',')
  await writeFile('package.json', JSON.stringify(packageJsonData, null, 2))
}

async function createReadme () {
  const readme = await getFile('README.md')
  await writeFile('README.md', readme)
}

async function createChangelog () {
  const changelog = await getFile('CHANGELOG.md')
  await writeFile('CHANGELOG.md', changelog)
}

async function checkRequirements () {
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

(async () => {
  if (dryRun) {
    console.log('Running in dry-run mode')
  }
  await checkRequirements()
  await populateAllData()
  await Promise.all([
    createPackageJson(),
    createReadme(),
    createChangelog(),
  ])
  console.log(data)
})()
