import { success, failure } from "../../libs/response-lib";

import connectToDatabase from "../../libs/db";
import { QueryTypes } from "sequelize";
export const main = async(event) => {
    try {
        const { sequelize } = await connectToDatabase();
        console.log(process.env.ACCOUNT_ID);
        const userID = event.requestContext.authorizer.claims.sub;
        const notification_lists = await sequelize.query(
            "SELECT `notification_states`.`id`, `notification_lists`.`product_id`,`notification_lists`.`service_type`,`notification_lists`.`product_type`,`notification_lists`.`product_name`,`notification_lists`.`product_image`,`notification_lists`.`createdAt` FROM notification_states INNER JOIN notification_lists ON `notification_states`.`notification_id` = `notification_lists`.`id` WHERE `notification_states`.`notification_status` = :status AND `notification_states`.`user_id`= :id ORDER BY `notification_states`.`createdAt` DESC", {
                type: QueryTypes.SELECT,
                replacements: { status: "created", id: userID },
            }
        );

        return success({ message: notification_lists });
    } catch (err) {
        console.log(err);
        return failure({ message: err.message });
    }
};