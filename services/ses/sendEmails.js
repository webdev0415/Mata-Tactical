import AWS from "aws-sdk";
import { ModelsList } from "../../libs/db";
const {
  ConsumerUser,
  WebinarProductDetail,
  PromoCode,
  GiftCard,
  WebinarProduct,
} = ModelsList;
import { Op, Sequelize } from "sequelize";
import { Winners } from "../../models";

export async function getAdminEmails() {
  return new AWS.CognitoIdentityServiceProvider({ region: process.env.REGION })
    .listUsersInGroup({
      UserPoolId: process.env.USER_POOL_ID,
      GroupName: "admingroup",
    })
    .promise()
    .then(({ Users }) =>
      Users.map(({ Attributes }) =>
        Attributes.find(({ Name }) => Name === "email")
      )
    );
}

export const main = async (event) => {
  try {
    const {
      id = null,
      product_type,
      service_type,
      product_name,
      sold_out_product_name,
      webinar_link,
    } = event;
    var ses = new AWS.SES({ region: process.env.REGION });
    let rows;
    console.log(product_type,service_type,product_name, sold_out_product_name);
    let message = "";
    let subject_name = "";
    switch (service_type) {
      case "new_product":
        if (product_type === "physical") {
          message = `New Physical Product ${product_name} is added. You can view the product details at ${process.env.FRONTEND_URL}/products/physical/${id}`;
        } else if (product_type === "webinar") {
          message = `New Webinar ${product_name} is added. You can view the product details at ${process.env.FRONTEND_URL}/products/webinar/${id}`;
        }
        rows = await ConsumerUser.findAll({
          attributes: ["email"],
          where: {
            is_verified: true,
            [Op.or]: [
              { notify_products: "email" },
              { notify_products: "email and phone" },
            ],
          },
        });
        subject_name = product_name;
        break;
      case "promo_code_sold_out":
        rows = await ConsumerUser.findAll({
          attributes: ["email"],
          where: {
            is_verified: true,
            user_role: "admin",
          },
        });
        subject_name = product_name;
        message = `The promo codes for the winners of webinar ${product_name} can't be generated because the webinar ${sold_out_product_name} is sold out`;
        console.log('-------promocode--',rows, message);
        break;
      case "webinar_start":
        if (product_type === "webinar") {
          message = `Webinar ${product_name} is started. You can view the webinar at ${webinar_link}`;
        } else {
          throw new Error({ message: "Product type should be webinar" });
        }
        const subscribers = await WebinarProductDetail.findAll(
          {
            attributes: [
              [Sequelize.fn("DISTINCT", Sequelize.col("user_id")), "user_id"],
            ],
            where: {
              webinar_id: id,
              seat_status: "taken",
            },
          },
        );
        console.log(subscribers);
        rows = await ConsumerUser.findAll({
          attributes: ["email"],
          where: {
            id: subscribers.map((subscriber) => subscriber.user_id),
            is_verified: true,
            [Op.or]: [
              { notify_webinar: "email" },
              { notify_webinar: "email and phone" },
            ],
          },
        });
        break;
      case "sold_out":
        console.log("--------Sold_out---------------");
        if (product_type === "webinar") {
          message = `Webinar ${product_name} is sold out`;
        } else if (product_type === 'physical'){
          message = `Physical Product ${product_name} is sold out`;
        }
        rows = await getAdminEmails();
        console.log(rows);
        break;
      case "won":
        let name = null;
        let prefixBefore = null;
        let prefixAfter = null;
        const scope = [{ method: ["withProduct", ConsumerUser, "user_data"] }];
        switch (product_type) {
          case "gifts":
            name = "amount";
            prefixBefore = "gift card";
            prefixAfter = "$";
            scope.push({ method: ["withProduct", GiftCard, "gifts"] });
            break;
          case "seats":
            name = "id";
            prefixBefore = "promo code";
            prefixAfter = "";
            scope.push({ method: ["withProduct", PromoCode, "seats"] });
            break;
          case "webinar":
            name = "name";
            prefixBefore = "item";
            prefixAfter = "";
            scope.push({ method: ["withProduct", WebinarProduct, "webinar"] });
            break;
          default:
            throw new Error("You need send product_type");
        }
        const winners = await Winners.scope(...scope).findAll({
          where: {
            webinar_id: id,
          },
        });
        rows = winners.map((el) => ({
          email: el.user_data.email,
          message: `You won ${prefixBefore} ${el[product_type][name]} ${prefixAfter}`,
        }));
        break;
      case "unused_promo_code":
        message = `Some promo codes weren't applied to webinar "${product_name}". You can view the details at ${process.env.FRONTEND_URL}/product-management/completed-webinars`;
        rows = await getAdminEmails();
        break;
    }
    const promises = await rows.map((row) => {
      var params = {
        Destination: {
          ToAddresses: [row.email ? row.email : row.Value],
        },
        Message: {
          Body: {
            Text: { Data: message || row.message },
          },
          Subject: { Data:  subject_name || "Test Email" },
        },
        Source: process.env.CLIENT_EMAIL,
      };
      console.log('-------params--',params);
     return ses.sendEmail(params).promise();
    });
    await Promise.all(promises);
    return { status: "success" };
  } catch (err) {
    return { status: "failed", message: err.message };
  }
};
