import AWS from "aws-sdk";
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
export const main = async (event) => {
  try {
    const { SiteSettings } = await connectToDatabase();
    const result = await SiteSettings.findAll();
    console.log(result[0].contact_us_email_address);
    const requestBody = JSON.parse(event.body);
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
      const sendresult = await ses.sendEmail(params).promise();
      console.log(sendresult);
      return success({ message: "Success" });
    } else {
      return failure({ message: "Receiving email address is not defined" });
    }
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
