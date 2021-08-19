public interface ITriggerHandler {

    void enable();
    void disable();

    Boolean isDisabled();

    ITriggerHandler getInstance();

    void processBeforeInsert(List<SObject> newRecords);

    void processBeforeUpdate(Map<Id, SObject> newRecords, Map<Id, SObject> oldRecords);

    void processBeforeDelete(Map<Id, SObject> oldRecords);

    void processAfterInsert(Map<Id, SObject> newRecords);

    void processAfterUpdate(Map<Id, SObject> newRecords, Map<Id, SObject> oldRecords);

    void processAfterDelete(Map<Id, SObject> oldRecords);

    void processAfterUndelete(Map<Id, SObject> newRecords);
}