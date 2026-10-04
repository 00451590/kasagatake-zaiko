import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.resolve(__dirname, '..')
const token = process.env.GITHUB_TOKEN
const remoteUrl = process.env.GITHUB_REMOTE
const username = process.env.GITHUB_USER || '00451590'

if (!token || !remoteUrl) {
  console.error('GITHUB_TOKEN and GITHUB_REMOTE are required')
  process.exit(1)
}

const fsPromise = fs.promises

async function shouldIgnore(filepath) {
  if (filepath === '.git' || filepath.startsWith('.git/')) return true
  // minimal ignore matching .gitignore patterns we care about
  const parts = filepath.split('/')
  if (parts.includes('node_modules') || parts.includes('dist') || parts.includes('dist-ssr')) {
    return true
  }
  if (filepath === '.env' || filepath.startsWith('.env.')) {
    if (filepath === '.env.example') return false
    return true
  }
  if (filepath === '.DS_Store' || filepath.endsWith('/.DS_Store')) return true
  return false
}

async function walk(rel = '') {
  const abs = path.join(dir, rel)
  const entries = await fsPromise.readdir(abs, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = rel ? `${rel}/${entry.name}` : entry.name
    if (await shouldIgnore(child)) continue
    if (entry.isDirectory()) {
      files.push(...(await walk(child)))
    } else if (entry.isFile()) {
      files.push(child)
    }
  }
  return files
}

if (!fs.existsSync(path.join(dir, '.git'))) {
  await git.init({ fs, dir, defaultBranch: 'main' })
  console.log('initialized git repo')
}

const files = await walk()
for (const filepath of files) {
  await git.add({ fs, dir, filepath })
}
console.log(`staged ${files.length} files`)

const status = await git.statusMatrix({ fs, dir })
const hasChanges = status.some(([, head, workdir, stage]) => !(head === 1 && workdir === 1 && stage === 1))
if (hasChanges) {
  const sha = await git.commit({
    fs,
    dir,
    message: 'Publish Kasagatake inventory app for GitHub Pages',
    author: {
      name: username,
      email: `${username}@users.noreply.github.com`,
    },
  })
  console.log('committed', sha)
} else {
  console.log('no changes to commit')
}

const remotes = await git.listRemotes({ fs, dir })
if (!remotes.find((r) => r.remote === 'origin')) {
  await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl })
}

await git.push({
  fs,
  http,
  dir,
  remote: 'origin',
  ref: 'main',
  force: false,
  onAuth: () => ({ username: token, password: 'x-oauth-basic' }),
})
console.log('pushed to', remoteUrl)
