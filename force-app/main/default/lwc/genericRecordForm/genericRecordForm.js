import { LightningElement, api } from 'lwc';

export default class GenericRecordForm extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api fieldApiNames;
    @api layoutType;
    @api columns;
    @api density;
    @api title;
    @api iconName;
    @api mode;

    // fields = ['Status', 'OwnerId', 'Debt_Coach__c'];
    get fields() {
        return this.fieldApiNames ? this.fieldApiNames.replaceAll(' ', '').split(',') : [];
    }
}
