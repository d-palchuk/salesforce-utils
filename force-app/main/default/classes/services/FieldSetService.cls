public with sharing class FieldSetService {

    private static final Set<String> UNAVAILABLE_FIELDSET_FIELD_API_NAME = new Set<String>{
            'CreatedById',
            'LastModifiedById',
            'OwnerId'
    };
    private static final Set<String> UNAVAILABLE_FIELDSET_SYSTEM_FIELD_API_NAME = new Set<String>{
            'CreatedBy.Name',
            'LastModifiedBy.Name'
    };

    private static final String REFERENCE_FIELD_TYPE        = 'REFERENCE';
    private static final String BOOLEAN_FIELD_TYPE          = 'BOOLEAN';
    private static final String PICKLIST_FIELD_TYPE         = 'PICKLIST';
    private static final String MULTIPICKLIST_FIELD_TYPE    = 'MULTIPICKLIST';
    private static final String DOUBLE_FIELD_TYPE           = 'DOUBLE';
    private static final String DATETIME_FIELD_TYPE         = 'DATETIME';
    private static final String DATE_FIELD_TYPE             = 'DATE';
    private static final String STRING_FIELD_TYPE           = 'STRING';
    private static final String EMAIL_FIELD_TYPE            = 'EMAIL';
    private static final String PHONE_FIELD_TYPE            = 'PHONE';
    private static final String URL_FIELD_TYPE              = 'URL';
    private static final String TIME_FIELD_TYPE             = 'TIME';
    private static final String TEXTAREA_FIELD_TYPE         = 'TEXTAREA';

    private static final Set<String> AVAILABLE_FIELDSET_FIELD_TYPES = new Set<String>{
            DATETIME_FIELD_TYPE,
            DATE_FIELD_TYPE,
            DOUBLE_FIELD_TYPE,
            STRING_FIELD_TYPE,
            PICKLIST_FIELD_TYPE,
            BOOLEAN_FIELD_TYPE,
            EMAIL_FIELD_TYPE,
            PHONE_FIELD_TYPE,
            URL_FIELD_TYPE,
            TIME_FIELD_TYPE,
            REFERENCE_FIELD_TYPE,
            MULTIPICKLIST_FIELD_TYPE,
            TEXTAREA_FIELD_TYPE
    };

    private static final Map<String, String> SOBJECT_APINAME_TO_SE_SETTING_FS_NAME = new Map<String, String> {
    };

    public static List<ExtraFieldWrapper> getExtraFieldsInfo(Set<String> fields, Schema.DescribeSObjectResult objectDescribe) {
        Map<String,Schema.SObjectField> fieldsByApiName = objectDescribe.fields.getMap();
        List<ExtraFieldWrapper> result = new List<ExtraFieldWrapper>();
        Map<String, Boolean> mapFieldSetMembers = getMapIsRequiredInFieldSetByFieldApiNames(objectDescribe);

        for (String field : fields) {
            if(UNAVAILABLE_FIELDSET_SYSTEM_FIELD_API_NAME.contains(field)) continue;
            String                     fieldPath     = field.replace('__r.Name', '__c');
            ExtraFieldWrapper          fieldWrapper  = new ExtraFieldWrapper();
            Schema.DescribeFieldResult fieldDescribe = fieldsByApiName.get(fieldPath).getDescribe();

            fieldWrapper.apiName      = fieldDescribe.getName();
            fieldWrapper.isAccessible = fieldDescribe.isAccessible();
            fieldWrapper.isCreateable = fieldDescribe.isCreateable();
            fieldWrapper.isUpdateable = fieldDescribe.isUpdateable();
            fieldWrapper.isRequired   = checkIsRequired(fieldDescribe, mapFieldSetMembers, fieldPath);
            fieldWrapper.label        = fieldDescribe.getLabel();

            fieldWrapper.setType(fieldDescribe.getType().name());

            if (fieldWrapper.fieldTypeName == BOOLEAN_FIELD_TYPE) {
                fieldWrapper.checkBoxDefaultValue = (Boolean) fieldDescribe.getDefaultValue();
                fieldWrapper.valueBoolean = (Boolean) fieldDescribe.getDefaultValue();
            }
            if (fieldWrapper.fieldTypeName == PICKLIST_FIELD_TYPE) {
                fieldWrapper.setPickListOptions(fieldDescribe.getPicklistValues(), false);
            }
            if (fieldWrapper.fieldTypeName == MULTIPICKLIST_FIELD_TYPE) {
                fieldWrapper.setPickListOptions(fieldDescribe.getPicklistValues(), true);
            }
            if (fieldWrapper.fieldTypeName == DOUBLE_FIELD_TYPE) {
                fieldWrapper.numberScale = fieldDescribe.getScale();
                fieldWrapper.length      = fieldDescribe.getPrecision() - fieldDescribe.getScale();

                fieldWrapper.length      = fieldWrapper.length > 16 ? 16 : fieldWrapper.length;
            } else {
                fieldWrapper.length = fieldDescribe.getLength();
            }

            fieldWrapper.helpText = fieldDescribe.getInlineHelpText();

            fieldWrapper.setReferenceTo(fieldDescribe);

            result.add(fieldWrapper);
        }

        return result;
    }

    private static Map<String, Boolean> getMapIsRequiredInFieldSetByFieldApiNames(Schema.DescribeSObjectResult objectDescribe) {
        Map<String, Boolean> mapFieldSetMembers = new Map<String, Boolean>();
        String fieldSetName = getFieldSetName(SOBJECT_APINAME_TO_SE_SETTING_FS_NAME.get(objectDescribe.getName()));

        if (!String.isEmpty(fieldSetName)) {
            for (Schema.FieldSetMember fsm : objectDescribe.fieldSets.getMap().get(fieldSetName).getFields()) {
                mapFieldSetMembers.put(fsm.fieldPath, fsm.getRequired());
            }
        }
        return mapFieldSetMembers;
    }

    private static Boolean checkIsRequired( Schema.DescribeFieldResult fieldDescribe, Map<String, Boolean> mapFieldSetMembers, String fieldPath) {
        Boolean result = fieldDescribe.isCreateable() && !fieldDescribe.isNillable() && !fieldDescribe.isDefaultedOnCreate();

        if (!mapFieldSetMembers.isEmpty() && mapFieldSetMembers.get(fieldPath) != null) {
            result = result || mapFieldSetMembers.get(fieldPath);
        }

        return result;
    }

    public List<ExtraFieldWrapper> setExtraFields(SObject sObj, Set<String> extraFieldsList, Schema.DescribeSObjectResult objectDescribe) {
        List<ExtraFieldWrapper> fieldWrappers = new List<ExtraFieldWrapper>();

        if(!extraFieldsList.isEmpty()) {
            fieldWrappers = getExtraFieldsInfo(extraFieldsList, objectDescribe);

            for(ExtraFieldWrapper field: fieldWrappers) {

                if(field.fieldTypeName == REFERENCE_FIELD_TYPE) {
                    field.setValue(this.getReferenceSObjectValue(sObj, field));
                } else {
                    if (sObj.get(field.apiName) == null && field.fieldTypeName == BOOLEAN_FIELD_TYPE) {
                        field.setValue(field.checkBoxDefaultValue);
                    } else {
                        field.setValue(sObj.get(field.apiName));
                    }

                }
            }
        }
        return fieldWrappers;
    }

    public static void setExtraFieldsToObject(SObject sObj, List<ExtraFieldWrapper> extraFields) {
        if(extraFields != null) {
            for(ExtraFieldWrapper fieldMap: extraFields) {
                String fieldAPINAme = fieldMap.apiName;
                if(fieldMap.isCreateable && fieldMap.isUpdateable) {
                    sObj.put(fieldAPINAme, fieldMap.getValue());
                }
            }
        }
    }

    public static String getFieldSetName(String customSettingFieldName) {

        if(customSettingFieldName == Constants.SE_SETTING_FIELD_NAME_STAND_DELIVER_ASSING_COLUMNS_FS) {
            return SalesEnablementSettings.STAND_DELIVER_ASSIGN_COLUMNS_FIELD_SET_NAME;
        }
        if(customSettingFieldName == Constants.SE_SETTING_FIELD_NAME_STAND_DELIVER_ASSING_FILTERS_FS) {
            return SalesEnablementSettings.STAND_DELIVER_ASSIGN_FILTERS_FIELD_SET_NAME;
        }

        return '';
    }

    public static Set<String> getFieldAPINamesFromFieldset(Schema.FieldSet fieldSet ) {
        return getFieldAPINamesFromFieldset(fieldSet, AVAILABLE_FIELDSET_FIELD_TYPES.clone());
    }

    public static Set<String> getFieldAPINamesFromFieldset(Schema.FieldSet fieldSet, Set<String> availableFieldTypes) {
        final String FIELD_PATH_END_LONGITUDE = 'Longitude__s';
        final String FIELD_PATH_END_LATITUDE = 'Latitude__s';

        Set<String> unavailableFieldAPIName  = UNAVAILABLE_FIELDSET_FIELD_API_NAME.clone();
        Set<String> extraFields              = new Set<String>();
        if (fieldSet != null) {
            for (Schema.FieldSetMember f : fieldSet.getFields()) {
                String fieldType = String.valueOf(f.getType());
                String fieldPath = String.valueOf(f.getFieldPath());

                if(availableFieldTypes.contains(fieldType) && !fieldPath.contains('.') && !fieldPath.contains(FIELD_PATH_END_LONGITUDE) && !fieldPath.contains(FIELD_PATH_END_LATITUDE)) {
                    extraFields.add(getFieldPath(f));
                    if(unavailableFieldAPIName.contains(fieldPath)) {
                        extraFields.addAll(UNAVAILABLE_FIELDSET_SYSTEM_FIELD_API_NAME);
                    }
                }
            }
        }

        return extraFields;
    }

    public SObject getReferenceSObjectValue(SObject sObj, ExtraFieldWrapper field) {
        SObject value;

        if(field.fieldTypeName == REFERENCE_FIELD_TYPE && !UNAVAILABLE_FIELDSET_FIELD_API_NAME.contains(field.apiName)) {
            value = sObj.getSObject(field.apiName.replace('__c', '__r'));
        } else {
            value = sObj.getSObject(field.apiName.replace('Id', ''));
        }

        return value;
    }

    private static String getFieldPath(Schema.FieldSetMember field) {

        String fieldPath = String.valueOf(field.getFieldPath());
        String fieldType = String.valueOf(field.getType());

        if(fieldType == REFERENCE_FIELD_TYPE) {
            fieldPath = fieldPath.replace('__c', '__r.Name');
        }

        return fieldPath;
    }

    public with sharing class ExtraFieldWrapper  {
        @AuraEnabled public String  name;
        @AuraEnabled public String  apiName;
        @AuraEnabled public String  label;
        @AuraEnabled public String  fieldTypeName;
        @AuraEnabled public Boolean isCreateable = false;
        @AuraEnabled public Boolean isAccessible = false;
        @AuraEnabled public Boolean isUpdateable = false;
        @AuraEnabled public Boolean isRequired   = false;
        @AuraEnabled public Integer length;         // the maximum size of the field. For the Doudle - maximum acceptable number of digits to the left of the decimal point
        @AuraEnabled public Integer numberScale;    // maximum acceptable number of digits to the right of the decimal point
        @AuraEnabled public String  helpText;
        @AuraEnabled public Boolean checkBoxDefaultValue;
        @AuraEnabled public List<PicklistOptionWrapper>  picklistOptions;
        @AuraEnabled public String  referenceTo;
        @AuraEnabled public String  relationshipName;

        @AuraEnabled public Datetime valueDatetime;
        @AuraEnabled public Date     valueDate;
        @AuraEnabled public Double   valueDouble;
        @AuraEnabled public String   valueString;
        @AuraEnabled public String   valuePicklist;
        @AuraEnabled public Boolean  valueBoolean;
        @AuraEnabled public String   valueEmail;
        @AuraEnabled public String   valuePhone;
        @AuraEnabled public String   valueURL;
        @AuraEnabled public String   valueTime;
        @AuraEnabled public String   valueRefId;
        @AuraEnabled public String   valueRefName;
		@AuraEnabled public String   valueTextArea;
		@AuraEnabled public String   valueMultiPicklist;

        @AuraEnabled public Boolean isDatetime;
        @AuraEnabled public Boolean isDate;
        @AuraEnabled public Boolean isDouble;
        @AuraEnabled public Boolean isString;
        @AuraEnabled public Boolean isPicklist;
        @AuraEnabled public Boolean isBoolean;
        @AuraEnabled public Boolean isEmail;
        @AuraEnabled public Boolean isPhone;
        @AuraEnabled public Boolean isURL;
        @AuraEnabled public Boolean isTime;
        @AuraEnabled public Boolean isReference;
        @AuraEnabled public Boolean isMultiPicklist;

        public ExtraFieldWrapper() {

        }

        public void setType(String fieldType) {
            this.fieldTypeName = fieldType;

            if(this.fieldTypeName == REFERENCE_FIELD_TYPE) {
                this.isReference = true;
            } else if (this.fieldTypeName == DATETIME_FIELD_TYPE) {
                this.isDatetime = true;
            } else if(this.fieldTypeName == DATE_FIELD_TYPE) {
                this.isDate = true;
            } else if(this.fieldTypeName == DOUBLE_FIELD_TYPE) {
                this.isDouble = true;
            } else if(this.fieldTypeName == STRING_FIELD_TYPE) {
                this.isString = true;
            } else if(this.fieldTypeName == PICKLIST_FIELD_TYPE) {
                this.isPicklist = true;
            } else if(this.fieldTypeName == BOOLEAN_FIELD_TYPE) {
                this.isBoolean = true;
                this.valueBoolean = null;
            } else if(this.fieldTypeName == EMAIL_FIELD_TYPE) {
                this.isEmail = true;
            } else if(this.fieldTypeName == PHONE_FIELD_TYPE) {
                this.isPhone = true;
            } else if(this.fieldTypeName == URL_FIELD_TYPE) {
                this.isURL = true;
            } else if(this.fieldTypeName == TIME_FIELD_TYPE) {
                this.isTime = true;
            } else if(this.fieldTypeName == MULTIPICKLIST_FIELD_TYPE) {
                this.isMultiPicklist = true;
            }
        }

        public void setValue(Object value) {

            if(this.fieldTypeName == DATETIME_FIELD_TYPE) {
                this.valueDatetime = Datetime.valueOf(value);
            } else if(this.fieldTypeName == DATE_FIELD_TYPE) {
                this.valueDate = Date.valueOf(value);
            } else if(this.fieldTypeName == DOUBLE_FIELD_TYPE) {
                this.valueDouble = Double.valueOf(value);
            } else if(this.fieldTypeName == STRING_FIELD_TYPE) {
                this.valueString = String.valueOf(value);
            } else if(this.fieldTypeName == PICKLIST_FIELD_TYPE) {
                this.setPicklistValue(value);
            } else if(this.fieldTypeName == BOOLEAN_FIELD_TYPE && value != null) {
                this.valueBoolean = Boolean.valueOf(value);
            } else if(this.fieldTypeName == EMAIL_FIELD_TYPE) {
                this.valueEmail = String.valueOf(value);
            } else if(this.fieldTypeName == PHONE_FIELD_TYPE) {
                this.valuePhone = String.valueOf(value);
            } else if(this.fieldTypeName == URL_FIELD_TYPE) {
                this.valueURL = String.valueOf(value);
            } else if(this.fieldTypeName == TIME_FIELD_TYPE) {
                this.setTimeValue(value);
            } else if(this.fieldTypeName == TEXTAREA_FIELD_TYPE) {
                this.valueTextArea = String.valueOf(value);
            } else if(this.fieldTypeName == MULTIPICKLIST_FIELD_TYPE) {
                this.valueMultiPicklist = String.valueOf(value);
            }
        }

        public void setValue(SObject value) {

            if(this.fieldTypeName == REFERENCE_FIELD_TYPE && value != null) {
                this.valueRefId = String.valueOf(value.get('Id'));
                this.valueRefName = String.valueOf(value.get('Name'));
                this.isReference = true;
            }
        }

        public Object getValue() {
            Object value = null;

            if(this.fieldTypeName == DATETIME_FIELD_TYPE) {
                value = this.valueDatetime;
            } else if(this.fieldTypeName == DATE_FIELD_TYPE) {
                value = this.valueDate;
            } else if(this.fieldTypeName == DOUBLE_FIELD_TYPE) {
                value = this.valueDouble;
            } else if(this.fieldTypeName == STRING_FIELD_TYPE) {
                value = this.valueString;
            } else if(this.fieldTypeName == PICKLIST_FIELD_TYPE) {
                value = this.getPicklistValue();
            } else if(this.fieldTypeName == BOOLEAN_FIELD_TYPE) {
                value = this.valueBoolean == null ? this.checkBoxDefaultValue : this.valueBoolean;
            } else if(this.fieldTypeName == EMAIL_FIELD_TYPE) {
                value = this.valueEmail;
            } else if(this.fieldTypeName == PHONE_FIELD_TYPE) {
                value = this.valuePhone;
            } else if(this.fieldTypeName == URL_FIELD_TYPE) {
                value = this.valueURL;
            } else if(this.fieldTypeName == TIME_FIELD_TYPE) {
                value = getTimeValue();
            } else if(this.fieldTypeName == REFERENCE_FIELD_TYPE) {
                value = this.valueRefId;
            } else if(this.fieldTypeName == TEXTAREA_FIELD_TYPE) {
                value = this.valueTextArea;
            } else if(this.fieldTypeName == MULTIPICKLIST_FIELD_TYPE) {
                value = this.valueMultiPicklist;
            }

            return value;
        }

        public void setReferenceTo(Schema.DescribeFieldResult field) {
            List<Schema.SObjectType> types = field.getReferenceTo();
            if(types.size() > 0) {
                this.referenceTo = String.valueOf(types.get(0));
            }

            this.relationshipName = field.getRelationshipName();
        }

        public void setPickListOptions(List<Schema.PicklistEntry> picklistEntries, boolean isMultiPicklist) {
            if(picklistEntries != null && !picklistEntries.isEmpty()) {
                this.picklistOptions = new List<PicklistOptionWrapper>();

                for(Schema.PicklistEntry ple: picklistEntries) {
                    PicklistOptionWrapper option = new PicklistOptionWrapper(ple);

                    if (option.isActive) this.picklistOptions.add(option);
                    if (option.isDefault) this.valuePicklist = option.value;
                }

                if(!isMultiPicklist) {
                    this.picklistOptions.add(0, new PicklistOptionWrapper(System.Label.None_Option, '', true, false));
                }
            }
        }

        private void setPicklistValue(Object value) {
            if(value == null) {
                this.valuePicklist = '';
            } else {
                this.valuePicklist = String.valueOf(value);
            }
        }
        private void setTimeValue(Object value) {
            if(value == null) {
                this.valueTime = null;
            } else {
                this.valueTime = String.valueOf(value);
            }
        }
        private Time getTimeValue() {
            Time t;

            if(!String.isEmpty(this.valueTime)) {
                List<String> timeStringInstances = this.valueTime.replace('Z', '').split(':');
                List<String> secondAndMillisecond = timeStringInstances[2].split('\\.');
                Integer hour = Integer.valueOf(timeStringInstances[0]);
                Integer minute = Integer.valueOf(timeStringInstances[1]);
                Integer second = Integer.valueOf(secondAndMillisecond[0]);
                Integer millisecond = Integer.valueOf(secondAndMillisecond[1]);

                t = Time.newInstance(hour, minute, second, millisecond);
            }


            return t;
        }
        private Object getPicklistValue() {
            Object value = null;
            value = this.valuePicklist;

            return value;
        }
    }

    public with sharing class PicklistOptionWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public Boolean isDefault;

        public Boolean isActive;

        public PicklistOptionWrapper() {

        }

        public PicklistOptionWrapper(String label, String value, Boolean isActive, Boolean isDefault) {
            this.label = label;
            this.value = value;
            this.isActive = isActive;
            this.isDefault = isDefault;
        }

        public PicklistOptionWrapper(Schema.PicklistEntry option) {
            this.label = option.getLabel();
            this.value = option.getValue();
            this.isActive = option.isActive();
            this.isDefault = option.isDefaultValue();
        }
    }
}