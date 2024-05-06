import { LightningElement } from 'lwc';
import { TAG_NAME } from 'c/constants';

export default class RecordFormSuper extends LightningElement {
    activeSections = [];
    isViewMode = true;
    isLoading = false;

    render() {
        return this.isViewMode ? this.viewFormTemplate : this.editFormTemplate;
    }

    handleSubmit() {
        this.isLoading = true;
    }

    handleSuccess() {
        this.isLoading = false;

        this.switchView();
    }

    handleError() {
        this.isLoading = false;
    }

    handleCancel() {
        this.switchView();
    }

    handleFormDoubleClick(evt) {
        if (evt.target.tagName === TAG_NAME.LIGHTNING_OUTPUT_FIELD) {
            this.switchView();
        }
    }

    switchView() {
        this.isViewMode = !this.isViewMode;
    }
}
