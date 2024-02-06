/**
 * A RegExp to match semver versions. Note that it doesn't match the `v` prefix.
 */
declare const semver: RegExp;

/**
 * Fetch GitHub tags of some repo. Same as `git ls-remote --tags {repo}`.
 * @param repo The GitHub repository spec in form of `"{owner}/{repo}"`. Can be the "repo" field in the result of {@link parseRepo}.
 * @return Tags of the repo, will be empty array if it fails to find the repo or there's no tags.
 */
declare function githubTags(repo: string): Promise<string[]>;

/**
 * Detect version &rarr; tag pattern, the pattern will be a string with `{}` as the version placeholder.
 * @param tags The tags to guess the pattern from. Can be the result of {@link githubTags}.
 * @param hints Hints to increase the rank of some patterns. E.g. `["create-vite"]` will make `"create-vite@{}"` rank over `"v{}"`.
 * @returns The guessed pattern, e.g. `"v{}"`.
 */
declare function guessTagPattern(tags: string[], hints?: string[]): string;

/**
 * Get the GitHub repository URL of a package.
 * @param pkg The package.json object, you should get it via `JSON.parse(fs.readFileSync("package.json"))`.
 * @returns The GitHub repository URL, e.g. `"https://github.com/vitejs/vite/tree/HEAD/packages/vite"`.
 *          Will be an empty string if it fails to find the repo info.
 */
declare function githubRepo(pkg: any): string;

/**
 * Parse the GitHub repository URL and get interesting parts.
 * @param str The url to parse, e.g. `"https://github.com/vitejs/vite/tree/HEAD/packages/vite"`.
 *            Can be the result of {@link githubRepo}.
 * @returns Parsed data, including the repo name `"vitejs/vite"` and the folder `"packages/vite"`.
 *          The folder will be an empty string if it's the root of the repo.
 */
declare function parseRepo(str: string): { repo: string; folder: string } | null;

/**
 * Fetch package.json of a package from CDNs.
 * @param pkgname The package name, e.g. `"vite"`.
 * @returns The package.json object, throws error if the CDN returns non-200 status.
 */
declare function packageJSON(pkgname: string): Promise<any>;

/**
 * Use jsDelivr API to get resolved version of a package.
 * @param pkgname The package name, e.g. `"vite"`.
 * @param spec The version spec, e.g. `"latest"`, `"1.x"`, `"^1.2.3"`.
 * @returns The resolved version, or `null` if it fails to find the package or version.
 */
declare function resolvedVersion(pkgname: string, spec?: string): Promise<string | null>;

export { semver, githubTags, guessTagPattern, githubRepo, parseRepo, packageJSON, resolvedVersion };
