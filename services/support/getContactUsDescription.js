import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";

export const main = async (event) => {
  try {
    const { SiteSettings } = await connectToDatabase();
    const result = await SiteSettings.findAll();
    let description = "";
    if(result.length> 0)
    {
        description = result[0].contact_us_page_info;
    }
    return success({ data: description});
  } catch (err) {
    return failure({ message: err.message });
  }
};
