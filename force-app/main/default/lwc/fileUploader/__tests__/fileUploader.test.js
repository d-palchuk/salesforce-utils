import { createElement } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';
import { flushPromises } from 'c/utils'

import FileUploader from 'c/fileUploader';
import getExistingFiles from '@salesforce/apex/FileUploaderCtrl.getExistingFiles';

const mockFiles = require('./data/files.json');

const CMP_NAME = 'c-file-uploader';
const RECORD_ID_INPUT = '00ZXXXXXXXXXXXXXXX';
const UPLOAD_LABEL_INPUT = 'Upload Label';
const ACCEPTED_FORMATS_INPUT = '.txt, .pdf';
const REQUIRED_MESSAGE_INPUT = 'Required message from outside.';
const ALLOW_MULTIPLE_INPUT = true;
const DISABLED_INPUT = false;
const REQUIRED_INPUT = true;

jest.mock(
    '@salesforce/apex/FileUploaderCtrl.getExistingFiles',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

function setPublicProperties() {
    const element = document.querySelector(CMP_NAME);

    element.recordId = RECORD_ID_INPUT;
    element.label = UPLOAD_LABEL_INPUT;
    element.disabled = DISABLED_INPUT;
    element.required = REQUIRED_INPUT;
    element.allowMultiple = ALLOW_MULTIPLE_INPUT;
    element.requiredMessage = REQUIRED_MESSAGE_INPUT;
    element.acceptedFormats = ACCEPTED_FORMATS_INPUT;
}

describe('c-file-uploader', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }

        jest.clearAllMocks();
    });

    it('public properties are working fine', async () => {
        getExistingFiles.mockResolvedValue(mockFiles)

        const element = createElement(CMP_NAME, {
            is: FileUploader
        });

        document.body.appendChild(element);

        setPublicProperties();

        await flushPromises();

        expect(element.recordId).toBe(RECORD_ID_INPUT);
        expect(element.label).toBe(UPLOAD_LABEL_INPUT);
        expect(element.disabled).toBe(DISABLED_INPUT);
        expect(element.required).toBe(REQUIRED_INPUT);
        expect(element.allowMultiple).toBe(ALLOW_MULTIPLE_INPUT);
        expect(element.requiredMessage).toBe(REQUIRED_MESSAGE_INPUT);
        expect(element.acceptedFormats).toEqual(ACCEPTED_FORMATS_INPUT.split(','));
    });

    it('renders files properly', async () => {
        getExistingFiles.mockResolvedValue(mockFiles)

        const element = createElement(CMP_NAME, {
            is: FileUploader
        });

        document.body.appendChild(element);

        setPublicProperties();

        await flushPromises();

        expect(element.shadowRoot.querySelectorAll('[data-file]').length).toBe(mockFiles.length);
    });

    it('deletion works properly', async () => {
        getExistingFiles.mockResolvedValue(mockFiles)

        const element = createElement(CMP_NAME, {
            is: FileUploader
        });

        document.body.appendChild(element);

        setPublicProperties();

        await flushPromises();

        element.shadowRoot.querySelector('lightning-button-icon[data-file-id]').click();

        await flushPromises();

        expect(deleteRecord).toHaveBeenCalled();
        expect(deleteRecord.mock.calls[0][0]).toEqual(mockFiles[0].id);
    });

    it('disabled() getter works properly', async () => {
        getExistingFiles.mockResolvedValue(mockFiles)

        const element = createElement(CMP_NAME, {
            is: FileUploader
        });

        document.body.appendChild(element);

        setPublicProperties();

        await flushPromises();

        expect(element.disabled).toBeFalsy();

        element.recordId = undefined;

        await flushPromises();

        expect(element.disabled).toBeTruthy();
    });

    it('validate() works properly - positive', async () => {
        getExistingFiles.mockResolvedValue(mockFiles)

        const element = createElement(CMP_NAME, {
            is: FileUploader
        });

        document.body.appendChild(element);

        setPublicProperties();

        await flushPromises();

        expect(element.validate().isValid).toBeTruthy();
    });

    it('validate() works properly - negative', async () => {
        getExistingFiles.mockResolvedValue([])

        const element = createElement(CMP_NAME, {
            is: FileUploader
        });

        document.body.appendChild(element);

        setPublicProperties();

        await flushPromises();

        expect(element.validate().isValid).toBeFalsy();
    });

});