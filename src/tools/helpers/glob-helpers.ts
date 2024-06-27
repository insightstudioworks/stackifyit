import * as path from 'path';
const fg = require('fast-glob');

export function correctPaths(path: string) {
    return path.replace(/\\/g, '/');
}

export function singleGlobToList(rootDirectory: string, globPaths: string) {
    return globPaths.split(',').map(globPath => {
        globPath = globPath.trim();
        if (globPath.startsWith('!')) {
            return '!' + correctPaths(path.resolve(rootDirectory, globPath.substring(1)));
        }
        return correctPaths(path.resolve(rootDirectory, globPath));
    });
}

export async function filePathsFromGlob(rootDirectory: string, globPaths: string) {
    const combinedPatternsArray = singleGlobToList(rootDirectory, globPaths);
    const files = fg.sync(combinedPatternsArray, { dot: true });
    return files;
}