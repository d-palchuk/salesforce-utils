const fs = require('fs');
const { exec } = require("child_process");

const DEFAULT_ENV = 'qa'
const DEFAULT_PATH = 'force-app/main/default';

const retrieveMetadata = (retrieveCmd) => {
    exec(retrieveCmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
    });
};

const retrieve = async (files = DEFAULT_PATH, env = DEFAULT_ENV, diffBranch, diffPath = DEFAULT_PATH) => {

    let retrieveCmd = '';

    if (!diffBranch) {

        console.log('RETRIEVING WITHOUT DIFF:\r\n');

        retrieveCmd = `sfdx force:source:deploy -p "${files}" -u ${env}`;

        console.log(retrieveCmd);

        retrieveMetadata(retrieveCmd);
    } else {
        console.log('RETRIEVING WITH DIFF:\r\n');

        exec(`git diff --name-only --diff-filter=ACMR ${diffBranch} ${diffPath}`, (error, diff, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }

            diff = `${diff.replaceAll('\n', ',').slice(0, -1)}`;

            console.log('DIFF => ', diff);

            retrieveCmd = `sfdx force:source:retrieve -p "${diff}" -u ${env}`;

            console.log(retrieveCmd);

            retrieveMetadata(retrieveCmd);
        });
    }
};

/* RETRIEVE TEMPLATES */

retrieve(DEFAULT_PATH, DEFAULT_ENV, 'release');

// retrieve(DEFAULT_PATH, 'dev''release');
// retrieve(DEFAULT_PATH, 'qa', 'release');
// retrieve(DEFAULT_PATH, 'uat','uat');