public inherited sharing class SelectOption {
    public class SelectOption {
        @AuraEnabled public String value;
        @AuraEnabled public String label;

        public SelectOption (String value, String label) {
            this.value = value;
            this.label = label;
        }
    }
}
