import fsp from 'fs/promises';

export async function readGitignore(gitignorePath: string): Promise<string[]> {
    try {
        await fsp.access(gitignorePath);
    } catch {
        return [];
    }

    const ignorePatterns = (await fsp.readFile(gitignorePath, 'utf8'))
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => `!${line.trim()}`);
    return ignorePatterns;
}

