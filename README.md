# @hyrious/npm-repo

> [`npm repo`](https://docs.npmjs.com/cli/v10/commands/npm-repo), but look for
> corresponding GitHub tags.

## Usage

### CLI

```console
$ npx @hyrious/npm-repo vite
https://github.com/vitejs/vite/tree/v5.0.12/packages/vite
$                                 # ^^^^^^^ usually 'HEAD'

$ npx @hyrious/npm-repo vite --comapre 5.0.11
$ npx @hyrious/npm-repo vite --comapre 5.0.11...latest
https://github.com/vitejs/vite/compare/v5.0.11...v5.0.12
$                                    # ^^^^^^^ resolves to GitHub tags
$                                             # ^^^^^^ resolves dist tags
```

You can combine usage with [`taze`](https://github.com/antfu/taze) to firstly
check updates in your local project, then pass into this tool to read the diff
on GitHub quickly.

### Browser

This package is possible to be bundled for browser.

## License

MIT @ [hyrious](https://github.com/hyrious)
