/* eslint-disable no-console */
/* eslint-disable @lwc/lwc/no-async-operation */
import { LightningElement, api } from 'lwc';

import utils from 'c/utils';
import labels from './listCheckerLabels';

export default class LwcListChecker extends LightningElement {
    labels = labels;

    isMouseHere = false;

    @api filterLabel = '';
    @api isControlPanelDisabled;

    isDropdownShown  = false;
    scrollerStyle    = '';
    isSearchResultEmpty = false;

    @api
    get checkers() {
        return this._checkers;
    }
    set checkers(value) {
        this._checkers      = value.map((item, index) => { return {...item, key: item.apiName + '-' + index} });
        this._checkedCount  = undefined;

        setTimeout(() => this._checkedCount = undefined);
    }

    @api
    get isAnySelected() {
        return this.checkedCount > 0;
    }

    @api
    get selectedCheckers() {
        return this.checkerItems.filter(checker => checker.isChecked).map(checker => checker.checker);
    }

    _checkedCount;
    get checkedCount() {
        this._checkedCount = this._checkedCount === undefined
            ? this.selectedCheckers.length
            : this._checkedCount;

        return this._checkedCount;
    }

    get checkerItems() {
        return Array.from(this.template.querySelectorAll('c-lwc-list-checker-item'));
    }

    get filterPlaceholder() {
        return `${this.checkedCount} ${labels.selected}`;
    }

    get dropDownBlockClasses() {
        return utils.computeClasses([
            'slds-is-absolute dropdown',
            this.isDropdownShown ? 'slds-show' : 'slds-hide'
        ]);
    }

    // --- LIFECYCLE HOOKS ---

    connectedCallback() {
        this._handleWindowMouseClick = () => this.handleWindowMouseClick();

        window.addEventListener('click', this._handleWindowMouseClick, true);
    }

    disconnectedCallback() {
        window.removeEventListener('click', this._handleWindowMouseClick, true);
    }

    // --- HANDLERS ---

    handleMouseEnter() {
        this.isMouseHere = true;
    }
    handleMouseLeave() {
        this.isMouseHere = false;
    }

    handleInputMouseClick() {
        this.showDropdown();
    }

    handleSelectAll() {
        this.setIsCheckedForCheckers(true);

        this.handleItemChange();
    }

    handleDeselectAll() {
        this.setIsCheckedForCheckers(false);

        this.handleItemChange();
    }

    handleItemChange(event) {
        this._checkedCount = undefined;

        this.fireCheckersChangeEvent();
    }

    handleFilterChange(event) {
        this.applyIsHiddenForCheckersByFilter(event.target.value.toLowerCase());

        this.showDropdown();
    }

    handleWindowMouseClick() {
        this.hideDropdown();
    }

    // --- FUNCTIONS ---

    setIsCheckedForCheckers(value) {
        this.checkerItems
            .filter(checker => checker.isHidden === false)
            .forEach(checker => checker.isChecked = value);
    }

    showDropdown() {
        if (!this.isControlPanelDisabled) {
            this.isDropdownShown = true;
        }

        this.scrollerStyle = `max-height: calc(100vh - ${this.getBoundingClientRect().top}px - 6rem)`;
    }

    hideDropdown() {
        if (this.isMouseHere === false) {
            this.isDropdownShown = false;

            if (this.searchInputElement) {
                this.searchInputElement.value = '';
            }

            this.applyIsHiddenForCheckersByFilter('');
        }
    }

    fireCheckersChangeEvent() {
        this.dispatchEvent(new CustomEvent('changecheckers'));
    }

    applyIsHiddenForCheckersByFilter(filterString) {
        let notFilteredItemsLength = 0;

        this.checkerItems.forEach(checker => {
            checker.isHidden = (
                utils.stringIsNotBlank(filterString) &&
                checker.label.toLowerCase().includes(filterString) === false
            );

            if (!checker.isHidden) {
                notFilteredItemsLength++;
            }
        });

        this.isSearchResultEmpty = !this.checkerItems.some(checker => !checker.isHidden);
    }

    get searchInputElement() {
        this.template.querySelector('lightning-input');
    }

}