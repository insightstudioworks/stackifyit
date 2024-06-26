/**
 * ts-node generateIndex.tool.ts ./source ./target

 */
import * as fs from 'fs';
import * as path from 'path';


export function generateIndex(sourceDirectory:string, targetDir:string){
    
    const files = fs.readdirSync(sourceDirectory).filter(file => file.endsWith('.ts') && file !== 'index.ts');
    const exportStatements = files.map(file => `export * from './${file.replace('.ts', '')}';`).join('\n');
    const indexFilePath = path.join(targetDir, 'index.ts');
    const indexDefFilePath = path.join(targetDir, 'index.d.ts');

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    // Write to index.ts
    fs.writeFileSync(indexFilePath, exportStatements);
    
    // Write to index.d.ts
    //fs.writeFileSync(indexDefFilePath, exportStatements);
    
    console.log('index.ts have been generated');
}


