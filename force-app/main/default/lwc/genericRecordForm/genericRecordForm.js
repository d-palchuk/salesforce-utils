import { LightningElement, api } from 'lwc';

export default class GenericRecordForm extends LightningElement {
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

    get fields() {
        return this.fieldApiNames ? this.fieldApiNames.replaceAll(' ', '').split(',') : [];
    }
}
