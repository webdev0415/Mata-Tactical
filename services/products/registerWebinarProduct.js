// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";
export const main = async (event) => {
  try {
    const { WebinarProduct } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    const webinar = await WebinarProduct.create({
      name: requestBody.name,
      price_per_seats: requestBody.price_per_seats,
      seats: requestBody.seats,
      product_status: requestBody.product_status,
      imageUrl: requestBody.imageUrl,
      remainingSeats: requestBody.seats,
    });
    const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
    const params = {
      FunctionName:
        process.env.SERVICE_NAME +
        "-" +
        process.env.STAGE +
        "-" +
        "createtopic",
      InvocationType: "Event",
      Payload: JSON.stringify({ id: webinar.id }),
    };
    await lambda.invoke(params).promise();
    const notification_params = {
      FunctionName:
        process.env.SERVICE_NAME +
        "-" +
        process.env.STAGE +
        "-" +
        "registernotification",
      InvocationType: "Event",
      Payload: JSON.stringify({
        id: webinar.id,
        product_type: "webinar",
        service_type: "new_product",
        product_name: webinar.name,
        product_image: webinar.imageUrl,
      }),
    };
    await lambda.invoke(notification_params).promise();
    const newparams = {
      FunctionName:
        process.env.SERVICE_NAME +
        "-" +
        process.env.STAGE +
        "-" +
        "publishnewproductmessage",
      InvocationType: "Event",
      Payload: JSON.stringify({
        id: webinar.id,
        product_type: "webinar",
        service_type: "new_product",
        product_name: webinar.name,
      }),
    };
    const result2 = await lambda.invoke(newparams).promise();
    console.log(result2);
    const emailparams = {
      FunctionName:
        process.env.SERVICE_NAME + "-" + process.env.STAGE + "-" + "sendemails",
      InvocationType: "Event",
      Payload: JSON.stringify({
        id: webinar.id,
        product_type: "webinar",
        service_type: "new_product",
        product_name: webinar.name,
      }),
    };
    await lambda.invoke(emailparams).promise();
    return success("success");
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
