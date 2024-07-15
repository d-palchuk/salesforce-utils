import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { logError, getRecordTypeInfos, getDependentPicklistValues, isArrayValid } from 'c/utils';
import { CONSTANT } from 'c/constants';
import { LABELS } from './labels.js';

export default class GenericRecordRelatedListTabs extends LightningElement {
    // BUILDER PROPERTIES
    @api recordId;
    @api objectApiName;
    @api relatedObjectApiName;
    @api relatedListApiName;
    @api parentFieldApiName;
    @api controllerPicklistApiName;
    @api dependentPicklistApiName;
    @api iconName;
    @api labelConfirmDelete = LABELS.confirmDelete;
    @api hideNewAction = false;
    @api hideEditAction = false;
    @api hideDeleteAction = false;
    @api hideDocumentsAction = false;

    // TECH PROPERTIES
    @api additionalRowActions = [];
    @api relatedRecordNewDefaultValues = {};
    @api relatedListCustomColumnsMap = {};
    @api titleCallback;
    @api hideCount;

    // STATE
    tabs;
    picklistTabs;
    controllerPicklistField;
    dependentPicklistField;

    // WIRES
    @wire(getObjectInfo, { objectApiName: '$relatedObjectApiName' })
    getRelatedObjectInfo({ error, data }) {
        if (data) {
            this.initTabs(getRecordTypeInfos(data));
        }
        if (error) {
            logError(error);
        }
    }
    @wire(getPicklistValues, {
        recordTypeId: CONSTANT.MASTER_RECORD_TYPE_ID,
        fieldApiName: '$controllerPicklistField'
    })
    getControllerPicklistData({ error, data }) {
        if (data) {
            this.initPicklistTabs(data);
        }
        if (error) {
            logError(error);
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: CONSTANT.MASTER_RECORD_TYPE_ID,
        fieldApiName: '$dependentPicklistField'
    })
    getDependentPicklistData({ error, data }) {
        if (data) {
            this.initDependentPicklistTabs(data);
        }
        if (error) {
            logError(error);
        }
    }

    // LIFECYCLE HOOKS
    connectedCallback() {
        this.initPicklistFields();
    }

    // HELPERS
    initPicklistFields() {
        if (this.controllerPicklistApiName) {
            this.controllerPicklistField = {
                objectApiName: this.relatedObjectApiName,
                fieldApiName: this.controllerPicklistApiName
            };
        }
    }

    initTabs(recordTypeInfos) {
        if (!isArrayValid(recordTypeInfos)) {
            return;
        }

        const tabs = recordTypeInfos.map((recordType) => {
            return {
                relatedObjectApiName: this.relatedObjectApiName,
                relatedListApiName: this.relatedListApiName,
                relatedListFilters: `{ RecordTypeId: { eq: '${recordType.id}' }}`,
                relatedListFieldApiNames: this.relatedListCustomColumnsMap[recordType.id],
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

    initPicklistTabs(controllerPicklistData) {
        if (!controllerPicklistData || !controllerPicklistData.values || !controllerPicklistData.values.length) {
            return;
        }

        const tabs = controllerPicklistData.values.map((controllerValue) => {
            return {
                relatedObjectApiName: this.relatedObjectApiName,
                relatedListApiName: this.relatedListApiName,
                relatedListFilters: `{ ${this.controllerPicklistApiName}: { eq: '${controllerValue.value}' } }`,
                relatedListFieldApiNames: this.relatedListCustomColumnsMap[controllerValue.value],
                parentFieldApiName: this.parentFieldApiName,
                relatedRecordNewDefaultValues: {
                    ...this.relatedRecordNewDefaultValues,
                    ...{ [this.controllerPicklistApiName]: controllerValue.value }
                },
                tabId: controllerValue.value,
                value: controllerValue.value,
                label: controllerValue.label,
                iconName: this.iconName
            };
        });

        this.picklistTabs = tabs;

        if (this.dependentPicklistApiName) {
            this.dependentPicklistField = {
                objectApiName: this.relatedObjectApiName,
                fieldApiName: this.dependentPicklistApiName
            };
        }
    }

    initDependentPicklistTabs(dependentPicklistData) {
        if (!isArrayValid(this.picklistTabs)) {
            return;
        }

        const tabs = this.picklistTabs.map((controllerTab) => {
            return {
                ...controllerTab,
                tabs: getDependentPicklistValues(dependentPicklistData, controllerTab.value).map((dependentValue) => {
                    return {
                        relatedObjectApiName: this.relatedObjectApiName,
                        relatedListApiName: this.relatedListApiName,
                        relatedListFilters: `{ and: [
                            { ${this.controllerPicklistApiName}: { eq: '${controllerTab.value}' } },
                            { ${this.dependentPicklistApiName}: { eq: '${dependentValue.value}' } }
                        ] }`,
                        relatedListFieldApiNames: this.relatedListCustomColumnsMap[controllerTab.value + dependentValue.value],
                        parentFieldApiName: this.parentFieldApiName,
                        relatedRecordNewDefaultValues: {
                            ...this.relatedRecordNewDefaultValues,
                            ...{
                                [this.controllerPicklistApiName]: controllerTab.value,
                                [this.dependentPicklistApiName]: dependentValue.value
                            }
                        },
                        tabId: dependentValue.value,
                        value: dependentValue.value,
                        label: dependentValue.label,
                        iconName: this.iconName
                    };
                })
            };
        });

        this.picklistTabs = tabs;
    }
}
