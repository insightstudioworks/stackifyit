import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

export function copyFiles(sourceGlobs: string[], targetDirs: string[], keepFiles = false): void {
    // Iterate through each source glob pattern
    for (const sourceGlob of sourceGlobs) {
        // Find files matching the glob pattern
        const sourceFiles = glob.sync(sourceGlob, { nodir: false });
        let baseDir: string;
        try {
            baseDir = path.dirname(glob.sync(sourceGlob)[0]);
        } catch (error) {
            console.error(`sourceGlob "${sourceGlob}" not found`)
            continue;
        }
        // Get the base directory of the glob pattern

        // Iterate through each target directory
        for (const targetDir of targetDirs) {
           
            // Create the target directory if it doesn't exist
            if (!fs.existsSync(targetDir)) {
                console.log(`Creating directory ${targetDir}`)
                fs.mkdirSync(targetDir, { recursive: true });
            }
            if(!keepFiles){
                // Remove existing files in the target directory
                deleteRecursive(targetDir);
            }
            
            console.log(`Copying glob: ${sourceGlob} to ${targetDir}`)
            // Copy each source file to the target directory
            for (const sourceFile of sourceFiles) {
                const relativePath = path.relative(baseDir, sourceFile);
                const targetPath = path.join(targetDir, relativePath);
                const exists = fs.existsSync(sourceFile);
                let isDirectory = false;
                if (exists) {
                    const stats = fs.lstatSync(sourceFile);
                    isDirectory = stats.isDirectory();
                }
                if (isDirectory) {
                    if (!fs.existsSync(targetPath)) {
                        console.log(`Creating directory ${targetPath}`)
                        fs.mkdirSync(targetPath, { recursive: true });
                    }
                } else {
                    
                    try {
                        fs.copyFileSync(sourceFile, targetPath);
                    } catch (error) {
                        console.log('Error copying file:', sourceFile, targetPath, error)
                    }
                }
            }
        }
    }
}

function deleteRecursive(dirPath: string) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.lstatSync(filePath);
        if (stats.isDirectory()) {
            deleteRecursive(filePath);
            try {
                fs.rmdirSync(filePath);
            } catch (error) {
                console.error(`Error deleting directory ${filePath}:`, error);
            }
        } else {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error(`Error deleting file ${filePath}:`, error);
            }
        }
    }
}
