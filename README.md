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

This package is possible to be bundled for browser but need a little hack.
There's a dependency `hosted-git-info` which uses `require('url')` to parse
URLs, but it is totally safe to use the native `URL` class in modern browsers.
So you can apply this patch (it is for hosted-git-info 7.0.1):

```diff
diff --git a/lib/parse-url.js b/lib/parse-url.js
index 7d5489c008ab4a0a57cbf31043557ae6e1082f92..82efa6af5eecf8e3a5688087161b7fa6822031fb 100644
--- a/lib/parse-url.js
+++ b/lib/parse-url.js
@@ -1,4 +1,4 @@
-const url = require('url')
+// const url = require('url')

 const lastIndexOfBefore = (str, char, beforeChar) => {
   const startPosition = str.indexOf(beforeChar)
@@ -7,7 +7,7 @@ const lastIndexOfBefore = (str, char, beforeChar) => {

 const safeUrl = (u) => {
   try {
-    return new url.URL(u)
+    return new URL(u)
   } catch {
     // this fn should never throw
   }
```

## License

MIT @ [hyrious](https://github.com/hyrious)
