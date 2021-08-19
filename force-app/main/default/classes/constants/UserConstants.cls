public with sharing class UserConstants {

    public static final String OBJECT_NAME = 'User';

    public static final String FIELD_NAME_USER = String.valueOf(Stand_Deliver_Task__c.User__c);

    public static final String FIELD_NAME_USER_NAME   = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.User__c.relationshipName,
        Constants.FIELD_NAME_NAME
    }, '.');
    public static final String FIELD_NAME_OWNER_NAME   = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.OwnerId.relationshipName,
        Constants.FIELD_NAME_NAME
    }, '.');
    public static final String FIELD_NAME_LAST_MODIFIED_BY_NAME   = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.LastModifiedById.relationshipName,
        Constants.FIELD_NAME_NAME
    }, '.');
    public static final String FIELD_NAME_USER_IS_ACTIVE   = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.User__c.relationshipName,
        String.valueOf(User.IsActive)
    }, '.');
    public static final String FIELD_NAME_USER_DELEGATED_APPROVER_ID   = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.User__c.relationshipName,
        String.valueOf(User.DelegatedApproverId)
    }, '.');
    public static final String FIELD_NAME_USER_MANAGER_ID = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.User__c.relationshipName,
        String.valueOf(User.ManagerId)
    }, '.');
    public static final String FIELD_NAME_USER_ROLE_ID = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.User__c.relationshipName,
        String.valueOf(User.UserRoleId)
    }, '.');
    public static final String FIELD_NAME_USER_PARENT_ROLE_ID = String.join(new List<String>{
        Schema.SObjectType.Stand_Deliver_Task__c.fields.User__c.relationshipName,
        Schema.SObjectType.User.fields.UserRoleId.relationshipName,
        String.valueOf(UserRole.ParentRoleId)
    }, '.');
}
