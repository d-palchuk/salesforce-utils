const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = 'force-app/main/default';

const listFilesDirs = async (dir = DEFAULT_PATH, isRecursive = true,  printFiles = true, printFolders = false) => {
    fs.readdir(dir, (err, files) => {
        if (err) throw err;

        const filteredFiles = files.filter(fileName => !fileName.includes('-meta.xml') && !fileName.toLowerCase().includes('dlt'));

        filteredFiles.forEach(fileOrDir => {
            var fileOrDirPath = path.join(dir, fileOrDir);

            fs.stat(fileOrDirPath, (err, stats) => {
                if (err) throw err;

                if (stats.isDirectory()) {
                    if (printFolders) { console.log(fileOrDir); }
                    if (isRecursive) { listFilesDirs(fileOrDirPath, isRecursive, printFiles, printFolders); }
                } else {
                    if (printFiles) { console.log(fileOrDir); }
                }
            });
        });
    });
};

const isRecursive = true;
const printFiles = false;
const printFolders = true;

listFilesDirs('force-app/main/default/', isRecursive, printFiles, printFolders);