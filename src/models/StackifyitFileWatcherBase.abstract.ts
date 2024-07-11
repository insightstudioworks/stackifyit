import path from 'path';
import chokidar from "chokidar";

export type StackifyitOptionsBase = {
    rootDirectory: string;
    useGitIngnoreFile?: string;
    logger?:(...logs: any[])=> {}
}

/**
 * Abstract base class for Stackifyit classes.
 * Provides common functionality and properties for all derived classes.
 */
export abstract class StackifyitFileWatcherBase {
    protected watcher!: chokidar.FSWatcher;
    debug: boolean = false;
    constructor(protected options: StackifyitOptionsBase) {}

    /**
     * Converts a given path to an absolute path from the root directory.
     * @param {string} myPath - The path to convert.
     * @returns {string} The absolute path.
     */
    pathfromRoot(myPath: string): string {
        return path.resolve(this.options.rootDirectory, myPath);
    }
    stopPromise = new Promise((r=>r(null)));
    stopResolve:() => void = ()=>{};
    createStopPromise(){
        this.stopResolve();
        this.stopPromise = new Promise((resolve) => {
            this.stopResolve = resolve as () => void;
        });
    }

    /**
     * Waits until the watcher is closed and then returns.
     * @returns {Promise<void>}
     */
    async waitUntilStopped(): Promise<void> {
        await this.stopPromise;
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
}