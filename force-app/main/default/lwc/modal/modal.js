import { LightningElement, api } from 'lwc';

export default class ModalLwc extends LightningElement {
    _hideHeader   = false;
    _hideFooter   = false;
    _containerClass = '';
    _headerClass  = '';
    _contentClass = '';
    _footerClass  = '';

    @api headerStyle  = '';
    @api contentStyle = '';
    @api footerStyle  = '';
    @api errorMessage = '';

    @api
    get hideHeader() {
        return this._hideHeader;
    }
    set hideHeader(value) {
        this._hideHeader = !!value;
    }
    @api
    get hideFooter() {
        return this._hideFooter;
    }
    set hideFooter(value) {
        this._hideFooter = !!value;
    }
    @api
    get containerClass() {
        return `slds-modal__container ${this._containerClass}`;
    }
    set containerClass(value) {
        this._containerClass = String(value);
    }
    @api
    get headerClass() {
        return `slds-modal__header ${this._headerClass}`;
    }
    set headerClass(value) {
        this._headerClass = String(value);
    }
    @api
    get contentClass() {
        return  `slds-modal__content ${this._contentClass}`;
    }
    set contentClass(value) {
        this._contentClass = String(value);
    }
    @api
    get footerClass() {
        return `slds-modal__footer slds-modal__footer_directional slds-grid slds-grid_align-end ${this._footerClass}`;
    }
    set footerClass(value) {
        this._footerClass = String(value);
    }


    handleResetError() {
        this.errorMessage = '';
    }
    handleCloseModal() {
        this.dispatchEvent (new CustomEvent('closemodal'));
    }
}