import { LightningElement, api, track } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';
// import { doRequest, logError, getIconByDocType } from 'c/utils'

import getExistingFiles from '@salesforce/apex/FileUploaderCtrl.getExistingFiles';

export default class FileUploaderZhopa extends LightningElement {
    @api recordId;
    @api label = '';
    @api allowMultiple = false;
    @api required = false;
    @api requiredMessage = 'Upload at least one file.';

    @api
    get acceptedFormats() {
        return this._acceptedFormats;
    }
    set acceptedFormats(value = '') {
        this._acceptedFormats = String(value).split(',');
    }
    @api
    get disabled() {
        return this._disabled || !this.recordId;
    }
    set disabled(value = false) {
        this._disabled = !!value;
    }

    @api
    validate() {
        if (this.required && !this.files.length) {
            return {
                isValid: false,
                errorMessage: this.requiredMessage
             };
        } else {
            return { isValid: true };
        }
    }

    @track spinnerStatus = {
        isLoading: false
    };

    files = [];

    connectedCallback() {
        this.getExistingFiles();
    }

    // HANDLERS
    handleUploadFinished(evt) {
        this.getExistingFiles();
    }

    handleDeleteFile(evt) {
        if (this.disabled) {
            return;
        }

        this.deleteFile(evt.target.dataset.fileId);
    }

    // SERVER CALLS
    async getExistingFiles() {
        this.files = (await doRequest(getExistingFiles, {recordId: this.recordId}, this.spinnerStatus)).map(file => {
            file.icon = getIconByDocType(file.extension);

            return file;
        });
    }

    async deleteFile(fileId) {
        if (!fileId) {
            return;
        }

        this.showSpinner();

        try {
            await deleteRecord(fileId)
        } catch(error) {
            logError(error)
        }

        this.getExistingFiles();
    }

    // HELPERS
    showSpinner() {
        this.spinnerStatus.isLoading = true;
    }

    hideSpinner() {
        this.spinnerStatus.isLoading = false;
    }
}