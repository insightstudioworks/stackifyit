import chokidar from "chokidar";
import fs from 'fs-extra';
import path from 'path';
import { singleGlobToList, filesFromGlob } from './tools/helpers/glob-helpers';
import { readGitignore } from "./tools/helpers/readGitIngore";

const predefinedIgnores:string[] = ['!**/.git/**'];

export type StackifyitBiDirectionalSyncOptions = {
    rootDirectory: string;
    sourceGlob: string;
    targetDirs: string[];
    useGitIngnoreFile?: string;
};

export class StackifyitBiDirectionalSync {
    private sourceWatcher: chokidar.FSWatcher;
    private targetWatchers: chokidar.FSWatcher[] = [];
    predefinedIgnores:string[] = [];
    debug: boolean = false;

    constructor(private options: StackifyitBiDirectionalSyncOptions) {}
    pathfromRoot(myPath:string){
        return path.join(this.options.rootDirectory, myPath);
    }
    async allGlobs(){
        this.predefinedIgnores = [...predefinedIgnores];
        if(this.options.useGitIngnoreFile){
            const gitIngnoreList = await readGitignore(this.pathfromRoot(this.options.useGitIngnoreFile));
            //console.log('gitIngnoreList',...gitIngnoreList)
            this.predefinedIgnores.push(...gitIngnoreList);
        }

        const sourceGlobs = this.options.sourceGlob.split(',');
        const result = [
            ...sourceGlobs,
            ...this.predefinedIgnores
        ].join(',')
        //console.log('allGlobs', result)
        return result;
    }
    async startWatch() {
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

    async stopWatch() {
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

    async copyToTargets() {
        const { rootDirectory: sourceDirectory, sourceGlob, targetDirs } = this.options;
        const patterns = singleGlobToList(sourceDirectory, await this.allGlobs());
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
