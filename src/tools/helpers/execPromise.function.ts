const { exec } = require('child_process');


export function execPromise(command: string,options: {
  cwd?: string; 
  isNonError?: boolean;
  isLog?: boolean;
}  = {}): Promise<string> {
  return new Promise((res, err) => {
    if(options.isLog) console.log('execPromise COMMAND:', command)
    exec(command, { cwd: options.cwd }, (error: { message: any; }, stdout: any, stderr: any) => {
      if(options.isLog) console.log(stdout)
      if (error) {
        if(options.isLog) console.warn(error.message);
        
        if(options.isNonError){
          res(error.message);
          return;
        }
        err(error.message);
        return;
      }
      if (stderr) {
        if(options.isLog) console.warn(stderr);
        if(options.isNonError){
          res(stderr);
          return;
        }
        err(stderr);
        return;
      }
      
      res(stdout);
    });
  });
}
