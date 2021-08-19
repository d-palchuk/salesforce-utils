public with sharing class EmailService {

    private static Map<Id, EmailTemplate>     TEMPLATE_BY_ID_MAP       = new Map<Id, EmailTemplate>();
    private static Map<String, EmailTemplate> TEMPLATE_BY_DEV_NAME_MAP = new Map<String, EmailTemplate>();

    private static WithoutSharingOps WOSInstance;

    private static WithoutSharingOps getWOSInstance() {
        if (WOSInstance == null) WOSInstance = new WithoutSharingOps();

        return WOSInstance;
    }

    public static EmailTemplate getEmailTemplate(String templateDevName) {
        setEmailTemplateMaps();

        return TEMPLATE_BY_DEV_NAME_MAP.containsKey(templateDevName)
            ? TEMPLATE_BY_DEV_NAME_MAP.get(templateDevName)
            : null;
    }

    public static void sendEmails(Map<Id,Id> whatIdToUserIdMap, String templateApiName) {
        sendEmails(whatIdToUserIdMap, getEmailTemplate(templateApiName));
    }
    public static void sendEmails(Map<Id,Id> whatIdToUserIdMap, EmailTemplate template) {
        if (whatIdToUserIdMap.isEmpty() || template == null) return;

		List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Id recordId : whatIdToUserIdMap.keySet()) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();

            email.setTemplateId(template.Id);
            email.setTargetObjectId(whatIdToUserIdMap.get(recordId));
            email.setWhatId(recordId);
            email.setSaveAsActivity(false);

            emails.add(email);
        }

        Messaging.sendEmail(emails, false);
    }


    private static void setEmailTemplateMaps() {
        if (!TEMPLATE_BY_ID_MAP.isEmpty()) return;

        for (EmailTemplate template : getWOSInstance().getEmailTemplates()) {
            TEMPLATE_BY_ID_MAP.put(template.Id, template);
            TEMPLATE_BY_DEV_NAME_MAP.put(template.DeveloperName, template);
        }
    }

    private without sharing class WithoutSharingOps {
        public List<EmailTemplate> getEmailTemplates() {
            return [
                SELECT Id, DeveloperName, Subject, HtmlValue, Body
                FROM EmailTemplate
                WHERE DeveloperName IN :Constants.EMAIL_TEMPLATES_NAMES
            ];
        }
    }
}