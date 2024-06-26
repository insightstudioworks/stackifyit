
import path from 'path';
import { StackifyitFileCombine as StackifyitFileCombineSync } from './StackifyitFileCombine';
import { StackifyitBiDirectionalSync as StackifyitFileBiDirectionalSync } from './StackifyitBiDirectionalSync';



async function main() {
	const base = path.resolve(__dirname, '..');
	const sourceGlob = '**/*';
	const stackCombine = new StackifyitFileCombineSync({
		rootDirectory: base,
		sourceGlob,
		outputPaths: ['./stackifyit-project.txt'],
		useGitIngnoreFile: './.gitignore'
	});
	stackCombine.debug = true;
	stackCombine.combine();
	stackCombine.startWatch();
	
	const syncSourceGlob = '**/*,!stackifyit-project.txt';
	const sync = new StackifyitFileBiDirectionalSync({
		rootDirectory: base,
		sourceGlob:syncSourceGlob,
		targetDirs: ['/Users/insig/myhome/repo/hubby/src/stackifyit']
	});
	sync.debug = true;
	await sync.copyAll(); // Copy all files initially
	sync.startWatch();	
}

main();

// const stackCombine = new StackifyitFileCombine({
// 	watchGlob: `${base}/Rather.jsx,${base}/Rather/**/*,${base}/InsightGenerics.js`,
// 	outputPaths: [path.join(base, './Rather/', './project.txt')]
// });
// stackCombine.debug = true;
// stackCombine.startWatch();