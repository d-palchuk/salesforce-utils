public inherited sharing class Utils {

    public static void publishStandDeliverEvents(List<SObject> records, Boolean isApproverAction) {
        List<Stand_Deliver_Event__e> events = new List<Stand_Deliver_Event__e>();

        for (SObject record : records) {
            events.add(new Stand_Deliver_Event__e(
                SObjectId__c        = (String) record.get('Id'),
                isApproverAction__c = isApproverAction
            ));
        }

        EventBus.publish(events);
    }

    public static User getUserInformation() {
        return getUserInformation(UserInfo.getUserId());
    }

    public static User getUserInformation(Id userId) {
        return [
            SELECT Id
                , Name
                , ManagerId
                , DelegatedApproverId
                , UserRoleId
                , UserRole.ParentRoleId
                , ContactId
            FROM User
            WHERE Id = :userId
            WITH SECURITY_ENFORCED
        ];
    }

    public static Map<Id,Id> getReferenceIdToSobjectIdMap(List<SObject> records, String fieldApiName) {
        Map<Id,Id> result = new Map<Id,Id>();

        for (SObject record : records) {
            result.put(
                (Id) getDynamicFieldValueFromSObject(record, fieldApiName),
                (Id) record.get(Constants.FIELD_NAME_ID)
            );
        }

        return result;
    }
    public static Map<Id,Id> getSobjectIdToReferenceIdMap(List<SObject> records, String fieldApiName) {
        Map<Id,Id> result = new Map<Id,Id>();

        for (SObject record : records) {
            result.put(
                (Id) record.get(Constants.FIELD_NAME_ID),
                (Id) getDynamicFieldValueFromSObject(record, fieldApiName)
            );
        }

        return result;
    }
    public static Object getDynamicFieldValueFromSObject(SObject record, String fieldApiName) {
        return getDynamicFieldValueFromSObject(record, fieldApiName.split('\\.'));
    }
    public static Object getDynamicFieldValueFromSObject(SObject record, List<String> relationFieldApiNames) {
        if (relationFieldApiNames.size() > 1) {
            return getDynamicFieldValueFromSObject(
                record.getSObject(relationFieldApiNames.remove(0)),
                relationFieldApiNames
            );
        }

        return record.get(relationFieldApiNames[0]);
    }

    public static Set<String> getLicenses(String licenseType) {
        Set<String> result = new Set<String>();

        result.addAll(Constants.INTERNAL_LICENSES);

        if (licenseType == null || licenseType == 'internal and external') {
            result.addAll(Constants.INTERNAL_LICENSES);
            result.addAll(Constants.EXTERNAL_LICENSES);
        } else if (licenseType == 'internal') {
            result.addAll(Constants.INTERNAL_LICENSES);
        } else if (licenseType == 'external') {
            result.addAll(Constants.EXTERNAL_LICENSES);
        }

        return result;
    }

    public static List<SelectOption> getProfiles(String license) {
        List<SelectOption> result = new List<SelectOption>();

        String query = 'SELECT Id, Name';
        query += ' FROM Profile';

        Set<String> licenseList = getLicenses(license);

        query += ' WHERE UserType IN :licenseList';
        query += ' ORDER BY Name';
        query += ' LIMIT 300';


        for (Profile p : Database.query(query)) {
            result.add(new SelectOption(p.Id, p.Name));
        }

        return result;
    }

    public static List<SelectOption> getRoles() {
        List<SelectOption> result = new List<SelectOption>();

        for (UserRole ur : [SELECT Id, Name FROM UserRole WHERE PortalType = 'None' ORDER BY Name LIMIT 300]) {
            result.add(new SelectOption(ur.Id, ur.Name));
        }

        return result;
    }

    public static List<SelectOption> getCommunities() {
        List<SelectOption> result = new List<SelectOption>();

        if (Constants.GLOBAL_DESCRIBE.containsKey('Network') == false) return result;

        for (SObject community : Database.query('SELECT Id, Name FROM Network LIMIT 100')) {
            result.add(new SelectOption((String)community.get('Id'), (String)community.get('Name')));
        }

        return result;
    }

    public static String generateCronLine(Datetime startDateTime, Integer minutesToAdd) {
        startDateTime = startDateTime.addMinutes(minutesToAdd);

        return String.valueOf(startDateTime.second()) + ' ' +
               String.valueOf(startDateTime.minute()) + ' ' +
               String.valueOf(startDateTime.hour()) + ' ' +
               String.valueOf(startDateTime.day()) + ' ' +
               String.valueOf(startDateTime.month()) + ' ? ' +
               String.valueOf(startDateTime.year());
    }

    // format date as MM/dd/YYYY
    public static String getFormattedDate(Date dateValue) {
        List<String> splitDate = String.valueOf(dateValue).split('-');
        return splitDate.get(1) + '/' + splitDate.get(2) + '/' + splitDate.get(0);
    }

    public static String generateLinkToRecord(String objectApiName, String recordId) {
        return isCommunityEnvironment()
                ? Site.getBaseCustomUrl() + '/' + objectApiName.toLowerCase() + '/' + recordId
                : Constants.ORG_DOMAIN + '/lightning/r/' + objectApiName + '/' + recordId + '/view';
    }

    public static Boolean isCommunityEnvironment() {
        return Site.getSiteId() != null;
    }

    public static boolean isFieldExists(String objName, String fieldName) {
        try {
            return Constants.GLOBAL_DESCRIBE.get(objName).getDescribe().fields.getMap().containsKey(fieldName);
        }
        catch(Exception ex) {}

        return false;
    }
}