import repoUrlFromPackage from 'repo-url-from-package'

export let verbose = false

export function setVerbose(v) { verbose = v }

function log(...args) {
  if (verbose)
    console.log('(npm-repo)', ...args)
}

function scan(s, search, end) {
  let i = s.indexOf(search), j = i, result = []
  while (i != -1) {
    j = s.indexOf(end, i + search.length)
    result.push(s.slice(i + search.length, j))
    i = s.indexOf(search, j + end.length)
  }
  return result
}

export async function githubTags(repo) {
  if (typeof repo != 'string' || repo.split('/').length != 2)
    return []

  // Try Git Transfer Protocols, it uses less IO
  log('fetching tags with git transfer protocols')
  const resp = await fetch('https://github.com/' + repo + '/info/refs?service=git-upload-pack').catch(() => null)
  if (resp && resp.ok)
    return scan(await resp.text(), 'refs/tags/', '\n').filter(e => !e.endsWith('^{}'))
  
  // Try restful API
  log('fetching tags with restful api')
  const resp2 = await fetch('https://api.github.com/repos/' + repo + '/git/refs/tags').catch(() => null)
  if (resp2 && resp2.ok)
    return (await resp2.json()).map(e => e.ref.slice('refs/tags/'.length))

  // Give up
  log('failed to fetch tags')
  return []
}

// the loose one from 'semver' package, without 'v' prefix
export const semver = /(\d+)\.(\d+)\.(\d+)(?:-?((?:\d+|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:\d+|\d*[A-Za-z-][\dA-Za-z-]*))*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?/

export function isValidVersion(v) {
  const m = v.match(semver)
  return m && m.index == 0 && m[0].length == v.length
}

// [hints] can be ["0.1.0", "pkgname"] etc, we count how many hints are found
// in the tags string to increase its weighting.
export function guessTagPattern(tags, hints = []) {
  log('guessing tags pattern from', tags, 'with hints', hints)
  if (tags.length == 0)
    return 'v{}'

  const patterns = Object.create(null)

  for (let i = tags.length - 1; i >= 0; i--) {
    const tag = tags[i], m = tag.match(semver)
    if (m == null)
      continue
    const pat = tag.slice(0, m.index) + '{}' + tag.slice(m.index + m[0].length)
    patterns[pat] = (patterns[pat] || 0) + 1
    if (hints.length > 0) for (const hint of hints) if (tag.includes(hint))
      patterns[pat] += tag == hint ? 1000 : 10
  }

  let max = 0, ret = 'v{}'
  for (const p in patterns) if (max < patterns[p])
    max = patterns[ret = p]

  return ret
}

export function githubRepo(pkg) {
  return repoUrlFromPackage(pkg).url
}

const https_ = /^https?:\/\//

export function parseRepo(str) {
  if (typeof str != 'string')
    throw new Error('Invalid repo string, expecting an GitHub URL, got ' + str)

  if (https_.test(str)) try {
    const url = new URL(str)
    // https://github.com/vitejs/vite/tree/HEAD/packages/vite
    if (url.hostname == 'github.com') {
      const parts = url.pathname.split('/')
      const repo = parts.slice(1, 3).join('/') // 'vitejs/vite'
      const folder = parts.slice(5).join('/')  // 'packages/vite'
      return { repo, folder }
    } else {
      return null
    }
  } catch {
    return null
  }

  if (str.split('/').length == 2) {
    return { repo: str, folder: '' }
  }

  return null
}

export async function packageJSON(pkgname) {
  log('fetching package.json with unpkg for', pkgname)
  const resp = await fetch(`https://unpkg.com/${pkgname}/package.json`, { signal: AbortSignal.timeout(5000) })
    .catch(err => err.name == 'TimeoutError' ? null : Promise.reject(err))
  if (resp && resp.ok)
    return resp.json()
  if (resp)
    throw new Error(await resp.text())

  log('fetching package.json with esm.sh for', pkgname)
  const resp2 = await fetch(`https://esm.sh/${pkgname}/package.json`)
  if (resp2.ok)
    return resp2.json()
  else
    throw new Error(await resp2.text())
}

export async function resolvedVersion(pkgname, spec = 'latest') {
  log('resolving version for', pkgname + '@' + spec)
  const resp = await fetch(`https://data.jsdelivr.com/v1/packages/npm/${pkgname}/resolved?specifier=${spec}`)
  if (resp.ok)
    return (await resp.json()).version
  else
    throw new Error(await resp.text())
}
