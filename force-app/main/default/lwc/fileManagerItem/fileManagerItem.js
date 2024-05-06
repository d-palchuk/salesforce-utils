import { LightningElement, api } from 'lwc';
import { LABELS } from './labels.js';

export default class FileManagerItem extends LightningElement {
    labels = LABELS;

    @api file;

    newFileName;
    isEditMode = false;

    async handleDeleteFiles() {
        this.dispatchEvent(new CustomEvent('deletefile', { detail: this.file.Id }));
    }

    handlePreviewFile() {
        this.dispatchEvent(new CustomEvent('previewfile', { detail: this.file.Id }));
    }

    handleDownloadFile() {
        this.dispatchEvent(new CustomEvent('downloadfile', { detail: this.file.Id }));
    }

    handleRename() {
        this.isEditMode = true;
    }

    handleSave() {
        this.renameFile();
    }

    handleCancel() {
        this.cancelRename();
    }

    handleInputChange() {
        this.newFileName = this.refs.input.value;
    }

    handleKeyPress(evt) {
        if (evt.key === 'Enter') {
            this.handleSave();
        }
    }

    cancelRename() {
        this.isEditMode = false;
    }

    renameFile() {
        this.dispatchEvent(
            new CustomEvent('renamefile', {
                detail: {
                    id: this.file.Id,
                    name: this.newFileName
                }
            })
        );

        this.isEditMode = false;
    }
}
