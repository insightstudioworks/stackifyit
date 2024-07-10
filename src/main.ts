
import path from 'path';
import { StackifyitFileCombine } from './StackifyitFileCombine';
import { StackifyitBiDirectionalSync } from './StackifyitBiDirectionalSync';
import { StackifyitFileZip } from './StackifyitFileZip';



async function main() {
	const base = path.resolve(__dirname, '..');
	const sourceGlob = '**/*';
	const proms = [];
	console.log(`Init ${base} for sync operations`)
	// const stackCombine = new StackifyitFileCombine({
	// 	rootDirectory: base,
	// 	sourceGlob,
	// 	outputPaths: ['./stackifyit-project.txt'],
	// 	useGitIngnoreFile: './.gitignore'
	// });
	// //stackCombine.debug = true;
	// proms.push(stackCombine.combine());
	// proms.push(stackCombine.startWatch());



	const stackCombine = new StackifyitFileZip({
		rootDirectory: base,
		sourceGlob,
		outputPaths: ['./stackifyit-project.zip'],
		useGitIngnoreFile: '.gitignore'
	});
	stackCombine.debug = true;
	proms.push(stackCombine.zipFiles());
	proms.push(stackCombine.startWatch());


	// const bidirSourceGlob = '**/*,!stackifyit-project.txt,!dist';
	// const sync = new StackifyitBiDirectionalSync({
	// 	rootDirectory: base,
	// 	sourceGlob:bidirSourceGlob,
	// 	targetDirs: ['/Users/insig/myhome/repo/after-effects-scripts/src/stackifyit'],
	// 	useGitIngnoreFile: './.gitignore'
	// });
	// //sync.debug = true;
	// proms.push(sync.copyToTargets()); // Copy all files initially
	// proms.push(sync.startWatch());	
	await Promise.all(proms);
	console.log(`Ready, watching ${base} for sync operations`)
}

main();

// const stackCombine = new StackifyitFileCombine({
// 	watchGlob: `${base}/Rather.jsx,${base}/Rather/**/*,${base}/InsightGenerics.js`,
// 	outputPaths: [path.join(base, './Rather/', './project.txt')]
// });
// stackCombine.debug = true;
// stackCombine.startWatch();