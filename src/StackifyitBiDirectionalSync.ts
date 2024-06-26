import chokidar from "chokidar";
import fs from 'fs-extra';
import path from 'path';
import { singleGlobToList, filesFromGlob } from './tools/helpers/glob-helpers';

export type StackifyitBiDirectionalSyncOptions = {
    rootDirectory: string;
    sourceGlob: string;
    targetDirs: string[];
};

export class StackifyitBiDirectionalSync {
    private sourceWatcher: chokidar.FSWatcher;
    private targetWatchers: chokidar.FSWatcher[] = [];
    debug: boolean = false;

    constructor(private options: StackifyitBiDirectionalSyncOptions) {}

    startWatch() {
        this.stopWatch();

        const { rootDirectory: sourceDirectory, sourceGlob, targetDirs } = this.options;
        const patterns = singleGlobToList(sourceDirectory, sourceGlob);

        this.sourceWatcher = chokidar.watch(patterns, {
            persistent: true,
            ignoreInitial: true,
        });

        this.sourceWatcher
            .on('add', this.syncFile(targetDirs, sourceDirectory))
            .on('change', this.syncFile(targetDirs, sourceDirectory))
            //.on('unlink', this.removeFile(targetDirs, sourceDirectory));

        for (const targetDir of targetDirs) {
            const targetWatcher = chokidar.watch(targetDir, {
                persistent: true,
                ignoreInitial: true,
            });

            targetWatcher
                .on('add', this.syncFile([sourceDirectory], targetDir))
                .on('change', this.syncFile([sourceDirectory], targetDir))
                //.on('unlink', this.removeFile([sourceDirectory], targetDir));

            this.targetWatchers.push(targetWatcher);
            this.log(`Watching ${targetDir}`);
        }

        this.log(`Watching ${sourceGlob} in ${sourceDirectory}`);
    }

    stopWatch() {
        if (this.sourceWatcher) {
            this.sourceWatcher.close();
        }
        for (const watcher of this.targetWatchers) {
            watcher.close();
        }
        this.targetWatchers = [];
    }

    private log(...logs: any[]) {
        if (this.debug) {
            console.log(...logs);
        }
    }

    private syncFile(targetDirs: string[], baseDir: string) {
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

    private removeFile(targetDirs: string[], baseDir: string) {
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

    async copyAll() {
        const { rootDirectory: sourceDirectory, sourceGlob, targetDirs } = this.options;
        const patterns = singleGlobToList(sourceDirectory, sourceGlob);
        const files = await filesFromGlob(sourceDirectory, sourceGlob);

        for (const filePath of files) {
            const relativePath = path.relative(sourceDirectory, filePath);
            for (const targetDir of targetDirs) {
                const targetPath = path.join(targetDir, relativePath);
                fs.copy(filePath, targetPath)
                    .then(() => this.log(`Copied ${filePath} to ${targetPath}`))
                    .catch((err: any) => this.log(`Error copying ${filePath} to ${targetPath}`, err));
            }
        }
    }
}
