// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
import AWS from "aws-sdk";
export const main = async (event) => {
  try {
    const { ConsumerUser } = await connectToDatabase();
    const authorizeUser = await ConsumerUser.findOne({
      where: { id: event.requestContext.authorizer.claims.sub },
    });
    if (
      authorizeUser &&
      ((authorizeUser.user_role === "consumer" &&
        authorizeUser.id === event.pathParameters.id) ||
        authorizeUser.user_role === "admin")
    ) {
      const previouuser = await ConsumerUser.findOne({
        where: { id: event.pathParameters.id },
      });
      const requestBody = JSON.parse(event.body);
      if (authorizeUser.user_role === "consumer") {
        delete requestBody.is_verified;
        delete requestBody.is_email_verified;
        delete requestBody.is_phone_verified;
        delete requestBody.verified_method;
        delete requestBody.auth_banned;
        delete requestBody.comment_banned;
        delete requestBody.user_role;
        delete requestBody.forgot_link;
        delete requestBody.is_forget;
      }
      await ConsumerUser.update(JSON.parse(event.body), {
        where: { id: event.pathParameters.id },
      });
      const user = await ConsumerUser.findOne({
        where: { id: event.pathParameters.id },
      });

      const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
      let filterPolicy = {};
      user.notify_products != "none" && user.notify_products != "email"
        ? (filterPolicy.newProducts = true)
        : (filterPolicy.newProducts = false);
      user.notify_webinar != "none" && user.notify_webinar != "email"
        ? (filterPolicy.webinarUpdate = true)
        : (filterPolicy.webinarUpdate = false);
      const params = {
        FunctionName:
          process.env.SERVICE_NAME +
          "-" +
          process.env.STAGE +
          "-" +
          "changesubscription",
        InvocationType: "Event",
        Payload: JSON.stringify({
          id: user.id,
          filterPolicy,
          previousUser: previouuser,
          phoneNumber: user.phone_number,
        }),
      };
      await lambda.invoke(params).promise();
      return success({ message: user });
    } else {
      throw { message: "The user is not authorized" };
    }
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
