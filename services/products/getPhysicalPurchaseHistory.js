// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import { QueryTypes } from "sequelize";

export const main = async(event) => {
    try {
        const { sequelize } = await connectToDatabase();
        const requestBody = JSON.parse(event.body);
        const counts = await sequelize.query(
            'SELECT COUNT(*) AS count FROM (SELECT `physical_products`.`id` AS id,"physical" AS product_type, `physical_products`.`productName` AS product_name,`purchase_histories`.`createdAt` AS created_date,"" AS seat_number, `physical_products`.`pricePerItem` AS price FROM `purchase_histories` INNER JOIN `physical_products` ON `purchase_histories`.`productID`= `physical_products`.`id` WHERE `purchase_histories`.`product_type`= :product AND `physical_products`.`productName` LIKE :filterString AND `purchase_histories`.`userID` = :user_id  UNION ALL SELECT `webinar_product_details`.`id` AS id,"webinar" AS product_type,`webinar_products`.`name` as product_name,`webinar_product_details`.`createdAt` as date,  `webinar_product_details`.`seatNo` as seat_number,`webinar_products`.`price_per_seats` as price FROM `webinar_product_details`  INNER JOIN `webinar_products`   ON `webinar_products`.`id` = `webinar_product_details`.`webinar_id` WHERE `webinar_products`.`name` LIKE :filterString AND `webinar_product_details`.`user_id`=:user_id AND `webinar_product_details`.`seat_status`="taken" ORDER BY created_date DESC) AS histories', {
                type: QueryTypes.SELECT,
                replacements: {
                    product: "product",
                    filterString: `%${requestBody.filterString}%`,
                    user_id: event.requestContext.authorizer.claims.sub
                },
            }
        );
        const physicalresult = await sequelize.query(
            'SELECT `physical_products`.`id` AS id,"physical" AS product_type, `physical_products`.`productName` AS product_name,`purchase_histories`.`createdAt` AS created_date,"" AS seat_number, `physical_products`.`pricePerItem` AS price FROM `purchase_histories` INNER JOIN `physical_products` ON `purchase_histories`.`productID`= `physical_products`.`id` WHERE `purchase_histories`.`product_type`= :product AND `physical_products`.`productName` LIKE :filterString AND `purchase_histories`.`userID` = :user_id UNION ALL SELECT `webinar_product_details`.`id` AS id,"webinar" AS product_type,`webinar_products`.`name` as product_name,`webinar_product_details`.`createdAt` as date,  `webinar_product_details`.`seatNo` as seat_number,`webinar_products`.`price_per_seats` as price FROM `webinar_product_details`  INNER JOIN `webinar_products`   ON `webinar_products`.`id` = `webinar_product_details`.`webinar_id` WHERE `webinar_products`.`name` LIKE :filterString AND `webinar_product_details`.`seat_status`="taken" AND `webinar_product_details`.`user_id`=:user_id ORDER BY created_date DESC LIMIT :limit OFFSET :offset', {
                type: QueryTypes.SELECT,
                replacements: {
                    product: "product",
                    filterString: `%${requestBody.filterString}%`,
                    offset: (requestBody.pageNo - 1) * requestBody.limit,
                    limit: requestBody.limit,
                    user_id: event.requestContext.authorizer.claims.sub,
                },
            }
        );

        console.log(physicalresult);
        return success({ data: physicalresult, count: counts[0].count });
    } catch (err) {
        console.log(err.message);
        return failure({ message: err.message });
    }
};