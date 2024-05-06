public with sharing class JWTGenerator {

    public static string generate() {
        String token = generateToken();
        
        return token;
    }

    private static String generateToken() {
        User currentUser = [
            SELECT Id, FirstName, LastName, Email 
            FROM User
            WHERE Id =: UserInfo.getUserId()
        ];
        
        return new JWT(currentUser).generateJWT();
    }

    public class JWT {
        public JWTPayload payload { get; set; }
        public JWTHeader header { get; set; }

        public JWT(User user) {
            this.payload = new JWTPayload(user);
            this.header = new JWTHeader('HS256','jwt');
        }

        public String generateJWT() {
            String header = JSON.serialize(this.header);
            String payload = JSON.serialize(this.payload).replace('userId', 'id');
            String key = 'USE_YOUR_OWN_PRIVATE_KEY';

            String jwt = base64URLencode(Blob.valueof(header)) + '.' + base64URLencode(Blob.valueof(payload));
            Blob signature = Crypto.generateMac('hmacSHA256', Blob.valueof(jwt), Blob.valueof(key));
            
            return jwt + '.' + base64URLencode(signature);
        }

        private String base64URLencode(Blob input){ 
            String output = encodingUtil.base64Encode(input);
            output = output.replace('+', '-');
            output = output.replace('/', '_');
            
            while ( output.endsWith('=')){
                output = output.subString(0, output.length() - 1);
            }

            return output;
        }
    }

    public class JWTPayload {
        public String email { get; set; }
        public String userId { get; set; }
        public String name { get; set; }
        public String iat { get; set; }

        public JWTPayload(User user) {
            this.email = user.Email;
            this.userId = user.Id;
            this.name = user.FirstName + ' ' + user.LastName;
            this.iat = String.valueOf((DateTime.now().getTime() / 1000) - 1);
        }
    }

    public class JWTHeader {
        public String alg { get; set; }
        public String typ { get; set; }

        public JWTHeader(String alg, String typ) {
            this.alg = alg;
            this.typ = typ;
        }
    }
}