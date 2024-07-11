import chokidar from "chokidar";
import fs from 'fs-extra';
import path from 'path';
import { singleGlobToList, filePathsFromGlob } from './tools/helpers/glob-helpers';
import { readGitignore } from "./tools/helpers/readGitIngore";
import { StackifyitFileWatcherBase, StackifyitOptionsBase } from "./models/StackifyitFileWatcherBase.abstract";

const predefinedIgnores: string[] = ['!**/.git/**'];

export type StackifyitBiDirectionalSyncOptions = StackifyitOptionsBase & {
    sourceGlob: string;
    targetDirs: string[];
}

/**
 * StackifyitBiDirectionalSync class.
 * This class is responsible for synchronizing files bidirectionally.
 */
export class StackifyitBiDirectionalSync extends StackifyitFileWatcherBase{
    private sourceWatcher!: chokidar.FSWatcher;
    private targetWatchers: chokidar.FSWatcher[] = [];
    predefinedIgnores: string[] = [];
    debug: boolean = false;

    constructor(protected options: StackifyitBiDirectionalSyncOptions) {
        super(options);
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
        this.createStopPromise();

        const patterns = await this.allGlobs();
        const sourcePatterns = singleGlobToList(this.options.rootDirectory, patterns);
        this.sourceWatcher = chokidar.watch(sourcePatterns, {
            persistent: true,
            ignoreInitial: true,
        });

        this.sourceWatcher
            .on('add', this.syncToTargets.bind(this))
            .on('change', this.syncToTargets.bind(this))
            .on('unlink', this.removeFromTargets.bind(this));

        for (const targetDir of this.options.targetDirs) {
            const targetPatterns = singleGlobToList(targetDir, patterns);
            const targetWatcher = chokidar.watch(targetPatterns, {
                persistent: true,
                ignoreInitial: true,
            });

            targetWatcher
                .on('add', this.syncToSource.bind(this))
                .on('change', this.syncToSource.bind(this))
                .on('unlink', this.removeFromSource.bind(this));

            this.targetWatchers.push(targetWatcher);
        }

        if (this.debug) {
            console.log('Watching for changes...');
        }
    }

    /**
     * Stops watching the source and target directories for changes.
     * @returns {Promise<void>}
     */
    async stopWatch(): Promise<void> {
        if (this.sourceWatcher) {
            await this.sourceWatcher.close();
        }
        for (const targetWatcher of this.targetWatchers) {
            await targetWatcher.close();
        }
        this.targetWatchers = [];
        this.stopResolve();
    }

    /**
     * Synchronizes changes from the source directory to the target directories.
     * @param {string} filePath - The file path that was added or changed.
     */
    private async syncToTargets(filePath: string): Promise<void> {
        const relativePath = path.relative(this.options.rootDirectory, filePath);

        for (const targetDir of this.options.targetDirs) {
            const targetPath = path.join(targetDir, relativePath);
            await fs.copy(filePath, targetPath);
            if (this.debug) {
                console.log(`Copied ${filePath} to ${targetPath}`);
            }
        }
    }

    /**
     * Removes a file from the target directories.
     * @param {string} filePath - The file path that was removed.
     */
    private async removeFromTargets(filePath: string): Promise<void> {
        const relativePath = path.relative(this.options.rootDirectory, filePath);

        for (const targetDir of this.options.targetDirs) {
            const targetPath = path.join(targetDir, relativePath);
            await fs.remove(targetPath);
            if (this.debug) {
                console.log(`Removed ${targetPath}`);
            }
        }
    }

    /**
     * Synchronizes changes from the target directories to the source directory.
     * @param {string} filePath - The file path that was added or changed.
     */
    private async syncToSource(filePath: string): Promise<void> {
        const relativePath = path.relative(this.options.targetDirs[0], filePath);
        const sourcePath = path.join(this.options.rootDirectory, relativePath);
        await fs.copy(filePath, sourcePath);
        if (this.debug) {
            console.log(`Copied ${filePath} to ${sourcePath}`);
        }
    }

    /**
     * Removes a file from the source directory.
     * @param {string} filePath - The file path that was removed.
     */
    private async removeFromSource(filePath: string): Promise<void> {
        const relativePath = path.relative(this.options.targetDirs[0], filePath);
        const sourcePath = path.join(this.options.rootDirectory, relativePath);
        await fs.remove(sourcePath);
        if (this.debug) {
            console.log(`Removed ${sourcePath}`);
        }
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
                await fs.copy(filePath, targetPath);
                if (this.debug) {
                    console.log(`Copied ${filePath} to ${targetPath}`);
                }
            }
        }
    }
}
