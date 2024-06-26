import * as glob from 'glob';
import { promises as fs } from 'fs';

/**
 * Combines files matched by a glob pattern into a single string.
 * @param pattern The glob pattern to match files.
 * @returns A promise that resolves to a string containing the combined file contents.
 */
export async function combineFiles(pattern: string): Promise<string> {
    try {
        // Get all file paths matching the glob pattern
        const filePaths = glob.sync(pattern, { nodir: false });

        // Read all files and combine their contents
        const fileContents = await Promise.all(filePaths.map(async (filePath) => {
            return fs.readFile(filePath, 'utf8');
        }));

        return fileContents.join('');
    } catch (error) {
        console.error('Error combining files:', error);
        throw error;
    }
}

