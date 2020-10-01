// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import { QueryTypes } from "sequelize";

export const main = async(event) => {
    try {
        const { sequelize } = await connectToDatabase();
        const requestBody = JSON.parse(event.body);
        // const  filterString = requestBody;
        const count = await sequelize.query(
            "SELECT COUNT(*) AS count FROM `purchase_histories` INNER JOIN `webinar_products` ON `purchase_histories`.`productID`= `webinar_products`.`id` WHERE `purchase_histories`.`product_type`=:product AND `webinar_products`.`name` LIKE :filterString AND `purchase_histories`.`userID` = :user_id ORDER BY `purchase_histories`.`createdAt`", {
                type: QueryTypes.SELECT,
                replacements: {
                    product: "webinar",
                    filterString: `%${requestBody.filterString}%`,
                    offset: (requestBody.pageNo - 1) * requestBody.limit,
                    limit: requestBody.limit,
                    user_id: event.requestContext.authorizer.claims.sub
                },
            }
        );
        const webinarresult = await sequelize.query(
            "SELECT `purchase_histories`.`createdAt`,`purchase_histories`.`seatsNo`,`webinar_products`.`id`,`webinar_products`.`name`,`webinar_products`.`price_per_seats`,`webinar_products`.`imageUrl` FROM `purchase_histories` INNER JOIN `webinar_products` ON `purchase_histories`.`productID`= `webinar_products`.`id` WHERE `purchase_histories`.`product_type`=:product AND `webinar_products`.`name` LIKE :filterString AND `purchase_histories`.`userID` = :user_id ORDER BY `purchase_histories`.`createdAt` DESC LIMIT :limit OFFSET :offset", {
                type: QueryTypes.SELECT,
                replacements: {
                    product: "webinar",
                    filterString: `%${requestBody.filterString}%`,
                    offset: (requestBody.pageNo - 1) * requestBody.limit,
                    limit: requestBody.limit,
                    user_id: event.requestContext.authorizer.claims.sub
                },
            }
        );

        console.log(count);
        return success({ count: count[0].count, data: webinarresult });
    } catch (err) {
        console.log(err.message);
        return failure({ message: err.message });
    }
};