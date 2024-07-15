import LightningModal from 'lightning/modal';
import LightningConfirm from 'lightning/confirm';
import { api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';
import { updateRecord, deleteRecord } from 'lightning/uiRecordApi';
import { getIconByDocType, logError, showToastNotification, isExperienceCloudCtx } from 'c/utils';
import { gql, graphql, refreshGraphQL } from 'lightning/uiGraphQLApi';

import { TOAST_VARIANT } from 'c/constants';
import { LABELS } from './labels.js';
import { MODE, ACCEPTED_FORMATS, DOWNLOAD_PATH, VIEW_PATH, FULL_VIEW_PATH, FULL_VIEW_PATH_SITE } from './constants.js';

import templateMain from './templateMain.html';
import templateModal from './templateModal.html';
import fileManagerCss from './fileManager.css';

import ID_FIELD from '@salesforce/schema/ContentVersion.Id';
import TITLE_FIELD from '@salesforce/schema/ContentVersion.Title';

export default class FileManager extends NavigationMixin(LightningModal) {
    static stylesheets = [fileManagerCss];

    labels = LABELS;

    @api recordId;
    @api mode = MODE.ACTION;
    @api filter; // eg. '{"Type__c":{"eq":"CustomDocType"}}';
    @api hideCloseButton = false;
    @api hideDownload = false;
    @api hideUpload = false;
    @api recordIds;
    @api title = LABELS.uploadDocuments;

    @track files;
    @track spinnerStatus = {
        isLoading: false
    };

    contentDocumentLinksIds;
    queryContentDocumentLinksResult;
    whereFilter = {};

    acceptedFormats = ACCEPTED_FORMATS;
    isExperienceCloudCtx = false;

    get isFileUploadVisible() {
        return !this.hideUpload;
    }

    // LIFECYCLE HOOKS
    render() {
        return this.mode === MODE.ACTION ? templateMain : this.mode === MODE.MODAL ? templateModal : templateMain;
    }

    renderedCallback() {
        this.overrideCommunityStyles();
    }

    // QUERY CONTENT DOCUMENT LINKS
    @wire(graphql, {
        query: '$contentDocumentLinksQuery',
        variables: '$contentDocumentLinksQueryVariables'
    })
    queryContentDocumentLinks(result) {
        const { data, errors } = result;

        if (data) {
            this.contentDocumentLinksIds = data?.uiapi.query.ContentDocumentLink.edges.map(
                (edge) => edge.node.ContentDocumentId.value
            );
        }
        if (errors) {
            logError(errors);
        }
        this.queryContentDocumentLinksResult = result;
    }

    get contentDocumentLinksQuery() {
        return gql`
            query queryContentDocumentLinks($recordIds: [ID]!) {
                uiapi {
                    query {
                        ContentDocumentLink(first: 1000, where: { LinkedEntityId: { in: $recordIds } }) {
                            edges {
                                node {
                                    Id
                                    ContentDocumentId {
                                        value
                                    }
                                    LinkedEntityId {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
    }

    get contentDocumentLinksQueryVariables() {
        return {
            recordIds: this.recordIds || [this.recordId]
        };
    }

    // QUERY CONTENT VERSIONS
    @wire(graphql, {
        query: '$contentVersionsQuery',
        variables: '$contentVersionsQueryVariables' // Use a getter function to make the variables reactive
    })
    queryContentVersions({ data, errors }) {
        let baseUrl = 'https://' + window.location.host + '/';
        if (data) {
            this.files = data?.uiapi.query.ContentVersion.edges.map((edge) => ({
                Id: edge.node.Id,
                Title: edge.node.Title.value,
                FileExtension: edge.node.FileExtension.value,
                ContentDocumentId: edge.node.ContentDocumentId.value,
                downloadUrl: baseUrl + DOWNLOAD_PATH + edge.node.ContentDocumentId.value,
                fileUrl: baseUrl + VIEW_PATH + edge.node.Id,
                viewUrl: baseUrl + FULL_VIEW_PATH + edge.node.ContentDocumentId.value + '/view',
                viewUrlSite: baseUrl + FULL_VIEW_PATH_SITE + edge.node.ContentDocumentId.value,
                createdBy: edge.node.ContentDocument.CreatedBy.Name.value,
                createdDate: new Date(edge.node.ContentDocument.CreatedDate.value).toLocaleString(),
                icon: getIconByDocType(edge.node.FileExtension.value)
            }));
        }
        if (errors) {
            logError(errors);
        }
    }

    get contentVersionsQuery() {
        return !this.contentDocumentLinksIds
            ? undefined
            : gql`
                  query queryContentVersions($whereClause: ContentVersion_Filter) {
                      uiapi {
                          query {
                              ContentVersion(
                                  first: 1000
                                  where: $whereClause
                                  orderBy: { CreatedDate: { order: DESC } }
                              ) {
                                  edges {
                                      node {
                                          Id
                                          Title {
                                              value
                                          }
                                          FileExtension {
                                              value
                                          }
                                          ContentDocumentId {
                                              value
                                          }
                                          CreatedDate {
                                              value
                                          }
                                          ContentDocument {
                                              CreatedBy {
                                                  Name {
                                                      value
                                                  }
                                              }
                                              ContentSize {
                                                  value
                                              }
                                              CreatedDate {
                                                  value
                                              }
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  }
              `;
    }

    get contentVersionsQueryVariables() {
        this.whereFilter = {
            and: [
                {
                    ContentDocumentId: {
                        in: this.contentDocumentLinksIds
                    }
                }
            ]
        };

        if (this.filter) {
            this.whereFilter.and.push(JSON.parse(this.filter));
        }

        return {
            contentDocumentLinksIds: this.contentDocumentLinksIds,
            whereClause: this.whereFilter
        };
    }

    async handleRefresh() {
        return refreshGraphQL(this.queryContentDocumentLinksResult);
    }

    //ACTIONS
    async deleteFile(fileId) {
        const result = await LightningConfirm.open({
            message: LABELS.confirmDelete,
            variant: 'headerless'
        });

        if (!result) {
            return;
        }

        this.spinnerStatus.isLoading = true;

        try {
            await deleteRecord(fileId);
            this.handleRefresh();
        } catch (error) {
            showToastNotification(LABELS.deleteError, '', TOAST_VARIANT.ERROR);
        } finally {
            this.spinnerStatus.isLoading = false;
        }
    }

    async renameFile(file, name) {
        this.spinnerStatus.isLoading = true;

        const fields = {};
        fields[ID_FIELD.fieldApiName] = file.Id;
        fields[TITLE_FIELD.fieldApiName] = name;

        const recordInput = { fields };

        try {
            await updateRecord(recordInput);
            this.handleRefresh();
        } catch (error) {
            logError(error);
        } finally {
            this.spinnerStatus.isLoading = false;
        }
    }

    // HANDLERS
    handlePreviewFile(event) {
        let file = this.files.find((a) => a.Id === event.detail);

        if (!this.isExperienceCloudCtx) {
            if (this.mode === MODE.MODAL) {
                window.open(file.fileUrl);
            } else {
                this[NavigationMixin.Navigate]({
                    type: 'standard__namedPage',
                    attributes: {
                        pageName: 'filePreview'
                    },
                    state: {
                        selectedRecordId: file.ContentDocumentId
                    }
                });
            }
        } else if (this.isExperienceCloudCtx) {
            this[NavigationMixin.Navigate](
                {
                    type: 'standard__webPage',
                    attributes: {
                        url: file.fileUrl
                    }
                },
                false
            );
        }
    }

    handleOpenFile(event) {
        let file = this.files.find((a) => a.Id === event.detail);

        if (!this.isExperienceCloudCtx) {
            window.open(file.viewUrl);
        } else if (this.isExperienceCloudCtx) {
            this[NavigationMixin.Navigate](
                {
                    type: 'standard__webPage',
                    attributes: {
                        url: file.viewUrlSite
                    }
                },
                false
            );
        }
    }

    handleDeleteFile(event) {
        let file = this.files.find((a) => a.Id === event.detail);
        this.deleteFile(file.ContentDocumentId);
    }

    handleDownloadFile(event) {
        let file = this.files.find((a) => a.Id === event.detail);

        if (this.mode === MODE.MODAL) {
            window.open(file.downloadUrl);
        } else {
            this[NavigationMixin.Navigate](
                {
                    type: 'standard__webPage',
                    attributes: {
                        url: file.downloadUrl
                    }
                },
                false
            );
        }
    }

    handleRenameFile(event) {
        let file = this.files.find((a) => a.Id === event.detail.id);
        this.renameFile(file, event.detail.name);
    }

    handleUploadFinished(event) {
        this.dispatchEvent(new CustomEvent('uploadfinished', { detail: event.detail.files }));
        this.handleRefresh();
    }

    handleCancel() {
        if (this.mode === MODE.ACTION) {
            this.dispatchEvent(new CloseActionScreenEvent());
        } else if (this.mode === MODE.MODAL) {
            this.close();
        }
    }

    handleDataReload() {
        this.handleRefresh();
    }

    // HELPERS
    async overrideCommunityStyles() {
        this.isExperienceCloudCtx = await isExperienceCloudCtx();

        if (this.isExperienceCloudCtx) {
            const style = document.createElement('style');
            style.textContent = `.slds-modal__container{
                width: 70% !important;
                max-width: 100% !important;
                min-width: 480px;
                max-height: 100%;
                min-height: 480px;
                margin: 0px auto !important;
            }`;

            this.refs.card.appendChild(style);
        }
    }
}
