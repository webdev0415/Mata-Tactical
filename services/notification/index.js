import { ModelsList } from "../../libs/db";
import { QueryTypes, Sequelize } from "sequelize";
import AWS from "aws-sdk";
const {
  sequelize,
  NotificationState,
  WebinarProductDetail,
  ConsumerUser,
  NotificationList,
} = ModelsList;
export default class NotificationService {
  static async createNotification(event) {
    try {
      const {
        id,
        product_type,
        service_type,
        product_image,
        product_name,
        webinar_link,
      } = event;
      const resultList = await NotificationList.create({
        product_id: id,
        product_type,
        service_type,
        product_image,
        product_name,
        webinar_link,
      });
      let inputFields = [];
      switch (service_type) {
        case "new_product":
          const userIDs = await ConsumerUser.findAll({ attributes: ["id"] });
          inputFields = await userIDs.map((userID) => {
            let user = {};
            user.user_id = userID.id;
            user.notification_status = "created";
            user.notification_id = resultList.id;
            return user;
          });
          break;
        case "webinar_start":
          const purchased_user_ids = await WebinarProductDetail.findAll(
            {
              attributes: [
                [Sequelize.fn("DISTINCT", Sequelize.col("user_id")), "user_id"],
              ],
              where: { webinar_id: id, seat_status: "taken" }
            },
          );
          console.log(purchased_user_ids);
          inputFields = purchased_user_ids.map((userID) => {
            let user = {};
            user.user_id = userID.user_id;
            user.notification_status = "created";
            user.notification_id = resultList.id;
            return user;
          });
          break;
        default:
          throw new Error("You should input the correct type!");
      }
      console.log(inputFields);
      await NotificationState.bulkCreate(inputFields);
      return { status: "success" };
    } catch (err) {
      return { status: "failed", message: err.message };
    }
  }
  static async sendEmails(event) {
    // try {
      const {
        id,
        product_type,
        service_type = null,
        product_name,
        webinar_link,
      } = event;
      const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
      const emailparams = {
        FunctionName: process.env.SERVICE_NAME + "-" + process.env.STAGE + "-" + "sendemails",
        InvocationType: "Event",
        Payload: JSON.stringify({
            id,
            product_type,
            service_type,
            product_name,
            webinar_link,
        }),
    };
    await lambda.invoke(emailparams).promise();
    //   var ses = new AWS.SES({ region: "us-east-1" });
    //   let rows;
    //   let message = "";
    //   switch (service_type) {
    //     case "new_product":
    //       if (product_type === "physical") {
    //         message = `New Physical Product ${product_name} is added. You can view the product details at ${process.env.FRONTEND_URL}/products/physical/${id}`;
    //       } else if (product_type === "webinar") {
    //         message = `New Webinar ${product_name} is added. You can view the product details at ${process.env.FRONTEND_URL}/products/webinar/${id}`;
    //       }
    //       rows = await ConsumerUser.findAll({
    //         attributes: ["email"],
    //         where: {
    //           is_verified: true,
    //           [Op.or]: [
    //             { notify_products: "email" },
    //             { notify_products: "email and phone" },
    //           ],
    //         },
    //       });
    //       break;
    //     case "webinar_start":
    //       if (product_type === "webinar") {
    //         message = `Webinar ${product_name} is started. You can view the webinar at ${webinar_link}`;
    //       } else {
    //         throw new Error({ message: "Product type should be webinar" });
    //       }
    //       const subscribers = await WebinarProductDetail.findAll(
    //         {
    //           attributes: [
    //             [Sequelize.fn("DISTINCT", Sequelize.col("user_id")), "user_id"],
    //           ],
    //         },
    //         {
    //           where: {
    //             webinar_id: id,
    //             seat_status: "taken",
    //           },
    //         }
    //       );
    //       rows = await ConsumerUser.findAll({
    //         attributes: ["email"],
    //         where: {
    //           id: subscribers.map((subscriber) => subscriber.user_id),
    //           is_verified: true,
    //           [Op.or]: [
    //             { notify_products: "email" },
    //             { notify_products: "email and phone" },
    //           ],
    //         },
    //       });
    //       break;
    //   }
    //   await rows.map(async (row) => {
    //     var params = {
    //       Destination: {
    //         ToAddresses: [row.email],
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
  static async getNotification(event) {
    const userID = event.requestContext.authorizer.sub;
    const notification_lists = await sequelize.query(
      "SELECT `notification_states`.`id`, `notification_lists`.`product_id`,`notification_lists`.`service_type`,`notification_lists`.`product_type`,`notification_lists`.`webinar_link`,`notification_lists`.`product_name`,`notification_lists`.`product_image`,`notification_lists`.`createdAt` FROM notification_states INNER JOIN notification_lists ON `notification_states`.`notification_id` = `notification_lists`.`id` WHERE `notification_states`.`notification_status` = :status AND `notification_states`.`user_id`= :id ORDER BY `notification_states`.`createdAt` DESC",
      {
        type: QueryTypes.SELECT,
        replacements: { status: "created", id: userID },
      }
    );
    return { result: { message: notification_lists } };
  }
  static async readNotification(event) {
    const notification_id = event.params.id;
    await NotificationState.update(
      { notification_status: "read" },
      {
        where: {
          id: notification_id,
          user_id: event.requestContext.authorizer.sub,
        },
      }
    );
    return { result: { message: "success" } };
  }
}
