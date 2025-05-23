// helper for https://sfswitch.herokuapp.com
// provide objectName
// provide automation names/apinames
// enable one of the modes validations/workflows/flows

const objectName = 'Case';

const targetNames = [
'Post_Call_Survey_Automation',
'Case_After_Save_CC_Follow_up_Date',
'Ster_Case_After_Save_Customer_Care_Support_Case',
'Case_After_Save_Quality_Assurance_Grading',
'Case_Before_Update_CC_Case_Ownership_Validation',
'Case_Case_Status_Update_for_Non_SOR_Process',
'Case_Copy_After_Save_Customer_Care_Support_Case',
'Case_Customer_Care_Support_Case_Milestones',
'CRD_Case_Management_Routing',
'CRD_Case_Date_and_Metrics_Update',
'Shared_Ops_Request_Field_Updates',
'Update_Case_Origin_for_Reporting_RT_Flow',
];

const isValidations = false;
const isWorkflows = false;
const isFlows = true;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function toggle() {
    let tab;
    let container;
    let targetContainer = document;


    if (isValidations) {
        tab = document.querySelector("a[href='#valrules']");
        container = document.querySelector('#valrules');

        tab.scrollIntoView({ behavior: 'instant', block: 'center' });
        await delay(512);

        tab.click();
        await delay(512);

    } else if (isWorkflows) {
        tab = document.querySelector("a[href='#workflows']");
        container = document.querySelector('#workflows');

        tab.scrollIntoView({ behavior: 'instant', block: 'center' });
        await delay(512);

        tab.click();
        await delay(512);
    } else if (isFlows) {
        tab = document.querySelector("a[href='#flows']");
        container = document.querySelector('#flows');

        tab.scrollIntoView({ behavior: 'instant', block: 'center' });
        await delay(512);

        tab.click();
        await delay(512);
    }

    if (!isFlows) {
        const tables = container.querySelectorAll('table');

        tables.forEach(table => {
            table.querySelectorAll('th').forEach(th => {
                const text = th.textContent.trim();
                if (text === objectName) {
                    targetContainer = table;
                    return;
                }
            });

            if (targetContainer) { return ; }
        });

        if (targetContainer) {
            console.log(`✅ ${objectName} table has been found.`, );
        } else {
            console.warn(`❌ ${objectName} table has not been found.`);
        }

        if (!targetContainer) { return ; }

        targetContainer.scrollIntoView({ behavior: 'instant', block: 'start' });
        await delay(1024);
    }

    const rows = targetContainer.querySelectorAll('tr');

    rows.forEach((row) => {
        const text = row.textContent.trim();
        const matchedName = targetNames.find(name => text.includes(name));

        if (matchedName) {
            const parentRow = row.closest('tr');

            if (parentRow) {
                const switchElement = parentRow.querySelector('input.new_value');

                if (switchElement) {
                    if (isFlows) {
                        parentRow.scrollIntoView({ behavior: 'instant', block: 'center' });
                    }

                    console.log(`✅ switched: "${matchedName}"`);

                    switchElement.click();
                } else {
                    console.warn(`⚠️ switch not found for: "${matchedName}"`);
                }

            } else {
                console.warn(`⚠️ Parent <tr> not found for: "${matchedName}"`);
            }
        }
    });
}

toggle();