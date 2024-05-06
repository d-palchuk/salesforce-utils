import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { logError, getRecordTypeInfos } from 'c/utils';

export default class GenericRecordRelatedListTabs extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relatedObjectApiName;
    @api relatedListApiName;
    @api parentFieldApiName;
    @api relatedRecordNewDefaultValues = {};
    @api iconName;
    @api hideCount;
    @api hideNewAction;
    @api hideEditAction;
    @api hideDeleteAction;
    @api hideDocumentsAction;
    @api titleCallback;

    tabs;
    recordTypeInfos;

    @wire(getObjectInfo, { objectApiName: '$relatedObjectApiName' })
    getRelatedObjectInfo({ error, data }) {
        if (data) {
            this.recordTypeInfos = getRecordTypeInfos(data);
            this.initTabs();
        }
        if (error) {
            logError(error);
        }
    }

    initTabs() {
        const tabs = this.recordTypeInfos.map((recordType) => {
            return {
                relatedObjectApiName: this.relatedObjectApiName,
                relatedListApiName: this.relatedListApiName,
                relatedListFilters: `{ RecordTypeId: { eq: "${recordType.id}" }}`,
                parentFieldApiName: this.parentFieldApiName,
                recordTypeId: recordType.id,
                relatedRecordNewDefaultValues: this.relatedRecordNewDefaultValues,
                tabId: recordType.id,
                label: recordType.name,
                iconName: this.iconName
            };
        });

        tabs.sort((a, b) => a.label.localeCompare(b.label));

        this.tabs = tabs;
    }
}
