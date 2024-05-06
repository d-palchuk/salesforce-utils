public with sharing class LwcUtils {
    @AuraEnabled
    public static Boolean isExperienceCloudCtx() {
        return Site.getSiteId() != null;
    }
}