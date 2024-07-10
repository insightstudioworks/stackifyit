import path from 'path';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import archiver from 'archiver';
import { correctPaths, filePathsFromGlob } from './tools/helpers/glob-helpers';
import { readGitignore } from './tools/helpers/readGitIngore';
import { StackifyitBase, StackifyitOptionsBase } from './StackifyItBase.abstract';

const predefinedIgnores: string[] = ['!**/.git/**'];

type StackifyitFileZipOptions = StackifyitOptionsBase & {
    sourceGlob: string;
    outputPaths: string[];
    useGitIngnoreFile?: string;
}

/**
 * StackifyitFileZip class.
 * This class is responsible for file zip operations.
 */
export class StackifyitFileZip extends StackifyitBase {
    protected watcher!: chokidar.FSWatcher;
    private predefinedIgnores: string[] = [];
    debug: boolean = false;

    constructor(protected options: StackifyitFileZipOptions) {
        super(options);
    }

    /**
     * Starts watching the source directory for changes.
     * @returns {Promise<void>}
     */
    async startWatch(): Promise<void> {
        await this.stopWatch();

        const { rootDirectory, sourceGlob } = this.options;
        const allGlobs = await this.allGlobs();
        const patterns = this.singleGlobToList(rootDirectory, allGlobs);

        this.watcher = chokidar.watch(patterns, {
            persistent: true,
            ignoreInitial: true,
        });

        this.watcher
            .on('add', this.zipFiles.bind(this))
            .on('change', this.zipFiles.bind(this))
            .on('unlink', this.zipFiles.bind(this));

        if (this.debug) {
            console.log(`Watching ${sourceGlob} in ${rootDirectory}`);
        }
    }

    /**
     * Stops watching the source directory for changes.
     * @returns {Promise<void>}
     */
    async stopWatch(): Promise<void> {
        if (this.watcher) {
            await this.watcher.close();
        }
    }

    /**
     * Zips files based on the specified glob pattern and outputs the zipped files to the specified paths.
     * @returns {Promise<void>}
     */
    async zipFiles(): Promise<void> {
        const { rootDirectory, outputPaths } = this.options;

        for (const outputPath of outputPaths) {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => {
                if (this.debug) {
                    console.log(archive.pointer() + ' total bytes');
                    console.log('archiver has been finalized and the output file descriptor has closed.');
                }
            });

            archive.on('error', (err: any) => {
                throw err;
            });

            archive.pipe(output);
            
            const filesToZip = await filePathsFromGlob(rootDirectory, await this.allGlobs());
            filesToZip.forEach(file => {
                this.log(`zipping ${file}`)
                const relativePath = path.relative(rootDirectory, file);
                archive.file(file, { name: relativePath });
            });

            await archive.finalize();
            this.log(`zipping finalized`)
        }
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
     * Converts a single glob pattern to a list of absolute paths.
     * @param {string} rootDirectory - The root directory.
     * @param {string} allGlobs - The combined list of glob patterns.
     * @returns {string[]} The list of absolute paths.
     */
    singleGlobToList(rootDirectory: string, allGlobs: string): string[] {
        return allGlobs.split(',').map(glob => path.join(rootDirectory, glob));
    }
}
