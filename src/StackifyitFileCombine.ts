import chokidar from "chokidar";
import fs from 'fs/promises';
import path from 'path';
import { correctPaths, filePathsFromGlob, singleGlobToList, correctPaths as windowsPathToNode } from './tools/helpers/glob-helpers';
import { readGitignore } from "./tools/helpers/readGitIngore";
import { StackifyitFileWatcherBase, StackifyitOptionsBase } from "./models/StackifyitFileWatcherBase.abstract";

const predefinedIgnores: string[] = ['!**/.git/**'];

export type StackifyitFileCombineOptions = StackifyitOptionsBase & {
    sourceGlob: string;
    outputPaths: string[];
}

/**
 * StackifyitFileCombine class.
 * This class is responsible for combining files.
 */
export class StackifyitFileCombine extends StackifyitFileWatcherBase {
    debug: boolean = false;
    watcher!: chokidar.FSWatcher;
    predefinedIgnores: string[] = [];

    constructor(protected options: StackifyitFileCombineOptions) {
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
            this.log('gitIngnoreList', ...gitIngnoreList)
            this.predefinedIgnores.push(...gitIngnoreList);
        }

        const ingnoreOutputs = this.options.outputPaths.map(p => {
            return `!${this.pathfromRoot(correctPaths(p))}`
        });
        const sourceGlobs = this.options.sourceGlob.split(',');
        const result = [
            ...ingnoreOutputs,
            ...sourceGlobs,
            ...this.predefinedIgnores
        ].join(',')
        this.log('allGlobs', result)
        return result;
    }

    /**
     * Starts watching the source directory for changes.
     * @returns {Promise<void>}
     */
    async startWatch(): Promise<void> {
        await this.stopWatch();
        this.createStopPromise();
        
        const sourcePatterns = singleGlobToList(this.options.rootDirectory, await this.allGlobs());
        this.watcher = chokidar.watch(sourcePatterns, {
            persistent: true,
            ignoreInitial: false // do not ignore any files
        });

        this.watcher.on('change', (filePath) => {
            this.log(`File changed: ${filePath}`);
            this.combine();
        });  
        this.log(`Watching "${this.options.sourceGlob}" in ${this.options.rootDirectory}`);
    }

    /**
     * Stops watching the source directory for changes.
     * @returns {Promise<void>}
     */
    async stopWatch(): Promise<void> {
        if (this.watcher) {
            await this.watcher.close();
        }
        this.stopResolve();   
    }

    /**
     * Logs messages if debug mode is enabled.
     * @param {...any} logs - The messages to log.
     * @returns {void}
     */
    log(...logs: any[]): void {
        if (this.debug) {
            if(this.options.logger){
                this.options.logger(...logs);
            }
            else{
                console.log(...logs);
            }
        }
    }

    /**
     * Combines the content of files matching the glob patterns and saves to output paths.
     * @returns {Promise<void>}
     */
    async combine(): Promise<void> {
        let projectText = "";
        const paths = await filePathsFromGlob(this.options.rootDirectory, await this.allGlobs());
        for (let filePath of paths) {
            const nodePath = windowsPathToNode(filePath);
            this.log(`Combine: ${nodePath}`)
            const fileBuffer = await fs.readFile(nodePath);
            const fileContent = fileBuffer.toString();
            projectText += 'File:' + nodePath + "\n----------\n" + fileContent + "\n----------\n";
        }

        for (const projectTextSavePath of this.options.outputPaths) {
            await fs.writeFile(this.pathfromRoot(projectTextSavePath), projectText);
            this.log(`Copied Combined into ${this.pathfromRoot(projectTextSavePath)}`)
        }
    }
}
