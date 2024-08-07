
# Stackifyit

Stackifyit is a toolset for synchronizing and combining files across directories, utilizing glob patterns and `.gitignore` rules for selective file operations. This project provides three primary classes: `StackifyitBiDirectionalSync`, `StackifyitFileCombine`, and `StackifyitFileZip`.

## Installation

```sh
npm install stackifyit --save-dev
```

## Usage

### StackifyitFileCombine

The `StackifyitFileCombine` class combines files from a source directory matching a specified glob pattern and outputs the combined content to specified paths.

#### Example

```typescript
import { StackifyitFileCombine } from 'stackifyit';
import path from 'path';

async function main() {
    const base = path.resolve(__dirname, '..');
    const sourceGlob = '**/*';
    const outputPaths = ['your-project.txt'];
    const stackCombine = new StackifyitFileCombine({
        rootDirectory: base,
        sourceGlob,
        outputPaths,
        useGitIngnoreFile: '.gitignore'
    });

    stackCombine.debug = true;
    await stackCombine.combine();
    stackCombine.startWatch();
}

main();
```

#### Options

- `rootDirectory`: The root directory to watch and combine files from.
- `sourceGlob`: Glob pattern to match source files.
- `outputPaths`: Array of paths where the combined content will be saved.
- `useGitIngnoreFile`: Optional path to a `.gitignore` file for excluding files.

#### Methods

- **`startWatch()`**: Starts watching the specified source directory and combines files based on changes.
- **`stopWatch()`**: Stops the file watcher.
- **`combine()`**: Combines files based on the specified glob pattern and outputs the combined content to the specified paths.

### StackifyitBiDirectionalSync

The `StackifyitBiDirectionalSync` class synchronizes files bidirectionally between a source directory and multiple target directories. It ensures that changes in any directory are reflected in all other directories.

#### Example

```typescript
import { StackifyitBiDirectionalSync } from 'stackifyit';
import path from 'path';

async function main() {
    const base = path.resolve(__dirname, '..');
    const sourceGlob = '**/*';
    const targetDirs = ['/path/to/target/dir'];
    const sync = new StackifyitBiDirectionalSync({
        rootDirectory: base,
        sourceGlob,
        targetDirs,
        useGitIngnoreFile: '.gitignore'
    });

    sync.debug = true;
    await sync.copyToTargets(); // Copy all files initially
    sync.startWatch();
}

main();
```

#### Options

- `rootDirectory`: The root directory to watch and sync files from.
- `sourceGlob`: Glob pattern to match source files.
- `targetDirs`: Array of target directories to sync files to.
- `useGitIngnoreFile`: Optional path to a `.gitignore` file for excluding files.

#### Methods

- **`startWatch()`**: Starts watching the specified source directory and synchronizes files based on changes.
- **`stopWatch()`**: Stops the file watcher.
- **`copyToTargets()`**: Copies all files from the source directory to the target directories initially.

### StackifyitFileZip

The `StackifyitFileZip` class provides functionality for zipping files from a source directory matching a specified glob pattern and outputs the zipped files to specified paths.

#### Example

```typescript
import { StackifyitFileZip } from 'stackifyit';
import path from 'path';

async function main() {
    const base = path.resolve(__dirname, '..');
    const sourceGlob = '**/*';
    const outputPaths = ['output.zip'];
    const stackZip = new StackifyitFileZip({
        rootDirectory: base,
        sourceGlob,
        outputPaths,
        useGitIngnoreFile: '.gitignore'
    });

    stackZip.debug = true;
    await stackZip.zipFiles();
    stackZip.startWatch();
}

main();
```

#### Options

- `rootDirectory`: The root directory to watch and zip files from.
- `sourceGlob`: Glob pattern to match source files.
- `outputPaths`: Array of paths where the zipped files will be saved.
- `useGitIngnoreFile`: Optional path to a `.gitignore` file for excluding files.

#### Methods

- **`startWatch()`**: Starts watching the specified source directory and zips files based on changes.
- **`stopWatch()`**: Stops the file watcher.
- **`zipFiles()`**: Zips files based on the specified glob pattern and outputs the zipped files to the specified paths.

## License

This project is licensed under the MIT License.
