import { ModelsList } from "../../libs/db";
import ProductService from "../products";
import AWS from "aws-sdk";
const { SiteSettings } = ModelsList;

export default class SiteSettingService {
  static async getAllSiteSettings(event) {
    const result = await SiteSettings.findAll();
    let description = "";
    if (result.length > 0) {
      description = result[0];
    }
    return { result: { data: description } };
  }

  static async updateSiteSettings(event) {
    const result = await SiteSettings.findAll();
    if (result.length > 0) {
      await SiteSettings.update(event.body, {
        where: { id: result[0].id },
      });
    } else {
      await SiteSettings.create(event.body);
    }
    if (event.body.queued_webinar_limit) {
      await ProductService.releaseQueue();
    }
    return { result: { message: "success" } };
  }

  static async getContactUsDescription(event) {
    const result = await SiteSettings.findAll();
    let description = "";
    if (result.length > 0) {
      description = result[0].contact_us_page_info;
    }
    return { result: { data: description } };
  }

  static async getSocialMediaLinks(event) {
    const result = await SiteSettings.findAll();
    if (result.length > 0) {
      return {
        result: {
          facebook_link: result[0].facebook_media_links
            ? result[0].facebook_media_links
            : "https://facebook.com",
          instagram_link: result[0].instagram_media_links
            ? result[0].instagram_media_links
            : "https://instagram.com",
        },
      };
    } else {
      throw new Error("Not Found Social Media Links");
    }
  }

  static async contactSupport(event) {
    const result = await SiteSettings.findAll();
    const requestBody = event.body;
    if (result.length > 0) {
      var ses = new AWS.SES({ region: "us-east-1" });
      var params = {
        Destination: {
          ToAddresses: [result[0].contact_us_email_address],
        },
        Message: {
          Body: {
            Html: {
              Data: `<html>
                    <body>
                    <div class="emailwrapper">
                        <div class="main">
                            <div class="content">
                                <h2>This is message from a consumer</h2>
                                <div style="padding:20px;">
                                    <div>Consumer Detail</div>
                                    <div>First Name: ${requestBody.firstName} </div>
                                    <div>Last Name: ${requestBody.lastName} </div>
                                    <div>Email_Address: ${requestBody.email} </div>
                                    <div>Phone: ${requestBody.phone} </div>
                                    <div>Message: ${requestBody.message} </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </body>
                    </html>`,
            },
          },
          Subject: { Data: "Contact Us" },
        },
        Source: process.env.CLIENT_EMAIL,
      };
      await ses.sendEmail(params).promise();
      return { result: { message: "Success" } };
    }
  }
}
