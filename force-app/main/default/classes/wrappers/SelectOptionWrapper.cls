public inherited sharing class SelectOptionWrapper {
    @AuraEnabled public String value;
    @AuraEnabled public String label;

    public SelectOptionWrapper() {

    }

    public SelectOptionWrapper (Id value, String label) {
        this.value = (String) value;
        this.label = label;
    }

    public SelectOptionWrapper (String value, String label) {
        this.value = value;
        this.label = label;
    }
}
