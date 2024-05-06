public with sharing class Constants {

    public static final Blob ENCRYPTION_KEY = Blob.valueOf( UserInfo.getOrganizationId().right(16) );

    public static Map<String, Schema.SObjectType> GLOBAL_DESCRIBE {
        get {
            if (GLOBAL_DESCRIBE == null) GLOBAL_DESCRIBE = Schema.getGlobalDescribe();

            return GLOBAL_DESCRIBE;
        }
        set {
            GLOBAL_DESCRIBE = value;
        }
    }

    public static User USER_INFO {
        get {
            if (USER_INFO == null) { USER_INFO = Utils.getUserInformation(); }

            return USER_INFO;
        }
        set {
            USER_INFO = value;
        }
    }

    public static String ORG_PREFIX {
        get {
            if (ORG_PREFIX == null) {
                String orgPrefix = [SELECT Id, IsSandbox, NamespacePrefix FROM Organization LIMIT 1].NamespacePrefix;

                ORG_PREFIX  = orgPrefix != null ? orgPrefix + '__' : '';
            }

            return ORG_PREFIX;
        }
        set {
            ORG_PREFIX = value;
        }
    }

    public static String ORG_DOMAIN {
        get {
            if (ORG_DOMAIN == null) ORG_DOMAIN = System.Url.getOrgDomainUrl().toExternalForm().replace('.my.salesforce', '.lightning.force');

            return ORG_DOMAIN;
        }
        set {
            ORG_DOMAIN = value;
        }
    }

    // RESULT DATA STATUSES
    public static final String STATUS_SUCCESS           = 'SUCCESS';
    public static final String STATUS_ERROR             = 'ERROR';
    public static final String STATUS_ACCESS_DENIED     = 'ACCESS_DENIED';
    public static final String STATUS_VALIDATION_ERROR  = 'VALIDATION_ERROR';

    public static final String TASK_DETAIL_PAGE_QUERY_PARAM_NAME = 'vtse__recordId';

    // COMMON FIELD NAMES
    public static final String FIELD_NAME_ID                 = 'Id';
    public static final String FIELD_NAME_NAME               = 'Name';
    public static final String FIELD_NAME_EMAIL              = 'Email';
    public static final String FIELD_NAME_DESCRIPTION        = 'Description';
    public static final String FIELD_NAME_CREATED_DATE       = 'CreatedDate';
    public static final String FIELD_NAME_CREATED_BY_ID      = 'CreatedById';
    public static final String FIELD_NAME_CREATED_BY_NAME    = 'CreatedBy.Name';
    public static final String FIELD_NAME_LAST_MODIFIED_BY   = 'LastModifiedBy';
    public static final String FIELD_NAME_LAST_MODIFIED_DATE = 'LastModifiedDate';

    // USER FIELD NAMES
    public static final String FIELD_NAME_FIRST_NAME = 'FirstName';
    public static final String FIELD_NAME_LAST_NAME  = 'LastName';
    public static final String FIELD_NAME_ROLE_NAME  = 'UserRole.Name';
    public static final String FIELD_NAME_USERNAME   = 'Username';
    public static final String FIELD_NAME_USER_TYPE  = 'UserType';

    public static final Set<String> USER_QUERY_FIELDS = new Set<String>{
        FIELD_NAME_ID,
        FIELD_NAME_NAME,
        FIELD_NAME_FIRST_NAME,
        FIELD_NAME_LAST_NAME,
        FIELD_NAME_EMAIL,
        FIELD_NAME_ROLE_NAME,
        FIELD_NAME_USERNAME
    };

    public static final List<String> EMAIL_TEMPLATES_NAMES = new List<String>{};

    public static final String INTERNAL_LICENSE_NAME_STANDARD = 'Standard';

    public static final List<String> INTERNAL_LICENSES = new List<String>{
        INTERNAL_LICENSE_NAME_STANDARD,
        'CsnOnly'
    };

    public static final List<String> EXTERNAL_LICENSES = new List<String>{
        'PowerCustomerSuccess',
        'CspLitePortal',
        'PowerPartner',
        'CustomerSuccess'
    };

    public static final Integer MAXIMUM_INTEGER_VALUE = 2147483647;
}