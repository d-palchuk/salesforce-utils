/* eslint-disable @lwc/lwc/no-api-reassignments */
import LightningConfirm from 'lightning/confirm';
import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRecord, updateRecord, deleteRecord, notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import { getRelatedListInfo, getRelatedListRecords } from 'lightning/uiRelatedListApi';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

import FileManager from 'c/fileManager';
import { showToastNotification, logError, getSortedDatatableData } from 'c/utils';
import { LABELS } from './labels.js';
import { CONSTANTS, DATATABLE_COL_TYPES } from './constants.js';

const VIEW_ACTION = { label: LABELS.view, name: 'view' };
const EDIT_ACTION = { label: LABELS.edit, name: 'edit' };
const DELETE_ACTION = { label: LABELS.deleteLabel, name: 'delete' };
const DOCUMENTS_ACTION = { label: LABELS.addDocuments, name: 'add_documents' };

export default class GenericRecordRelatedList extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api relatedObjectApiName;
    @api relatedListApiName;
    @api relatedListFilters;
    @api recordTypeId;
    @api parentFieldApiName;
    @api relatedRecordNewDefaultValues = {};
    @api title;
    @api titleCallback;
    @api iconName;
    @api iconSize = 'small';
    @api hideHeader = false;
    @api showCheckboxColumn = false;
    @api showViewAction = false;
    @api hideDocumentsAction = false;
    @api hideCount = false;
    @api preventDefaultEdit = false;
    @api preventDefaultDelete = false;
    @api preventDefaultAddDocuments = false;

    // ui api
    count = 0;
    fieldApiNames;
    parentRecordTypeId;
    relatedObjectInfo = {};
    fieldApiNameToColumn = {};

    // datatable
    @track actions = [];
    records = [];
    columns = [];
    draftValues = [];
    sortedBy;
    sortDirection = 'asc';
    isLoading = false;

    @api
    get hideNewAction() {
        return this._hideNewAction || !this.relatedObjectInfo.createable;
    }
    set hideNewAction(value) {
        this._hideNewAction = value;
    }
    @api
    get hideEditAction() {
        return this._hideEditAction || !this.relatedObjectInfo.updateable;
    }
    set hideEditAction(value) {
        this._hideEditAction = value;
    }
    @api
    get hideDeleteAction() {
        return this._hideDeleteAction || !this.relatedObjectInfo.deletable;
    }
    set hideDeleteAction(value) {
        this._hideDeleteAction = value;
    }

    @track _relatedListFieldApiNames;
    @api
    get relatedListFieldApiNames() {
        return this._relatedListFieldApiNames;
    }
    set relatedListFieldApiNames(value) {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { // necessary since relatedObjectInfo is not available immediately
            if (value && this.relatedObjectInfo && this.relatedObjectInfo.fields) {
                const relatedListFieldApiNames =
                    value &&
                    value
                        .replaceAll(' ', '')
                        .split(',')
                        .filter((fieldApiName) => this.relatedObjectInfo.fields[fieldApiName])
                        .map((fieldApiName) => `${this.relatedObjectApiName}.${fieldApiName}`);

                this._relatedListFieldApiNames =
                    Array.isArray(relatedListFieldApiNames) && relatedListFieldApiNames.length > 0
                        ? relatedListFieldApiNames
                        : undefined;
            }
        }, 128);
    }

    _relatedListFields = [];
    get relatedListFields() {
        if (
            this.fieldApiNames &&
            (!this._relatedListFields ||
                this._relatedListFields.length === 0 ||
                this._relatedListFields.length !== this.fieldApiNames.length
            )
        ) {
            this._relatedListFields = this.fieldApiNames.map(
                (fieldApiName) => `${this.relatedObjectApiName}.${fieldApiName}`
            );
        }

        return this._relatedListFields;
    }

    get restrictColumnsToLayout() {
        return !this.relatedListFieldApiNames;
    }

    get hideCheckboxColumn() {
        return !this.showCheckboxColumn;
    }

    // WIRES
    @wire(getObjectInfo, { objectApiName: '$objectApiName' })
    getParentObjectInfo({ error, data }) {
        if (data) {
            if (!this.parentRecordTypeId) {
                this.parentRecordTypeId = data.defaultRecordTypeId;
            }
        } else if (error) {
            logError(error, false);
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: ['RecordTypeId'] })
    getParentRecordInfo({ error, data }) {
        if (data) {
            this.parentRecordTypeId = data.recordTypeId;
        } else if (error) {
            logError(error, false);
        }
    }

    @wire(getObjectInfo, { objectApiName: '$relatedObjectApiName' })
    getRelatedObjectInfo({ error, data }) {
        this.isLoading = true;

        if (data) {
            this.relatedObjectInfo = data;
            this.defineActions();
        } else if (error) {
            logError(error, false);
        }
    }

    @wire(getRelatedListInfo, {
        parentObjectApiName: '$objectApiName',
        relatedListId: '$relatedListApiName',
        recordTypeId: '$parentRecordTypeId',
        optionalFields: '$relatedListFieldApiNames',
        restrictColumnsToLayout: '$restrictColumnsToLayout'
    })
    getRelatedListInfo({ error, data }) {
        this.isLoading = true;

        if (data) {
            this.parseColumnsData(data.displayColumns);

            this.title = this.originalTitle = !this.title ? data.label : this.title;
        } else if (error) {
            logError(error, false);
            this.columns = [];
        }
    }

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: '$relatedListApiName',
        fields: '$relatedListFields',
        where: '$relatedListFilters',
        pageSize: 200
    })
    getRelatedListRecords({ error, data }) {
        this.isLoading = true;

        if (data) {
            this.parseRecordsData(data.records);
            this.defineActions();
            this.defineTitle();
        } else if (error) {
            logError(error, false);
            this.records = [];
        }

        this.isLoading = false;
    }

    // EVT HANDLERS
    handleNew() {
        let defaultValues = (this.relatedRecordNewDefaultValues && { ...this.relatedRecordNewDefaultValues }) || {};

        if (this.parentFieldApiName) {
            defaultValues[this.parentFieldApiName] = this.recordId;
        }

        defaultValues = encodeDefaultFieldValues(defaultValues);

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: this.relatedObjectApiName,
                actionName: 'new'
            },
            state: {
                nooverride: 1,
                useRecordTypeCheck: this.recordTypeId ? 0 : 1,
                defaultFieldValues: defaultValues || 'inheritParentString',
                navigationLocation: 'RELATED_LIST',
                recordTypeId: this.recordTypeId
            }
        });
    }

    handleMassEdit() {
        this.refs.datatable.openInlineEdit();
    }

    handleMassSave(evt) {
        this.updateRelatedRecords(evt.detail.draftValues);
    }

    handleRefresh() {
        this.refreshRecords();
    }

    handleSort(evt) {
        this.isLoading = true;

        const { fieldName, sortDirection } = evt.detail;

        this.sortedBy = fieldName;
        this.sortDirection = sortDirection;

        this.records = getSortedDatatableData(this.records, fieldName, sortDirection);

        this.isLoading = false;
    }

    handleRowAction(evt) {
        const actionName = evt.detail.action.name;
        const row = evt.detail.row;

        switch (actionName) {
            case 'view':
                this.dispatchEvent(new CustomEvent('view', { detail: row }));
                break;
            case 'edit':
                if (!this.preventDefaultEdit) {
                    this.editRecord(row.Id);
                }

                this.dispatchEvent(new CustomEvent('edit', { detail: row }));
                break;
            case 'delete':
                if (!this.preventDefaultDelete) {
                    this.deleteRecord(row.Id);
                }

                this.dispatchEvent(new CustomEvent('delete', { detail: row }));
                break;
            case 'add_documents':
                if (!this.preventDefaultAddDocuments) {
                    FileManager.open({
                        mode: 'modal',
                        recordId: row.Id
                    });
                }

                this.dispatchEvent(new CustomEvent('adddocuments', { detail: row }));
                break;
            default:
        }
    }

    // INIT HELPERS
    parseColumnsData(displayColumns) {
        this.columns = [];
        this.fieldApiNames = [];

        this.columns = displayColumns.map((col) => {
            const column = {
                ...col,
                ...{
                    label: col.label,
                    fieldName: col.lookupId ? `${col.fieldApiName}${CONSTANTS.URL_FIELD_POSTFIX}` : col.fieldApiName,
                    type: col.lookupId ? DATATABLE_COL_TYPES.URL : this.getCellType(col.dataType),
                    sortable: col.sortable,
                    lookupId: col.lookupId,
                    editable: this.isFieldEditable(col)
                }
            };

            if (col.lookupId) {
                column.typeAttributes = {
                    label: { fieldName: col.fieldApiName },
                    target: '_blank'
                };
            }

            if (col.dataType === DATATABLE_COL_TYPES.DATETIME) {
                column.typeAttributes = {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
            }

            this.fieldApiNameToColumn[col.fieldApiName] = column;
            this.fieldApiNames.push(col.fieldApiName);

            return column;
        });

        this.sortedBy = displayColumns.find((col) => col.sortable)?.fieldApiName;

        this.defineActions();

        if (this.actions && this.actions.length > 0) {
            this.columns.push({ type: 'action', typeAttributes: { rowActions: this.actions } });
        }
    }

    parseRecordsData(records) {
        if (!records || records.length === 0) {
            this.records = [];
            this.count = 0;
            return;
        }

        this.records = records.map((record) => {
            const result = {};
            result.Id = record.id;

            if (!this.fieldApiNames) {
                return result;
            }

            for (let fieldName of this.fieldApiNames) {
                const splittedName = fieldName.split('.');
                const isLookup = this.fieldApiNameToColumn[fieldName].lookupId;
                const isCurrency = this.fieldApiNameToColumn[fieldName].type === DATATABLE_COL_TYPES.CURRENCY;

                if (!splittedName || !record?.fields?.[splittedName[0]]) {
                    continue;
                }

                result[fieldName] =
                    splittedName.length > 1
                        ? record.fields[splittedName[0]].value?.fields[splittedName[1]].value // get value from lookup
                        : record.fields[fieldName].value; // get value from non-lookup field

                if (isLookup && result[fieldName]) {
                    result[`${fieldName}${CONSTANTS.URL_FIELD_POSTFIX}`] =
                        splittedName.length > 1
                            ? `/${record.fields[splittedName[0]].value?.id}` // standard/custom lookup
                            : `/${record.id}`; // standard name lookup
                }

                if (isCurrency) {
                    result[fieldName] = result[fieldName] || 0;
                }
            }

            return result;
        });

        this.count = this.records.length;
    }

    // CRUD HELPERS
    updateRelatedRecords(draftValues) {
        const recordInputs = draftValues.slice().map((draft) => {
            const fields = { ...draft };
            return { fields };
        });

        if (!recordInputs || recordInputs.length === 0) {
            return;
        }

        this.isLoading = true;

        const promises = recordInputs.map((recordInput) => updateRecord(recordInput));
        Promise.all(promises)
            .then(() => {
                showToastNotification(LABELS.recordsUpdated);

                this.draftValues = [];
            })
            .catch((error) => {
                logError(error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    editRecord(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: this.relatedObjectApiName,
                actionName: 'edit'
            }
        });
    }

    async deleteRecord(recordId) {
        const result = await LightningConfirm.open({
            message: LABELS.confirmDelete,
            variant: 'headerless'
        });

        if (!result) {
            return;
        }

        this.isLoading = true;

        deleteRecord(recordId)
            .then(() => showToastNotification(LABELS.recordDeleted))
            .catch((error) => {
                logError(error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    refreshRecords() {
        this.isLoading = true;

        notifyRecordUpdateAvailable(
            this.records.map((record) => {
                return { recordId: record.Id };
            })
        )
            .catch((error) => {
                logError(error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    // UI HELPERS
    defineActions() {
        this.actions = [];

        if (this.showViewAction) {
            this.actions.push(VIEW_ACTION);
        }
        if (!this.hideEditAction) {
            this.actions.push(EDIT_ACTION);
        }
        if (!this.hideDeleteAction) {
            this.actions.push(DELETE_ACTION);
        }
        if (!this.hideDocumentsAction) {
            this.actions.push(DOCUMENTS_ACTION);
        }
    }

    defineTitle() {
        if (!this.title) {
            return;
        }

        let title = this.title;

        if (this.titleCallback) {
            title = this.titleCallback(this.originalTitle, this.records, this.count);
        }

        if (title.includes('undefined')) {
            title = this.originalTitle;
        }

        this.title = title;
    }

    isFieldEditable(fieldData) {
        return (
            this.relatedObjectInfo &&
            this.relatedObjectInfo.updateable &&
            this.relatedObjectInfo.fields &&
            this.relatedObjectInfo.fields[fieldData.fieldApiName] &&
            this.relatedObjectInfo.fields[fieldData.fieldApiName].updateable &&
            !fieldData.dataType.includes('date') &&
            !fieldData.dataType.includes('picklist') &&
            !fieldData.dataType.includes('address') &&
            !fieldData.dataType.includes('encryptedstring') &&
            !fieldData.lookupId
        );
    }

    getCellType(uiRecordApiType) {
        switch (uiRecordApiType) {
            case 'address':
                return 'text';
            case 'base64':
                return 'text';
            case 'boolean':
                return 'boolean';
            case 'combobox':
                return 'text';
            case 'complexvalue':
                return 'text';
            case 'currency':
                return 'currency';
            case 'date':
                return 'date-local';
            case 'datetime':
                return 'date';
            case 'double':
                return 'number';
            case 'email':
                return 'email';
            case 'encryptedstring':
                return 'text';
            case 'int':
                return 'number';
            case 'location':
                return 'text';
            case 'multipicklist':
                return 'text';
            case 'percent':
                return 'percent';
            case 'phone':
                return 'phone';
            case 'picklist':
                return 'text';
            case 'reference':
                return 'text';
            case 'string':
                return 'text';
            case 'textarea':
                return 'text';
            case 'time':
                return 'text';
            case 'url':
                return 'url';
            default:
                return 'text';
        }
    }
}
