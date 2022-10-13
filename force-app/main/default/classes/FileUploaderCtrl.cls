public inherited sharing class FileUploaderCtrl {

    @AuraEnabled
    public static List<FileWrapper> getExistingFiles(Id recordId){
        List<FileWrapper> result = new List<FileWrapper> ();

        if (recordId == null) {
            return result;
        }

        try {
            for (ContentDocumentLink doc : [
                SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileExtension
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :recordId
                WITH SECURITY_ENFORCED
            ]) {
                result.add(new FileWrapper(doc));
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }

        return result;
    }

    public class FileWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String extension;

        public FileWrapper(ContentDocumentLink doc) {
            this.id = doc.ContentDocumentId;
            this.name = doc.ContentDocument.Title;
            this.extension = doc.ContentDocument.FileExtension;
        }
    }
}
