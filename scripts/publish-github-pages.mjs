import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const token = process.env.GITHUB_TOKEN
const remoteUrl = process.env.GITHUB_REMOTE
const username = process.env.GITHUB_USER || '00451590'

if (!token || !remoteUrl) {
  console.error('GITHUB_TOKEN and GITHUB_REMOTE are required')
  process.exit(1)
}

const auth = () => ({ username: token, password: 'x-oauth-basic' })
const author = {
  name: username,
  email: `${username}@users.noreply.github.com`,
}

async function shouldIgnore(filepath) {
  if (filepath === '.git' || filepath.startsWith('.git/')) return true
  const parts = filepath.split('/')
  if (parts.includes('node_modules') || parts.includes('dist') || parts.includes('dist-ssr')) {
    return true
  }
  if (filepath === '.env' || (filepath.startsWith('.env.') && filepath !== '.env.example')) {
    return true
  }
  if (filepath === '.DS_Store' || filepath.endsWith('/.DS_Store')) return true
  if (filepath.startsWith('.github-disabled')) return true
  return false
}

async function walk(baseDir, rel = '') {
  const abs = path.join(baseDir, rel)
  const entries = await fs.promises.readdir(abs, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = rel ? `${rel}/${entry.name}` : entry.name
    if (await shouldIgnore(child)) continue
    if (entry.isDirectory()) files.push(...(await walk(baseDir, child)))
    else if (entry.isFile()) files.push(child)
  }
  return files
}

async function commitAll(dir, message, fileList) {
  for (const filepath of fileList) {
    await git.add({ fs, dir, filepath })
  }
  return git.commit({ fs, dir, message, author })
}

// --- main branch (source) ---
if (!fs.existsSync(path.join(root, '.git'))) {
  await git.init({ fs, dir: root, defaultBranch: 'main' })
}

const sourceFiles = await walk(root)
const shaMain = await commitAll(
  root,
  'Add Kasagatake inventory app',
  sourceFiles,
)
console.log('main commit', shaMain)

const remotes = await git.listRemotes({ fs, dir: root })
if (!remotes.find((r) => r.remote === 'origin')) {
  await git.addRemote({ fs, dir: root, remote: 'origin', url: remoteUrl })
}

await git.push({
  fs,
  http,
  dir: root,
  remote: 'origin',
  ref: 'main',
  onAuth: auth,
})
console.log('pushed main')

// --- gh-pages branch (built site) ---
const distDir = path.join(root, 'dist')
fs.writeFileSync(path.join(distDir, '.nojekyll'), '')

const pagesDir = path.join(root, '.gh-pages-tmp')
fs.rmSync(pagesDir, { recursive: true, force: true })
fs.mkdirSync(pagesDir, { recursive: true })
fs.cpSync(distDir, pagesDir, { recursive: true })

await git.init({ fs, dir: pagesDir, defaultBranch: 'gh-pages' })
const pageFiles = await walk(pagesDir)
// don't ignore dist contents in temp dir
const allPageFiles = []
async function walkAll(rel = '') {
  const abs = path.join(pagesDir, rel)
  for (const entry of await fs.promises.readdir(abs, { withFileTypes: true })) {
    if (entry.name === '.git') continue
    const child = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) await walkAll(child)
    else allPageFiles.push(child)
  }
}
await walkAll()
const shaPages = await commitAll(
  pagesDir,
  'Deploy site to GitHub Pages',
  allPageFiles,
)
console.log('gh-pages commit', shaPages)

await git.addRemote({ fs, dir: pagesDir, remote: 'origin', url: remoteUrl })
await git.push({
  fs,
  http,
  dir: pagesDir,
  remote: 'origin',
  ref: 'gh-pages',
  force: true,
  onAuth: auth,
})
console.log('pushed gh-pages')
fs.rmSync(pagesDir, { recursive: true, force: true })
