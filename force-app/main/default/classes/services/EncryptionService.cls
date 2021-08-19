public inherited sharing class EncryptionService {

    public static String encrypt(String originalString) {
        return String.isNotBlank(originalString)
            ? EncodingUtil.base64Encode(Crypto.encryptWithManagedIV('AES128', Constants.ENCRYPTION_KEY, Blob.valueOf(originalString)))
            : originalString;
    }
    public static String decrypt(String encryptedString) {
        return String.isNotBlank(encryptedString)
            ? Crypto.decryptWithManagedIV('AES128', Constants.ENCRYPTION_KEY, EncodingUtil.base64Decode(encryptedString)).toString()
            : encryptedString;
    }

    public static void encrypt(List<Encryptable> wrappers) {
        for (Encryptable wrapper : wrappers) {
            wrapper.encrypt();
        }
    }
    public static void decrypt(List<Encryptable> wrappers) {
        for (Encryptable wrapper : wrappers) {
            wrapper.decrypt();
        }
    }
}
