import { LightningElement, api, track } from 'lwc';

import utils from 'c/utils';

export default class LwcListCheckerItem extends LightningElement {
    @track checkerItem = {};

    @api
    get checker() {
        return this.checkerItem;
    }
    set checker(value) {
        this.checkerItem = {
            id:         value.id        || '',
            apiName:    value.apiName   || '',
            label:      value.label     || '',
            isCustom:   value.isCustom  || false,
            isChecked:  value.isChecked || false,
            isHidden:   value.isHidden  || false,
            key:        value.key       || ''
        };
    }

    @api
    get label() {
        return this.checkerItem.label || '';
    }
    set label(value) {
    }

    @api
    get isCustom() {
        return this.checkerItem.isCustom || false;
    }
    set isCustom(value) {
    }

    @api
    get isChecked() {
        return this.checkerItem.isChecked || false;
    }
    set isChecked(value) {
        this.checkerItem.isChecked = this.checkerItem.isHidden === false && value;
    }

    @api
    get isHidden() {
        return this.checkerItem.isHidden || false;
    }
    set isHidden(value) {
        this.checkerItem.isHidden = value;
    }

    get checkerTitle() {
        return this.checker.apiName;
    }

    get checkerClasses() {
        return utils.computeClasses([
            'slds-is-relative slds-truncate slds-p-around_xx-small checker',
            this.isChecked ? '' : 'checker-item_unchecked',
            this.isHidden ? 'is-hidden' : '',
            this.isCustom ? 'is-custom' : ''
        ]);
    }

    // --- HANDLERS ---

    handleOnclick() {
        this.isChecked = !this.isChecked;

        this.dispatchEvent(new CustomEvent('itemchange'));
    }

}