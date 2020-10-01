// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
export const main = async (event) => {
  try {
    const { ConsumerUser } = await connectToDatabase();
    const user = await ConsumerUser.findOne({
      attributes: ["is_verified", "is_email_verified", "is_phone_verified","verified_method","phone_number"],
      where: { email: event.pathParameters.id },
    });
    return success(user);
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
