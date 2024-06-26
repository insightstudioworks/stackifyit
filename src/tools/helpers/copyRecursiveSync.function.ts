const fs = require("fs")
const path = require("path")

/**
 * @param {string} src  source directory path.
 * @param {string} dest target directory path.
 */
export const  copyRecursiveSync = function(src: any, dest: any) {
  var srcExists = fs.existsSync(src);
  
  var srcStats = srcExists && fs.statSync(src);
  var isDirectory = srcExists && srcStats.isDirectory();
  let destinationDirectoryOnly = path.dirname(dest);
   if (!fs.existsSync(destinationDirectoryOnly)){
    fs.mkdirSync(destinationDirectoryOnly, { recursive: true });
  }
  if (isDirectory) {
    // if (!fs.existsSync(dest)){
    //     fs.mkdirSync(dest);
    // }
    fs.readdirSync(src).forEach(function(childItemName: any) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};