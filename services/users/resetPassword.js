
import connectToDatabase from "../../libs/db";
import AWS from "aws-sdk";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const { ConsumerUser } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    const user = await ConsumerUser.findOne({
      where: {
        id: JSON.parse(event.body).id,
      },
    });
    if (!user) {
      return failure({ message: "User is not registered" });
    }
    console.log(user);
    const result =
      user.is_forget && user.forgot_link === requestBody.forgot_link;
    console.log(result);
    if (result) {
      const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
      const params = {
        Password: requestBody.password /* required */,
        UserPoolId: process.env.USER_POOL_ID /* required */,
        Username: user.email /* required */,
        Permanent: true,
      };
      await cognitoidentityserviceprovider
        .adminSetUserPassword(params)
        .promise();
      await ConsumerUser.update(
        { is_forget: false, forgot_link: "" },
        { where: { id: user.id } }
      );
      return success({ message: "success" });
    } else {
      return failure({ message: "Code paramter is not correct" });
    }
  } catch (err) {
    return failure({ message: err.message });
  }
};
