import { exec } from 'child_process';

function executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.warn(`Error executing command: ${command}`);
                //console.warn(error.message);
                return resolve();
            }
            resolve();
        });
    });
}

export async function killProcessesOnPort(port: string) {
    //try {
        // Find processes using the port and kill them
        await executeCommand(`fuser -k ${port}/tcp`);

        // Double check using lsof and kill them
        await executeCommand(`lsof -t -i:${port} | xargs kill -9`);

        // Final check using netstat and kill them
        await executeCommand(`netstat -ltnp | grep -w :${port} | awk '{print $7}' | sed 's|/.*||' | xargs kill -9`);

        console.log(`All processes on port ${port} have been killed.`);
    // } catch (error) {
    //     console.error(`Failed to kill processes on port ${port}`);
    // }
}


