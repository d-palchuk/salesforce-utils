// THIS MODULE IS WORK WITH BOTH AURA & LWC

import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class Pubsub extends LightningElement {
    @wire(CurrentPageReference) pageRef;

    connectedCallback() {
        this.dispatchEvent(new CustomEvent('ready'));
    }

    @api
    registerListener(eventName, callback, cmp, helper) {
        registerListener(eventName, callback, this, cmp, helper);
    }

    @api
    unregisterListener(eventName, callback) {
        unregisterListener(eventName, callback, this);
    }

    @api
    unregisterAllListeners() {
        unregisterAllListeners(this);
    }

    @api
    fireEvent(eventName, data) {
        fireEvent(this.pageRef, eventName, data);
    }
}

const events = {};

/**
 * Confirm that two page references have the same attributes
 * @param {object} pageRef1 - The first page reference
 * @param {object} pageRef2 - The second page reference
 */
const samePageRef = (pageRef1, pageRef2) => {
    const obj1 = pageRef1.attributes;
    const obj2 = pageRef2.attributes;
    return Object.keys(obj1)
        .concat(Object.keys(obj2))
        .every((key) => {
            return obj1[key] === obj2[key];
        });
};

/**
 * Registers a callback for an event
 * @param {string} eventName - Name of the event to listen for.
 * @param {function} callback - Function to invoke when said event is fired.
 * @param {object} thisArg - The value to be passed as the this parameter to the callback function is bound.
 * @param {object} cmp - Required only for Aura framework => The component context.
 * @param {object} helper - Required only for Aura framework => The value to be passed as the this parameter to the callback function is bound.
 */
const registerListener = (eventName, callback, thisArg, cmp, helper) => {

    if (!events[eventName]) {
        events[eventName] = [];
    }
    const duplicate = events[eventName].find((listener) => {
        return listener.callback === callback && listener.thisArg === thisArg
            || listener.cmp && cmp && listener.cmp === cmp;
    });
    if (!duplicate) {
        events[eventName].push({ callback, thisArg, cmp, helper });
    }
};

/**
 * Unregisters a callback for an event
 * @param {string} eventName - Name of the event to unregister from.
 * @param {function} callback - Function to unregister.
 * @param {object} thisArg - The value to be passed as the this parameter to the callback function is bound.
 */
const unregisterListener = (eventName, callback, thisArg) => {
    if (events[eventName]) {
        events[eventName] = events[eventName].filter(
            (listener) =>
                listener.callback !== callback || listener.thisArg !== thisArg
        );
    }
};

/**
 * Unregisters all event listeners bound to an object.
 * @param {object} thisArg - All the callbacks bound to this object will be removed.
 */
const unregisterAllListeners = (thisArg) => {
    Object.keys(events).forEach((eventName) => {
        events[eventName] = events[eventName].filter(
            (listener) => listener.thisArg !== thisArg
        );
    });
};

/**
 * Fires an event to listeners.
 * @param {object} pageRef - Reference of the page that represents the event scope. If skipped the event scope is whole application.
 * @param {string} eventName - Name of the event to fire.
 * @param {*} payload - Payload of the event to fire.
 */
const fireEvent = (pageRef, eventName, payload) => {
    if (events[eventName]) {
        const listeners = events[eventName];
        listeners.forEach((listener) => {
            if (!pageRef || samePageRef(pageRef, listener.thisArg.pageRef)) {
                try {
                    listener.callback.call(listener.helper || listener.thisArg, payload, listener.cmp, listener.helper);
                } catch (error) {
                    console.error(error)
                    // fail silently
                }
            }
        });
    }
};

export {
    registerListener,
    unregisterListener,
    unregisterAllListeners,
    fireEvent
};