import * as path from 'path';
const fg = require('fast-glob');

/**
 * Normalizes paths to use forward slashes.
 * @param {string} inputPath - The input path to normalize.
 * @returns {string} The normalized path.
 */
export function correctPaths(inputPath: string): string {
    return inputPath.replace(/\\/g, '/');
}

/**
 * Converts a single glob pattern string into an array of normalized glob patterns.
 * @param {string} rootDirectory - The root directory for the glob patterns.
 * @param {string} globPaths - The comma-separated glob patterns.
 * @returns {string[]} The array of normalized glob patterns.
 */
export function singleGlobToList(rootDirectory: string, globPaths: string): string[] {
    return globPaths.split(',').map(globPath => {
        globPath = globPath.trim();
        if (globPath.startsWith('!')) {
            return '!' + correctPaths(path.resolve(rootDirectory, globPath.substring(1)));
        }
        return correctPaths(path.resolve(rootDirectory, globPath));
    });
}

/**
 * Gets the list of files matching the glob patterns from the root directory.
 * @param {string} rootDirectory - The root directory for the glob patterns.
 * @param {string} globPaths - The comma-separated glob patterns.
 * @returns {Promise<string[]>} The list of matching files.
 */
export async function filePathsFromGlob(rootDirectory: string, globPaths: string): Promise<string[]> {
    const combinedPatternsArray = singleGlobToList(rootDirectory, globPaths);
    const files = fg.sync(combinedPatternsArray, { dot: true });
    return files.map((file: string) => path.resolve(rootDirectory, file));
}
