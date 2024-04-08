import { api } from 'lwc';
import LightningModal from 'lightning/modal';

import { MODE } from './constants.js';

import templateForm from './templateForm.html';
import templateModal from './templateModal.html';

export default class GenericRecordForm extends LightningModal {
    @api recordId;
    @api objectApiName;
    @api recordTypeId;
    @api fieldApiNames;
    @api layoutType;
    @api columns = 2;
    @api density = 'auto';
    @api title;
    @api iconName;
    @api mode = 'view';

    @api viewMode = MODE.FORM;
    @api modalHeaderLabel = 'Edit';

    isLoaded = false;
    isLoading = false;

    // LIFECYCLE CALLBACKS
    render() {
        return this.viewMode === MODE.FORM ? templateForm : this.viewMode === MODE.MODAL ? templateModal : templateForm;
    }

    renderedCallback() {
        if (this.viewMode === MODE.MODAL && this.refs.modalForm && !this.isLoaded) {
            this.overrideFormFooterStyles();
            this.isLoaded = true;
        }
    }

    get fields() {
        return this.fieldApiNames ? this.fieldApiNames.replaceAll(' ', '').split(',') : [];
    }

    handleModalFormCancel() {
        this.close();
    }
    handleModalFormSave() {
        this.isLoading = true;
        Promise.resolve().then(() => {
            this.refs.modalForm.submit();
            this.isLoading = false;
        });
    }

    handleModalFormSuccess() {
        this.close();
    }

    overrideFormFooterStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .slds-form div.slds-align_absolute-center,
            .slds-form lightning-button {
                display: none;
            }
            .slds-modal__content {
                overscroll-behavior: contain;
            }
        `;

        this.refs.modalForm.appendChild(style);
    }
}
