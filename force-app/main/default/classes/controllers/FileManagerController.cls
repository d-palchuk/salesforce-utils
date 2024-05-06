public with sharing class FileManagerController {
    @AuraEnabled
    public static List<ContentVersion> getContentDetails(String recordId) {
        List<ContentDocumentLink> contentDocumentList = ContentSelector.getContentDocumentsById(
            new List<Id>{ recordId }
        );

        Set<Id> contentDocumentId = new Set<Id>();

        for (ContentDocumentLink cdl : contentDocumentList) {
            contentDocumentId.add(cdl.ContentDocumentId);
        }

        return ContentSelector.getContentVersionsById(contentDocumentId);
    }
}