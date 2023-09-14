const fs = require('fs');
const { exec } = require("child_process");

const DEFAULT_ENV = 'zhopa-qa'
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

const deploy = async (files = DEFAULT_PATH, env = DEFAULT_ENV, isCheckDeploy = true, tests, diffBranch, diffPath = DEFAULT_PATH) => {

    let deployCmd = '';

    if (!diffBranch) {

        console.log(isCheckDeploy ? 'VALIDATING WITHOUT DIFF:\r\n' : 'DEPLOYING WITHOUT DIFF:\r\n')

        deployCmd = `sfdx force:source:deploy -p "${files}" ${tests ? `--testlevel RunSpecifiedTests --runtests "${tests}"` : ''} ${isCheckDeploy ? '-c' : ''} -u ${env}`;

        console.log(deployCmd);

        deployMetadata(deployCmd);
    } else {
        console.log('GENERATING DIFF:\r\n')

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

            console.log(isCheckDeploy ? 'VALIDATING DIFF:\r\n' : 'DEPLOYING DIFF:\r\n')

            deployCmd = `sfdx force:source:deploy -p "${diff}" ${tests ? `--testlevel RunSpecifiedTests --runtests "${tests}"` : ''} ${isCheckDeploy ? '-c' : ''} -u ${env}`;

            console.log(deployCmd);

            deployMetadata(deployCmd);
        });
    }
};

deploy(DEFAULT_PATH, DEFAULT_ENV, true, generateTests(), undefined, undefined);