import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const { SiteSettings } = await connectToDatabase();
    const result = await SiteSettings.findAll();
    if (result.length > 0) {
      return success({
        facebook_link: result[0].facebook_media_links ? result[0].facebook_media_links : "https://facebook.com" ,
        instagram_link: result[0].instagram_media_links ? result[0].instagram_media_links: "https://instagram.com",
      });
    } else {
      return failure({ message: "Not Found Social Media Links" });
    }
  } catch (err) {
    return failure({ message: err.message });
  }
};
