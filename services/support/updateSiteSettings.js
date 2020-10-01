import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const { SiteSettings } = await connectToDatabase();
    const result = await SiteSettings.findAll();
    if (result.length > 0) {
      await SiteSettings.update(JSON.parse(event.body), {
        where: { id: result[0].id },
      });
    } else {
      await SiteSettings.create(JSON.parse(event.body));
    }
    return success({ message: "success" });
  } catch (err) {
    return failure({ message: err.message });
  }
};
