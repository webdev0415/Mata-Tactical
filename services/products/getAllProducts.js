// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import { QueryTypes, Sequelize } from "sequelize";

export const main = async (event) => {
  const Op = Sequelize.Op;
  try {
    const {
      sequelize,
      PhysicalProduct,
      WebinarProduct,
    } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    let result = {};
    let count = 0;
    switch (requestBody.product_type) {
      case "webinar":
        result = await sequelize.query(
          'SELECT `webinar_products`.`id`,`webinar_products`.`name` AS product_name,`webinar_products`.`price_per_seats` AS product_price,`webinar_products`.`remainingSeats` AS product_count,`webinar_products`.`imageUrl` as product_image,"webinar" AS product_type,`webinar_products`.`createdAt` as created_date,`webinar_products`.`product_status` AS product_status FROM `webinar_products` WHERE product_status = "active" AND `webinar_products`.`remainingSeats` <> 0 ORDER BY created_date DESC LIMIT :limit OFFSET :offset ',
          {
            type: QueryTypes.SELECT,
            replacements: {
              limit: requestBody.limit,
              offset: requestBody.offset,
            },
          }
        );
        count = await WebinarProduct.count({
          where: {
            remainingSeats: { [Op.not]: [0] },
            product_status: "active",
          },
        });
        break;
      case "physical":
        result = await sequelize.query(
          'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS product_count, `physical_products`.`imageUrl` AS product_image, "physical" AS product_type,`physical_products`.`createdAt` as created_date,`physical_products`.`product_status` AS product_status FROM `physical_products` WHERE product_status = "active" AND `physical_products`.`amount` <> 0 ORDER BY created_date DESC LIMIT :limit OFFSET :offset ',
          {
            type: QueryTypes.SELECT,
            replacements: {
              limit: requestBody.limit,
              offset: requestBody.offset,
            },
          }
        );
        count = await PhysicalProduct.count({
          where: { amount: { [Op.not]: [0] }, product_status: "active" },
        });
        break;
      default:
        result = await sequelize.query(
          'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS product_count, `physical_products`.`imageUrl` AS product_image, "physical" AS product_type,`physical_products`.`createdAt` as created_date,`physical_products`.`product_status` AS product_status FROM `physical_products` WHERE product_status = "active" AND `physical_products`.`amount` <> 0 UNION ALL SELECT `webinar_products`.`id`,`webinar_products`.`name`,`webinar_products`.`price_per_seats`,`webinar_products`.`remainingSeats`,`webinar_products`.`imageUrl`,"webinar" AS product_type,`webinar_products`.`createdAt`,`webinar_products`.`product_status` FROM `webinar_products` WHERE product_status = "active" AND `webinar_products`.`remainingSeats` <> 0 ORDER BY created_date DESC LIMIT :limit OFFSET :offset ',
          {
            type: QueryTypes.SELECT,
            replacements: {
              limit: requestBody.limit,
              offset: requestBody.offset,
            },
          }
        );
        const countPhysical = await PhysicalProduct.count({
          where: { amount: { [Op.not]: [0] }, product_status: "active" },
        });
        const countWebinar = await WebinarProduct.count({
          where: {
            remainingSeats: { [Op.not]: [0] },
            product_status: "active",
          },
        });
        count = countPhysical + countWebinar;
    }
    console.log(result);
    return success({ data: result, count: count });
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
