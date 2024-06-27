import chokidar from "chokidar";
import fs from 'fs-extra';
import path from 'path';
import { singleGlobToList, filePathsFromGlob } from './tools/helpers/glob-helpers';
import { readGitignore } from "./tools/helpers/readGitIngore";

const predefinedIgnores: string[] = ['!**/.git/**'];

export type StackifyitBiDirectionalSyncOptions = {
    rootDirectory: string;
    sourceGlob: string;
    targetDirs: string[];
    useGitIngnoreFile?: string;
}

/**
 * Class to synchronize files bidirectionally between a source directory and multiple target directories.
 */
export class StackifyitBiDirectionalSync {
    private sourceWatcher: chokidar.FSWatcher;
    private targetWatchers: chokidar.FSWatcher[] = [];
    predefinedIgnores: string[] = [];
    debug: boolean = false;

    constructor(private options: StackifyitBiDirectionalSyncOptions) {}

    /**
     * Converts a given path to an absolute path from the root directory.
     * @param {string} myPath - The path to convert.
     * @returns {string} The absolute path.
     */
    pathfromRoot(myPath: string): string {
        return path.join(this.options.rootDirectory, myPath);
    }

    /**
     * Combines all glob patterns, including user-defined and predefined ignores.
     * @returns {Promise<string>} The combined list of glob patterns.
     */
    async allGlobs(): Promise<string> {
        this.predefinedIgnores = [...predefinedIgnores];
        if (this.options.useGitIngnoreFile) {
            const gitIngnoreList = await readGitignore(this.pathfromRoot(this.options.useGitIngnoreFile));
            console.log('gitIngnoreList', gitIngnoreList)
            this.predefinedIgnores.push(...gitIngnoreList);
        }

        const sourceGlobs = this.options.sourceGlob.split(',');
        const result = [
            ...sourceGlobs,
            ...this.predefinedIgnores
        ].join(',')
        console.log('allGlobs', result)
        return result;
    }

    /**
     * Starts watching the source and target directories for changes.
     * @returns {Promise<void>}
     */
    async startWatch(): Promise<void> {
        await this.stopWatch();

        const { rootDirectory: sourceDirectory, sourceGlob, targetDirs } = this.options;
        const allGlobs = await this.allGlobs();
        const patterns = singleGlobToList(sourceDirectory, allGlobs);

        this.sourceWatcher = chokidar.watch(patterns, {
            persistent: true,
            ignoreInitial: true,
        });

        this.sourceWatcher
            .on('add', this.syncFile(targetDirs, sourceDirectory))
            .on('change', this.syncFile(targetDirs, sourceDirectory))
            .on('unlink', this.removeFile(targetDirs, sourceDirectory));

        for (const targetDir of targetDirs) {
            const targetWatcher = chokidar.watch(targetDir, {
                persistent: true,
                ignoreInitial: true,
            });

            targetWatcher
                .on('add', this.syncFile([sourceDirectory], targetDir))
                .on('change', this.syncFile([sourceDirectory], targetDir))
                .on('unlink', this.removeFile([sourceDirectory], targetDir));

            this.targetWatchers.push(targetWatcher);
            this.log(`Watching ${targetDir}`);
        }

        this.log(`Watching ${sourceGlob} in ${sourceDirectory}`);
    }

    /**
     * Stops watching the source and target directories for changes.
     * @returns {Promise<void>}
     */
    async stopWatch(): Promise<void> {
        const prom = []
        if (this.sourceWatcher) {
            prom.push(this.sourceWatcher.close());
        }
        for (const watcher of this.targetWatchers) {
            prom.push(watcher.close());
        }
        await Promise.all(prom);
        this.targetWatchers = [];
    }

    /**
     * Logs messages if debug mode is enabled.
     * @param {...any} logs - The messages to log.
     * @returns {void}
     */
    private log(...logs: any[]): void {
        if (this.debug) {
            console.log(...logs);
        }
    }

    /**
     * Synchronizes a file from the base directory to the target directories.
     * @param {string[]} targetDirs - The target directories.
     * @param {string} baseDir - The base directory.
     * @returns {(filePath: string) => void} A function to synchronize a file.
     */
    private syncFile(targetDirs: string[], baseDir: string): (filePath: string) => void {
        return (filePath: string) => {
            const relativePath = path.relative(baseDir, filePath);
            for (const targetDir of targetDirs) {
                const targetPath = path.join(targetDir, relativePath);
                fs.copy(filePath, targetPath)
                    .then(() => this.log(`Copied ${filePath} to ${targetPath}`))
                    .catch((err: any) => this.log(`Error copying ${filePath} to ${targetPath}`, err));
            }
        };
    }

    /**
     * Removes a file from the target directories.
     * @param {string[]} targetDirs - The target directories.
     * @param {string} baseDir - The base directory.
     * @returns {(filePath: string) => void} A function to remove a file.
     */
    private removeFile(targetDirs: string[], baseDir: string): (filePath: string) => void {
        return (filePath: string) => {
            const relativePath = path.relative(baseDir, filePath);
            for (const targetDir of targetDirs) {
                const targetPath = path.join(targetDir, relativePath);
                fs.remove(targetPath)
                    .then(() => this.log(`Removed ${targetPath}`))
                    .catch((err: any) => this.log(`Error removing ${targetPath}`, err));
            }
        };
    }

    /**
     * Copies all files from the source directory to the target directories initially.
     * @returns {Promise<void>}
     */
    async copyToTargets(): Promise<void> {
        const patterns = await this.allGlobs();
        const files = singleGlobToList(this.options.rootDirectory, patterns);

        for (const filePath of files) {
            for (const targetDir of this.options.targetDirs) {
                const relativePath = path.relative(this.options.rootDirectory, filePath);
                const targetPath = path.join(targetDir, relativePath);
                fs.copy(filePath, targetPath)
                    .then(() => this.log(`Copied ${filePath} to ${targetPath}`))
                    .catch((err: any) => this.log(`Error copying ${filePath} to ${targetPath}`, err));
            }
        }
    }
}
