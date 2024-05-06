import { LightningElement } from 'lwc';

export default class RecordFormFooter extends LightningElement {
    static renderMode = 'light';

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleSubmit() {
        this.dispatchEvent(new CustomEvent('submit'));
    }
}