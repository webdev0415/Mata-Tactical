import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";
export const main = async (event) => {
    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
    try{
    var params = {
        AuthFlow: "REFRESH_TOKEN_AUTH" /* required */,
        AuthParameters: {
          'REFRESH_TOKEN': JSON.parse(event.body).refresh_token,
          /* '<StringType>': ... */
        },
        ClientId : process.env.USER_POOL_CLIENT_ID,
      };
      const result = await cognitoidentityserviceprovider.initiateAuth(params).promise();
      return success(result);
    }
    catch(err)
    {
        return failure({message: err.message});
    }
};
