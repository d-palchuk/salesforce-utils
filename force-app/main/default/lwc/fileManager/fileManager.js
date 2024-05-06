import LightningModal from 'lightning/modal';
import LightningConfirm from 'lightning/confirm';
import { api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';
import { updateRecord, deleteRecord, notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import { doRequest, getIconByDocType, logError, showToastNotification, isExperienceCloudCtx } from 'c/utils';

import { TOAST_VARIANT } from 'c/constants';
import { LABELS } from './labels.js';
import { MODE, ACCEPTED_FORMATS, DOWNLOAD_PATH, VIEW_PATH } from './constants.js';

import templateAction from './templateAction.html';
import templateModal from './templateModal.html';
import fileManagerCss from './fileManager.css';

import getContentDetails from '@salesforce/apex/FileManagerController.getContentDetails';

import ID_FIELD from '@salesforce/schema/ContentVersion.Id';
import TITLE_FIELD from '@salesforce/schema/ContentVersion.Title';

export default class FileManager extends NavigationMixin(LightningModal) {
    static stylesheets = [fileManagerCss];

    labels = LABELS;

    @api recordId;
    @api mode = MODE.ACTION;
    @api hideCloseButton = false;

    @track files;
    @track spinnerStatus = {
        isLoading: false
    };

    acceptedFormats = ACCEPTED_FORMATS;
    isInitialFileLoad = false;
    isExperienceCloudCtx = false;

    // LIFECYCLE HOOKS
    render() {
        return this.mode === MODE.ACTION ? templateAction : this.mode === MODE.MODAL ? templateModal : templateAction;
    }

    renderedCallback() {
        if (!this.isInitialFileLoad && this.recordId) {
            this.init();
            this.overrideCommunityStyles();

            this.isInitialFileLoad = true;
        }
    }

    // ACTIONS
    async init() {
        let result = await doRequest(getContentDetails, { recordId: this.recordId }, this.spinnerStatus);
        let baseUrl = 'https://' + window.location.host + '/';

        this.files = result.map((file) => {
            return {
                ...file,
                downloadUrl: baseUrl + DOWNLOAD_PATH + file.ContentDocumentId,
                fileUrl: baseUrl + VIEW_PATH + file.Id,
                createdBy: file.ContentDocument.CreatedBy.Name,
                createdDate: file.ContentDocument.CreatedDate.slice(0, 10),
                icon: getIconByDocType(file.FileExtension)
            };
        });
    }

    async deleteFile(fileId) {
        const result = await LightningConfirm.open({
            message: LABELS.confirmDelete,
            variant: 'headerless'
        });

        if (!result) {
            return;
        }

        this.spinnerStatus.isLoading = true;

        try {
            await deleteRecord(fileId);
            this.init();
        } catch (error) {
            showToastNotification(LABELS.deleteError, '', TOAST_VARIANT.ERROR);
        } finally {
            this.spinnerStatus.isLoading = false;
        }
    }

    async renameFile(file, name) {
        this.spinnerStatus.isLoading = true;

        const fields = {};
        fields[ID_FIELD.fieldApiName] = file.Id;
        fields[TITLE_FIELD.fieldApiName] = name;

        const recordInput = { fields };

        try {
            await updateRecord(recordInput);
            this.init();
        } catch (error) {
            logError(error);
        } finally {
            this.spinnerStatus.isLoading = false;
        }
    }

    // HANDLERS
    handlePreviewFile(event) {
        let file = this.files.find((a) => a.Id === event.detail);

        if (!this.isExperienceCloudCtx) {
            this[NavigationMixin.Navigate]({
                type: 'standard__namedPage',
                attributes: {
                    pageName: 'filePreview'
                },
                state: {
                    selectedRecordId: file.ContentDocumentId
                }
            });
        } else if (this.isExperienceCloudCtx) {
            this[NavigationMixin.Navigate](
                {
                    type: 'standard__webPage',
                    attributes: {
                        url: file.fileUrl
                    }
                },
                false
            );
        }
    }

    handleDeleteFile(event) {
        let file = this.files.find((a) => a.Id === event.detail);
        this.deleteFile(file.ContentDocumentId);
    }

    handleDownloadFile(event) {
        let file = this.files.find((a) => a.Id === event.detail);

        this[NavigationMixin.Navigate](
            {
                type: 'standard__webPage',
                attributes: {
                    url: file.downloadUrl
                }
            },
            false
        );
    }

    handleRenameFile(event) {
        let file = this.files.find((a) => a.Id === event.detail.id);
        this.renameFile(file, event.detail.name);
    }

    handleUploadFinished() {
        this.init();
        notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
    }

    handleCancel() {
        if (this.mode === MODE.ACTION) {
            this.dispatchEvent(new CloseActionScreenEvent());
        } else if (this.mode === MODE.MODAL) {
            this.close();
        }
    }

    handleDataReload() {
        this.init();
    }

    // HELPERS
    async overrideCommunityStyles() {
        this.isExperienceCloudCtx = await isExperienceCloudCtx();

        if (this.isExperienceCloudCtx) {
            const style = document.createElement('style');
            style.textContent = `.slds-modal__container{
                width: 70% !important;
                max-width: 100% !important;
                min-width: 480px;
                max-height: 100%;
                min-height: 480px;
                margin: 0px auto !important;
            }`;

            this.refs.card.appendChild(style);
        }
    }
}