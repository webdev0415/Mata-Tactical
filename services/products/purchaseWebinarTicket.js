// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";
import Sequelize from "sequelize";
import moment from "moment";
import NotificationAdminServices from "../NotificationAdminServices";
const Op = Sequelize.Op;
export const main = async (event) => {
  try {
    const { WebinarProductDetail, WebinarProduct } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    await WebinarProductDetail.destroy({
      where: {
        webinar_id: requestBody.webinar_id,
        seat_status: "reserved",
        reserved_time: {
          [Op.lt]: moment().subtract(5, "minutes").toDate(),
        },
      },
    });
    const reserved_seats = await WebinarProductDetail.findAll({
      where: {
        user_id: requestBody.user_id,
        seat_status: "reserved",
        webinar_id: requestBody.webinar_id,
      },
    });
    if (reserved_seats.length > 0) {
      let seatID = [];
      const promises = await reserved_seats.map(async (seat) => {
        await seatID.push(seat.id);
      });
      await Promise.all(promises);
      const webinar_product = await WebinarProduct.findOne({
        where: { id: requestBody.webinar_id },
      });
      const lambda = new AWS.Lambda({
        endpoint: process.env.INVOKE_ENDPOINT,
      });
      const params = {
        FunctionName:
          process.env.SERVICE_NAME +
          "-" +
          process.env.STAGE +
          "-" +
          "chargeCreditCard",
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          user_id: event.requestContext.authorizer.claims.sub,
          product_type: "webinar",
          productID: requestBody.webinar_id,
          seats_count: seatID.length,
          opaqueData: requestBody.opaqueData,
        }),
      };
      const paymentresult = await lambda.invoke(params).promise();
      if (JSON.parse(paymentresult.Payload).code === "1") {
        const update = {
          remainingSeats:
            webinar_product.remainingSeats - reserved_seats.length,
        };
        if (webinar_product.remainingSeats - reserved_seats.length === 0) {
          update.product_status = "soldout";
          console.log("webinar_product", webinar_product);
          await NotificationAdminServices.addNotify({
            service_type: "sold_out",
            product_type: "webinar",
            product_name: webinar_product.name,
            product_image: webinar_product.primary_image_id,
          });
        }
        await WebinarProduct.update(update, {
          where: { id: requestBody.webinar_id },
        });
        await WebinarProductDetail.update(
          { seat_status: "taken" },
          { where: { id: seatID } }
        );
        const params1 = {
          FunctionName:
            process.env.SERVICE_NAME +
            "-" +
            process.env.STAGE +
            "-" +
            "createsubscription",
          InvocationType: "Event",
          Payload: JSON.stringify({
            id: event.requestContext.authorizer.claims.sub,
            webinar_id: requestBody.webinar_id,
            method: "webinar",
          }),
        };
        await lambda.invoke(params1).promise();
        return success({ message: "success" });
      } else {
        return failure(JSON.parse(paymentresult.Payload));
      }
    } else {
      return failure({ message: "There are no reserved seats" });
    }
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
