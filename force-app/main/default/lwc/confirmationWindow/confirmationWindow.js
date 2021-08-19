import { LightningElement, api } from 'lwc'

import DEFAULT_MESSAGE           from '@salesforce/label/c.Default_Confirmation_Message';
import DEFAULT_AGREE_LABEL       from '@salesforce/label/vtui.Yes';
import DEFAULT_DISAGREE_LABEL    from '@salesforce/label/vtui.No';

const DEFAULT_SLDS_ICON_NAME = 'info'
const CONFIRM_INSTANCE_KEY   = 'div.custom-warning-toast'
const BACKDROP_INSTANCE_KEY  = 'div.slds-backdrop'
const BTN_AGREE_KEY          = 'agree'
const BTN_DISAGREE_KEY       = 'disagree'
let   TOAST_HEIGHT_FROM_TOP  = 'top: 3.125rem;';


const GET_CONFIRM_INSTANCE_JSX = args => {
    let { agreeButtonName,
        disagreeButtonName,
        message,
        iconName,
        additionalNotes,
        heightFromTopInRem } = args;

    if (heightFromTopInRem) { TOAST_HEIGHT_FROM_TOP = `top: ${heightFromTopInRem}rem`; }

    return (`
        <div class="slds-notify_container custom-warning-toast" style="${TOAST_HEIGHT_FROM_TOP}">
            <div class="slds-notify slds-notify_toast slds-theme_warning main" role="status">
                <div class="confirmation-area">
                    <div class="confirmation-area_align-center">
                        <svg class='slds-button__icon confirmation-icon'
                             aria-hidden='true'>
                            <use xlink:href='/_slds/icons/utility-sprite/svg/symbols.svg#${iconName || DEFAULT_SLDS_ICON_NAME}'>
                            </use>
                        </svg>

                        <h2>${message || DEFAULT_MESSAGE}</h2>
                    </div>
                    <div class="confirmation-area_align-center">
                        <button id='${BTN_DISAGREE_KEY}' class="slds-button slds-button_neutral">

                            ${disagreeButtonName || DEFAULT_DISAGREE_LABEL}
                        </button>

                        <button id='${BTN_AGREE_KEY}' class="slds-button slds-button_neutral">

                            ${agreeButtonName || DEFAULT_AGREE_LABEL}
                        </button>
                    </div>
                </div>
                <div data-is-show="${additionalNotes ? true : false}" class="additional-notes-area">
                    <span>${additionalNotes}</span>
                </div>
            </div>
        </div>
        <div class='slds-backdrop slds-backdrop_open'></div>
    `)
}

export default class ConfirmationWindowLwc extends LightningElement {

    @api getUserDecision(args = {}) {
        const container     = this.getSingleDomElement('.container')
        container.innerHTML = GET_CONFIRM_INSTANCE_JSX(args)

        let btnYes = container.querySelector(`#${BTN_AGREE_KEY}`)
        let btnNo  = container.querySelector(`#${BTN_DISAGREE_KEY}`)

        return new Promise( resolve => {
            btnYes.addEventListener('click', () => {
                resolve(true)
                this.destroyConfirmInstance()
            })
            btnNo.addEventListener('click', () => {
                resolve(false)
                this.destroyConfirmInstance()
            })
        })
    }

    destroyConfirmInstance() {
        this.getSingleDomElement(CONFIRM_INSTANCE_KEY).remove()
        this.getSingleDomElement(BACKDROP_INSTANCE_KEY).remove()
    }

    getSingleDomElement(target) {
        return this.template.querySelector(target)
    }
}
