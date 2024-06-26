import chokidar from "chokidar";
import fs from 'fs/promises';
import path from 'path';
import { correctPaths, filesFromGlob, singleGlobToList, correctPaths as windowsPathToNode } from './tools/helpers/glob-helpers';
import { readGitignore } from "./tools/helpers/readGitIngore";

const predefinedIgnores: string[] = ['!**/.git/**'];


export type StackifyitFileCombineOptions = {
	rootDirectory: string;
	sourceGlob: string;
	outputPaths: string[];
	useGitIngnoreFile?: string;
}

export class StackifyitFileCombine {
	debug: boolean = false;
	watcher: chokidar.FSWatcher;
	predefinedIgnores: string[] = [];
	constructor(private options: StackifyitFileCombineOptions) {
	}
	pathfromRoot(myPath: string) {
		return path.join(this.options.rootDirectory, myPath);
	}
	async allGlobs() {
		this.predefinedIgnores = [...predefinedIgnores];
		if (this.options.useGitIngnoreFile) {
			const gitIngnoreList = await readGitignore(this.pathfromRoot(this.options.useGitIngnoreFile));
			//console.log('gitIngnoreList',...gitIngnoreList)
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
		//console.log('allGlobs', result)
		return result;
	}
	async startWatch() {
		this.stopWatch();

		const patterns = singleGlobToList(this.options.rootDirectory, await this.allGlobs());

		patterns.push(...predefinedIgnores);
		this.watcher = chokidar.watch(patterns, {
			persistent: true,
			ignoreInitial: false // do not ignore any files
		});

		this.watcher.on('change', (event, filePath) => {
			this.log(`Event: ${event}, Path: ${filePath}`);
			this.combine();
		});

		this.log(`Watching ${this.options.sourceGlob} in ${this.options.rootDirectory}`);
	}

	async stopWatch() {
		if (this.watcher) {
			await this.watcher.close();
		}
	}

	log(...logs: any[]) {
		if (this.debug) {
			console.log(...logs);
		}
	}

	async combine() {
		let projectText = "";
		const paths = await filesFromGlob(this.options.rootDirectory, await this.allGlobs());
		for (let filePath of paths) {
			const nodePath = windowsPathToNode(filePath);
			this.log(`Combine: ${nodePath}`)
			const fileBuffer = await fs.readFile(this.pathfromRoot(nodePath));
			const fileContent = fileBuffer.toString();
			projectText += 'File:' + nodePath + "\n----------\n" + fileContent + "\n----------" + "\n";
		}

		for (const projectTextSavePath of this.options.outputPaths) {
			await fs.writeFile(projectTextSavePath, this.pathfromRoot(projectText));
			this.log(`Copied Combined into ${this.pathfromRoot(projectTextSavePath)}`)
		}
	}
}
