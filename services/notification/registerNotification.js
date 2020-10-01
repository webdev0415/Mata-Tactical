import { ModelsList } from "../../libs/db";
import { Sequelize } from "sequelize";
const {
  WebinarProductDetail,
  NotificationList,
  ConsumerUser,
  NotificationState,
} = ModelsList;
export const main = async (event) => {
  try {
    const resultList = await NotificationList.create({
      product_id: event.id,
      product_type: event.product_type,
      service_type: event.service_type,
      product_image: event.product_image,
      product_name: event.product_name,
    });
    let inputFields;
    switch (event.service_type) {
      case "new_product":
        const userIDs = await ConsumerUser.findAll({ attributes: ["id"] });
        inputFields = await userIDs.map((userID) => {
          let user = {};
          user.user_id = userID.id;
          user.notification_status = "created";
          user.notification_id = resultList.id;
          return user;
        });
        await NotificationState.bulkCreate(inputFields);
        break;
      case "sold_out":
        const purchased_user_ids = await WebinarProductDetail.findAll(
          {
            attributes: [
              [Sequelize.fn("DISTINCT", Sequelize.col("user_id")), "user_id"],
            ],
          },
          { where: { webinar_id: event.id, seat_status: "taken" } }
        );
        inputFields = await purchased_user_ids.map((userID) => {
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
    await NotificationState.bulkCreate(inputFields);
    return { status: "success" };
  } catch (err) {
    console.log(err);
    return { message: err.message, status: "failed" };
  }
};
