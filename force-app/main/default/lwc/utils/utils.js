import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CONSTANT, TOAST_VARIANT } from 'c/constants';

/**
 * @param {string}  title   - title of the message
 * @param {string}  message - body of the message
 * @param {string}  variant - variant of the message
 */
export function showToastNotification(title, message, variant = TOAST_VARIANT.SUCCESS) {
    dispatchEvent(
        new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        })
    );
}

export function doRequest(action, params, spinnerStatus, showToast = true) {
    if (spinnerStatus) { spinnerStatus.isLoading = true; }

    return new Promise((resolve, reject) => {
        action(params)
            .then(result => {
                resolve(result);
            })
            .catch(errors => {
                logError(errors, showToast);
                reject(errors);
            })
            .finally(() => {
                if (spinnerStatus) { spinnerStatus.isLoading = false; }
            });
    });
}

/**
 * Reduces one or more LDS errors into an array or string of dot separated error messages.
 * @param {FetchResponse|FetchResponse[]} errors single error or errors[]
 * @param {Boolean} convertToString set true if you want to get a string or false if you prefer the array
 * @return {Array} reduced array of error messages
 * @return {String} dot separated error messages
 */
export function reduceErrors(errors, convertToString = true) {
    if (Array.isArray(errors) === false) {
        errors = [errors];
    }

    const reducedErrors = (
        errors
            // Remove null/undefined items
            .filter(error => !!error)
            // Extract an error message
            .map(error => {
                // UI API read errors
                if (Array.isArray(error.body)) {
                    return error.body.map(e => e.message);
                }
                // UI API DML, Apex and network errors
                else if (error.body && typeof error.body.message === 'string') {
                    return error.body.message;
                }
                // JS errors
                else if (typeof error.message === 'string') {
                    return error.message;
                }
                // Unknown error shape so try HTTP status text
                return error.statusText;
            })
            // Flatten
            .flat()
            // Remove empty strings
            .filter(message => !!message)
    );

    return convertToString ? reducedErrors.join('. ') : reducedErrors;
}

export function logError(errors, showToast = true) {
    const message = reduceErrors(errors);

    if (showToast) {
        showToastNotification('', message, TOAST_VARIANT.ERROR);
    }

    console.error(message);
}

// Helper function to wait until the microtask queue is empty. This is needed for promise timing.
export function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve));
}

export function removeSingleQuotes(string = '') {
    return String(string).replace(/\'/g, '');
}

export function removeWhiteSpaces(string = '') {
    return String(string).replace(/\s/g, '');
}

export function stringIsBlank(string) {
    string = removeWhiteSpaces(string);

    return string === '' || string === null
}

// Merge a bunch of arrays into one and remove duplicates
export function getMergedArraysWithoutDuplicates() {
    return [...new Set(
        Array.from(arguments).flat()
    )];
}

// Used to sort the datatable columns
export function getSortedDatatableData(data, fieldName, sortDirection, primer) {
    const clonedData = [...data];
    const reverse = sortDirection === 'asc' ? 1 : -1;

    const key = primer
        ? function(x) {
            return primer(x[fieldName]);
        }
        : function(x) {
            return x[fieldName];
        };

    return clonedData.sort((a, b) => {
        a = key(a);
        b = key(b);

        return reverse * ((a > b) - (b > a));
    });
}

export function getRecordTypeId(objectInfo, recordTypeName) {
    if (!objectInfo || !objectInfo.recordTypeInfos || !recordTypeName) {
        return CONSTANT.MASTER_RECORD_TYPE_ID;
    }

    const recordTypeInfo = Object.values(objectInfo.recordTypeInfos).find(recordTypeInfo => {
        return recordTypeInfo.name === recordTypeName;
    })

    return recordTypeInfo ? recordTypeInfo.recordTypeId : CONSTANT.MASTER_RECORD_TYPE_ID;
}

export function getFieldLabel(objectInfo, field) {
    if (!objectInfo || !field || !objectInfo.fields[field.fieldApiName]) {
        return;
    }

    return objectInfo.fields[field.fieldApiName].label;
}

export function getFieldHelpText(objectInfo, field) {
    if (!objectInfo || !field || !objectInfo.fields[field.fieldApiName]) {
        return;
    }

    return objectInfo.fields[field.fieldApiName].inlineHelpText;
}

export function getValueFromRecordInput(recordInput, field) {
    if (!recordInput || !field || !recordInput.fields || !field.fieldApiName) {
        return;
    }

    return recordInput.fields[field.fieldApiName];
}

export function getDependentPicklistValues(dependentPicklistValues, controllerPicklistValue) {
    if (!dependentPicklistValues || !dependentPicklistValues.values || !dependentPicklistValues.values.length || !controllerPicklistValue) {
        return [];
    }

    return dependentPicklistValues.values.filter(item => {
        return item.validFor.includes(
            dependentPicklistValues.controllerValues[controllerPicklistValue]
        );
    });
}

export function setRecordInputValue(recordInput, field, value) {
    if (!recordInput || !field || !recordInput.fields || !field.fieldApiName) {
        return;
    }

    recordInput.fields[field.fieldApiName] = value;
}

export const getUrlParam = (keyString) => {
    let param = '';
    let parts = window.location.href.replace(
        /[?&]+([^?=&]+)=([^&?]*)/gi,
        (m, key, value) => { if (key === keyString) param = value; }
    );

    return encodeURIComponent(param);
}

/**
 * Encode the HTML in a user-submitted string
 * https://portswigger.net/web-security/cross-site-scripting/preventing
 * @param  {String} str  The user-submitted string
 * @return {String} str  The sanitized string
 */
 export function encodeHTML (str) {
	return str && str.replace(/data:/gi, '').replace(/javascript:/gi, '').replace(/[^\w-_•.,!@#$%&*()[]<>`˜§± ]/gi, function (c) {
		return `&#${c.charCodeAt(0)};`;
	});
}

export function isArrayValid(array) {
    return !!array && Array.isArray(array) && array.length > 0;
}


let timer;
/**
 * A debounce function makes sure that your code is only triggered once per user input
 *
 * Example of usage:
 * debounce(() => this.makeSearch(searchTerm))
 *
 * @param {Function} func - function you want to invoke
 * @param {Number} timeout - the default value is 512
 */

export function debounce(func, timeout = 512) {
    clearTimeout(timer);

    timer = setTimeout(() => func(), timeout);
}

export function getIconByObjectName(objectName) {
    switch(objectName) {
        case 'Account':
            return 'standard:account';
        case 'Partner Account':
            return 'standard:account_info';
        case 'PDX Account':
            return 'standard:account_info';
        case 'Contact':
            return 'standard:contact';
        default:
            return 'custom:custom55';
    }
}


export function getIconByDocType(docType){
    switch(docType){
        case 'csv':
            return 'doctype:csv';
        case 'pdf':
            return 'doctype:pdf';
        case 'pps':
        case 'ppt':
        case 'pptx':
            return 'doctype:ppt';
        case 'xls':
        case 'xlsx':
            return 'doctype:excel';
        case 'doc':
        case 'docx':
            return 'doctype:word';
        case 'txt':
            return 'doctype:txt';
        case 'png':
        case 'jpeg':
        case 'jpg':
        case 'gif':
            return 'doctype:image';
        default:
            return 'doctype:unknown';
    }
}