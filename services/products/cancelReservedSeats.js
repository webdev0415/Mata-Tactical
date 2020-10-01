// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const { WebinarProductDetail } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    await WebinarProductDetail.destroy({
      where: {
        webinar_id: requestBody.webinar_id,
        user_id: event.requestContext.authorizer.claims.sub,
        seat_status: "reserved",
        },
    });
    return success({message: "success" });
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
