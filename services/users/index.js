import { ModelsList } from "../../libs/db";
import Str from "@supercharge/strings";
import AWS from "aws-sdk";
const { ConsumerUser, ActivityLog } = ModelsList;

export default class UserService {
  static async banUser(event) {
    await ConsumerUser.update(
      { comment_banned: event.body.comment_banned },
      { where: { id: event.body.user_id } }
    );
    return { result: { message: "success" } };
  }
  static async forgotPassword(event) {
    const ses = new AWS.SES({ region: "us-east-1" });
    const requestBody = event.body;
    const urlcode = Str.random(50);
    const user = await ConsumerUser.findOne({
      attributes: ["id"],
      where: {
        email: requestBody.email,
      },
    });
    if (!user) {
      throw new Error("User is not registered");
    }
    await ConsumerUser.update(
      { is_forget: true, forgot_link: urlcode },
      { where: { id: user.id } }
    );

    const app_url = event.body.is_admin
      ? process.env.FRONTEND_ADMIN_URL
      : process.env.FRONTEND_URL;
    var message = `You can click this link to reset your password. ${app_url}/resetpassword/${urlcode}/${user.id}`;
    var params = {
      Destination: {
        ToAddresses: [requestBody.email],
      },
      Message: {
        Body: {
          Text: { Data: message },
        },
        Subject: { Data: "Forgot Password Link" },
      },
      Source: process.env.CLIENT_EMAIL,
    };
    const result = await ses.sendEmail(params).promise();
    console.log(result);
    return { result: { message: "success" } };
  }

  static async getVerifiedStatus(event) {
    const user = await ConsumerUser.findOne({
      attributes: [
        "is_verified",
        "is_email_verified",
        "is_phone_verified",
        "verified_method",
        "phone_number",
      ],
      where: { email: event.params.email },
    });
    return { result: user };
  }

  static async login(event) {
    const user = await ConsumerUser.findOne({
      where: {
        id: event.requestContext.authorizer.sub,
      },
    });
    return { result: user };
  }
  static async validateForgetLink(event) {
    const requestBody = event.body;
    const user = await ConsumerUser.findOne({
      where: {
        id: event.body.id,
      },
    });
    if (!user) {
      throw new Error("User is not registered");
    }
    const result =
      user.is_forget && user.forgot_link === requestBody.forgot_link;
    if (result) {
      return { result: { message: "success" } };
    } else {
      throw new Error("The link is expired or wrong!");
    }
  }
  static async resetPassword(event) {
    const requestBody = event.body;
    const user = await ConsumerUser.findOne({
      where: {
        id: event.body.id,
      },
    });
    console.log(user);
    if (!user) {
      throw new Error("User is not registered");
    }
    const result =
      user.is_forget && user.forgot_link === requestBody.forgot_link;
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
      return { result: { message: "success" } };
    } else {
      throw new Error("Code paramter is not correct");
    }
  }

  static async setVerifiedStatus(event) {
    const requestBody = event.body;
    let updateJSON = {};
    if (requestBody.is_verified) {
      updateJSON.is_verified = requestBody.is_verified;
    }
    if (requestBody.is_email_verified) {
      updateJSON.is_email_verified = requestBody.is_email_verified;
    }
    if (requestBody.is_phone_verified) {
      updateJSON.is_phone_verified = requestBody.is_phone_verified;
    }
    if (requestBody.verified_method) {
      updateJSON.verified_method = requestBody.verified_method;
    }
    await ConsumerUser.update(updateJSON, {
      where: { email: event.params.email },
    });
    return { result: { message: "success" } };
  }

  static async signout(event) {
    await ActivityLog.update(
      { logged_out_time: new Date() },
      { where: { email: event.body.email, logged_out_time: null } }
    );
    return {result:{ message: "success" }};
  }

  static async signup(event) {
    const requestJSON = event.body;
    const user = await ConsumerUser.create(requestJSON);
    const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
    let filterPolicy = {};
    if (user.notify_products != "none" && user.notify_products != "email") {
      filterPolicy.newProducts = true;
    } else {
      filterPolicy.newProducts = false;
    }
    if (user.notify_webinar != "none" && user.notify_webinar != "email") {
      filterPolicy.webinarUpdate = true;
    } else {
      filterPolicy.webinarUpdate = false;
    }
    const params = {
      FunctionName:
        process.env.SERVICE_NAME +
        "-" +
        process.env.STAGE +
        "-" +
        "createsubscription",
      InvocationType: "Event",
      Payload: JSON.stringify({
        phoneNumber: user.phone_number,
        filterPolicy,
        id: user.id,
        method: "physical",
      }),
    };
    await lambda.invoke(params).promise();
    return { result: { message: "success" } };
  }

  static async updateCurrentUser(event) {
    const authorizeUser = await ConsumerUser.findOne({
      where: { id: event.requestContext.authorizer.sub },
    });
    if (authorizeUser) {
      const requestBody = event.body;
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
      await ConsumerUser.update(requestBody, {
        where: { id: event.requestContext.authorizer.sub },
      });
      const user = await ConsumerUser.findOne({
        where: { id: event.requestContext.authorizer.sub },
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
          previousUser: authorizeUser,
          phoneNumber: user.phone_number,
        }),
      };
      await lambda.invoke(params).promise();
      return { result: { message: user } };
    } else {
      throw new Error("The user is not authorized");
    }
  }
  static async updateUserForAdmin(event) {
    const authorizeUser = await ConsumerUser.findOne({
      where: { id: event.params.id },
    });
    if (authorizeUser) {
      const requestBody = event.body;
      await ConsumerUser.update(requestBody, {
        where: { id: event.params.id },
      });
      const user = await ConsumerUser.findOne({
        where: { id: event.params.id },
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
          previousUser: authorizeUser,
          phoneNumber: user.phone_number,
        }),
      };
      await lambda.invoke(params).promise();
      return { result: { message: user } };
    } else {
      throw new Error("The user is not authorized");
    }
  }
}
