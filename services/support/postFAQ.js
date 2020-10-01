import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const { FAQList } = await connectToDatabase();
    const result = await FAQList.create(JSON.parse(event.body));
    return success({ data: result });
  } catch (err) {
    return failure({ message: err.message });
  }
};
