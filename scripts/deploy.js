const fs = require('fs');
const { exec } = require("child_process");

const DEFAULT_ENV = 'qa'
const DEFAULT_PATH = 'force-app/main/default';
const DEFAULT_TESTS_FOLDER = 'force-app/main/default/classes/tests/';

const generateTests = (testFolder = DEFAULT_TESTS_FOLDER) => {
    console.log('GENERATING TESTS:\r\n')

    const tests = fs.readdirSync(testFolder)
        .filter(fileName => !fileName.includes('cls-meta') && fileName.toLowerCase().includes('test'))
        .join(',')
        .replaceAll('.cls', '');

    console.log(tests , '\r\n');

    return tests;
};

const deployMetadata = (deployCmd) => {
    exec(deployCmd, (error, stdout, stderr) => {
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

const deploy = async (files = DEFAULT_PATH, env = DEFAULT_ENV, isCheckDeploy = true, tests, diffBranch) => {

    let deployCmd = '';

    if (!diffBranch) {

        console.log(isCheckDeploy ? 'VALIDATING WITHOUT DIFF:\r\n' : 'DEPLOYING WITHOUT DIFF:\r\n')

        deployCmd = `sfdx force:source:deploy -p "${files}" ${tests ? `--testlevel RunSpecifiedTests --runtests "${tests}"` : ''} ${isCheckDeploy ? '-c' : ''} -u ${env}`;

        console.log(deployCmd);

        deployMetadata(deployCmd);
    } else {
        console.log('GENERATING DIFF:\r\n')

        exec(`git diff --name-only --diff-filter=ACMR ${diffBranch} ${files}`, (error, diff, stderr) => {
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

            console.log(isCheckDeploy ? 'VALIDATING DIFF:\r\n' : 'DEPLOYING DIFF:\r\n')

            deployCmd = `sfdx force:source:deploy -p "${diff}" ${tests ? `--testlevel RunSpecifiedTests --runtests "${tests}"` : ''} ${isCheckDeploy ? '-c' : ''} -u ${env}`;

            console.log(deployCmd);

            deployMetadata(deployCmd);
        });
    }
};

/* DEPLOY TEMPLATES */

deploy(DEFAULT_PATH, DEFAULT_ENV, true, generateTests(), undefined, undefined);

// deploy('force-app/main/default/classes,force-app/main/default/triggers', DEFAULT_ENV, false);
// deploy('force-app/main/default/classes,force-app/main/default/triggers', DEFAULT_ENV, false, generateTests());

// deploy(DEFAULT_PATH, 'uat', true, generateTests());
// deploy(DEFAULT_PATH, 'uat', false, undefined, 'release');

/* DIFF DEPLOY QUEUE */

// deploy(DEFAULT_PATH, 'dev', false, undefined, 'release');
// deploy(DEFAULT_PATH, 'qa', false, undefined, 'release');
// deploy(DEFAULT_PATH, 'uat', false, undefined, 'release');
