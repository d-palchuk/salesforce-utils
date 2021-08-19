public with sharing class TriggerDispatcher {

    public static void run(ITriggerHandler handler) {
        if (handler.isDisabled()) return;

        if (Trigger.isBefore ) {
            if (Trigger.isInsert) handler.processBeforeInsert(Trigger.new);
            if (Trigger.isUpdate) handler.processBeforeUpdate(Trigger.newMap, Trigger.oldMap);
            if (Trigger.isDelete) handler.processBeforeDelete(Trigger.oldMap);
        }

        if (Trigger.isAfter) {
            if (Trigger.isInsert  ) handler.processAfterInsert(Trigger.newMap);
            if (Trigger.isUpdate  ) handler.processAfterUpdate(Trigger.newMap, Trigger.oldMap);
            if (Trigger.isDelete  ) handler.processAfterDelete(Trigger.oldMap);
            if (Trigger.isUndelete) handler.processAfterUndelete(Trigger.newMap);
        }
    }
}