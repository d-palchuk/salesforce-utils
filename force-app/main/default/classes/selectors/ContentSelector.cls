public with sharing class ContentSelector {
    public static List<ContentDocumentLink> getContentDocumentsById(List<Id> recordId) {
        return [
            SELECT ContentDocumentId, LinkedEntityId
            FROM ContentDocumentLink
            WHERE LinkedEntityId IN :recordId
            WITH USER_MODE
        ];
    }

    public static List<ContentVersion> getContentVersionsById(Set<Id> contentDocumentIds) {
        return [
            SELECT
                Id,
                Title,
                FileExtension,
                ContentDocument.CreatedBy.Name,
                ContentDocument.ContentSize,
                ContentDocumentId,
                ContentDocument.CreatedDate
            FROM ContentVersion
            WHERE ContentDocumentId IN :contentDocumentIds
            WITH USER_MODE
            ORDER BY ContentDocument.CreatedDate DESC
        ];
    }
}