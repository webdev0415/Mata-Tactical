// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
export const main = async (event) => {
  try {
    const { ConsumerUser } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
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
      where: { email: event.pathParameters.id },
    });
    return success({message:"success"});
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
