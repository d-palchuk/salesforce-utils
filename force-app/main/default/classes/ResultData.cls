public virtual inherited sharing class ResultData {

    @AuraEnabled public String status  = Constants.STATUS_SUCCESS;
    @AuraEnabled public String message = '';
    @AuraEnabled public String data    = '';

    @AuraEnabled public String errorLog = '';

    public ResultData() {

    }
    public ResultData(Object data) {
        this.setData(data);
    }

    public void setData(Object data) {
        this.data = JSON.serialize(data);
    }


    public void setResultStatusAndMessage(String status, String message) {
        this.setResultStatusAndMessage(status, message, null);
    }
    public void setResultStatusAndMessage(String status, String message, Exception e) {
        this.status  = status;
        this.message = message;

        if (e != null) {
            this.errorLog = 'Error Type: ' + e.getTypeName() +
                            '\nError Message: ' + e.getMessage() +
                            '\nError Stack Trace: ' + e.getStackTraceString();
        }
    }
}
