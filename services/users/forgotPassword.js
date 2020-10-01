// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import Str from "@supercharge/strings";
import AWS from "aws-sdk";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const ses = new AWS.SES({ region: "us-east-1" });
    const { ConsumerUser } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    const urlcode = Str.random(50);
    const user = await ConsumerUser.findOne({
      attributes: ["id"],
      where: {
        email: JSON.parse(event.body).email,
      },
    });
    if (!user) {
      return failure({ message: "User is not registered" });
    }
    await ConsumerUser.update(
      { is_forget: true, forgot_link: urlcode },
      { where: { id: user.id } }
    );
    var message = `You can click this link to reset your password. ${process.env.FRONTEND_URL}/resetpassword/${urlcode}/${user.id}`;
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
    return success({ message: "success" });
  } catch (err) {
    return failure({ message: err.message });
  }
};
