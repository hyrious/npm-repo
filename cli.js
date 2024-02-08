#!/usr/bin/env node
import sade from 'sade'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import * as mod from './index.js'

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

sade(pkg.name + ' <pkgname>')
  .version(pkg.version)
  .describe('Get package repository URL')
  .option('-c, --compare', 'Prints GitHub URL that compares two versions')
  .option('-l, --list', 'List recent N versions and GitHub URLs', 0)
  .option('--sed', 'Prints "s/.*/v&/"-like SED script', false)
  .option('--template', 'Prints "v{}"-like template string', false)
  .action(async function (pkgname, opts) {
    let cache = {} // { [pkgname]: { t: 0, pkg: {...}, tags: [...] } }

    const cacheDir = path.resolve(os.tmpdir(), 'hyrious-npm-repo')
    const cachePath = path.resolve(cacheDir, 'cache.json')
    const cacheTTL = 30 * 60_000 // 30 minutes

    if (fs.existsSync(cachePath) && Date.now() - fs.lstatSync(cachePath).mtimeMs < cacheTTL) {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    }

    let pkg, tags, cached = false
    if (cache[pkgname]) {
      if (Date.now() - cache[pkgname].t < cacheTTL) {
        pkg = cache[pkgname].pkg
        tags = cache[pkgname].tags
        cached = true
      }
      else { delete cache[pkgname] }
    }

    if (!cached) {
      pkg = await mod.packageJSON(pkgname)
      if (!pkg)
        throw new Error(`Package "${pkgname}" not found`)

      const githubRepoUrl = mod.githubRepo(pkg)
      if (!githubRepoUrl)
        throw new Error(`Repository URL not found in "${pkgname}"`)

      const info = mod.parseRepo(githubRepoUrl)
      if (!info)
        throw new Error(`Cannot handle repository URL "${githubRepoUrl}"`)

      tags = await mod.githubTags(info.repo)
      if (tags.length == 0)
        throw new Error(`No tags found in repository "${pkgname}"`)

      cache[pkgname] = { t: Date.now(), pkg, tags }
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf8')
    }

    const githubRepoUrl = mod.githubRepo(pkg)
    if (!githubRepoUrl)
      throw new Error(`Repository URL not found in "${pkgname}"`)

    const info = mod.parseRepo(githubRepoUrl)
    if (!info)
      throw new Error(`Cannot handle repository URL "${githubRepoUrl}"`)

    const suffix = info.folder ? `/${info.folder}` : ''
    const hints = [pkg.version, pkgname + '@' + pkg.version]
    if (info.folder)
      hints.push(info.folder)
    const pattern = mod.guessTagPattern(tags, hints)

    if (opts.compare) {
      const c = opts.compare, threeDots = c.includes('...') || !c.includes('..')
      const parts = threeDots ? c.split('...') : c.split('..')
      if (parts.length == 1)
        parts.push('latest')
      const compare = []
      for (const spec of parts) {
        if (spec == 'latest')
          compare.push(pkg.version)
        else if (mod.semver.test(spec))
          compare.push(spec)
        else {
          const version = await mod.resolvedVersion(pkgname, spec)
          if (version)
            compare.push(version)
          else
            throw new Error(`Failed to resolve "${spec}" in "${pkgname}"`)
        }
      }
      const spec = compare.map(v => pattern.replace('{}', v)).join(threeDots ? '...' : '..')
      console.log(`https://github.com/${info.repo}/compare/${spec}`)
    }

    if (opts.list) {
      const to_i = s => {
        const n = +s
        if (Number.isFinite(n)) return n
        if (!s) return 0
        const m = s.match(/\d+/)
        return m ? +m[0] : 0
      }
      const pat = new RegExp(pattern.replace('{}', '(' + mod.semver.source + ')'))
      let n = opts.list === true ? 20 : +opts.list, m = null,
        ver = tags.reduce((s, t) => ((m = t.match(pat)) && s.push(m[1]), s), [])
                  .sort((a, b) => {
                    const ma = a.match(mod.semver), mb = b.match(mod.semver)
                    for (let i = 1; i <= 5; i++) if (ma[i] != mb[i])
                      return to_i(mb[i]) - to_i(ma[i])
                    return 0
                  })
                  .slice(0, n),
        len = ver.reduce((a, b) => Math.max(a, b.length), 0)
      for (const v of ver)
        console.log(v.padEnd(len) + '  ' + `https://github.com/${info.repo}/tree/${pattern.replace('{}', v)}` + suffix)
    }

    if (opts.sed)
      console.log(`s/.*/${pattern.replace('{}', '&')}/`)

    if (opts.template)
      console.log(pattern)

    if (!opts.compare && !opts.list && !opts.sed && !opts.template) {
      const prefix = `https://github.com/${info.repo}/tree/${pattern.replace('{}', pkg.version)}`
      console.log(prefix + suffix)
    }
  })
  .parse(process.argv, { string: ['compare'] })
