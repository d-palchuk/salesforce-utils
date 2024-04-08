import { LightningElement } from 'lwc';

export default class RecordFormFooter extends LightningElement {
    static renderMode = "light";

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }
    handleSave() {
        this.dispatchEvent(new CustomEvent('save'));
    }
}