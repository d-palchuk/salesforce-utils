import { LightningElement, api } from 'lwc';
import { LABELS } from './labels.js';

export default class GenericRecordActionConfirm extends LightningElement {
    labels = LABELS;

    @api title;
    @api labelCancel = LABELS.cancel;
    @api labelConfirm = LABELS.confirm;
    @api isLoading = false;

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleConfirm() {
        this.dispatchEvent(new CustomEvent('confirm'));
    }
}