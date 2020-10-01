import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    // console.log(event.requestContext.authorizer.claims);
    console.log(event.requestContext.authorizer);
    console.log(event.requestContext.authorizer.claims);
    const { FAQList } = await connectToDatabase();
    const result = await FAQList.findAll();
    return success({ data: result });
  } catch (err) {
    return failure({ message: err.message });
  }
};
