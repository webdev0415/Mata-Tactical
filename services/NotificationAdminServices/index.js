import { ModelsList } from "../../libs/db";
const { NotificationAdmin } = ModelsList;
const AWS = require("aws-sdk");

export default class NotificationAdminServices {
  static async addNotify({
    product_type,
    product_name,
    product_image,
    service_type,
    webinar_link = null,
    prize_item_name = null,
  }) {
    const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
      region: "us-east-1",
    });

    const { Users } = await cognitoProvider
      .listUsersInGroup({
        UserPoolId: process.env.USER_POOL_ID,
        GroupName: "admingroup",
      })
      .promise();

    const data = await NotificationAdmin.bulkCreate(
      Users.map((user) => ({
        user_id: user.Username,
        product_type,
        status: "new",
        service_type,
        product_name,
        product_image,
        prize_item_name,
      }))
    );
    return { result: data };
  }
  static async sendEmails({ product_type, service_type, product_name, sold_out_product_name = null }) {
    console.log(product_type,service_type,product_name,sold_out_product_name);
    const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
    const emailparams = {
      FunctionName: process.env.SERVICE_NAME + "-" + process.env.STAGE + "-" + "sendemails",
      InvocationType: "Event",
      Payload: JSON.stringify({
          product_type,
          service_type,
          product_name,
          sold_out_product_name,
      }),
  };
  await lambda.invoke(emailparams).promise();
    // try {
    //   console.log(service_type);
    //   var ses = new AWS.SES({ region: "us-east-1" });
    //   let message = "";
    //   switch (service_type) {
    //     case "sold_out":
    //       if (product_type === "webinar") {
    //         message = `Webinar ${product_name} is sold out`;
    //       } else {
    //         throw new Error({ message: "Product type should be webinar" });
    //       }
    //       break;
    //   }
    //   const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
    //     region: "us-east-1",
    //   });
    //   const { Users } = await cognitoProvider
    //     .listUsersInGroup({
    //       UserPoolId: process.env.USER_POOL_ID,
    //       GroupName: "admingroup",
    //     })
    //     .promise();
    //   await Users.map(async (row) => {
    //     const email = await row.Attributes.find(
    //       (attribute) => attribute.Name === "email"
    //     );
    //     var params = {
    //       Destination: {
    //         ToAddresses: [email.Value],
    //       },
    //       Message: {
    //         Body: {
    //           Text: { Data: message },
    //         },
    //         Subject: { Data: "Test Email" },
    //       },
    //       Source: process.env.CLIENT_EMAIL,
    //     };
    //     const result = await ses.sendEmail(params).promise();
    //     console.log(result);
    //   });
    //   return { status: "success" };
    // } catch (err) {
    //   return { status: "failed", message: err.message };
    // }
  }
  static async getNotifications(req) {
    const user_id = req.requestContext.authorizer.sub;
    const data = await NotificationAdmin.findAll({
      where: { user_id, status: "new" },
      order: [["createdAt","DESC"]],
    });
    return { result: data };
  }

  static async readNotifications({ params: { id } }) {
    await NotificationAdmin.update({ status: "read" }, { where: { id } });
    return { result: "Success" };
  }
}
