// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const { PhysicalProduct, WebinarProduct } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    let result = {};
    if (requestBody.product_type && requestBody.product_type === "physical") {
      result = await PhysicalProduct.findOne({ where: { id: requestBody.id } });
    }
    if (requestBody.product_type === "webinar") {
      result = await WebinarProduct.findOne({ where: { id: requestBody.id } });
    }

    return success({ data: result});
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
