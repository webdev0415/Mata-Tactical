import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
import { QueryTypes } from "sequelize";

export const main = async (event, context) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    console.log(context);
    const { sequelize } = await connectToDatabase();
    const result = await sequelize.query(
      'SELECT `comments`.`id`,`comments`.`comment_content`,`consumer_users`.`username`,`consumer_users`.`id` AS user_id,`consumer_users`.`profile_picture`,`comments`.`is_pinned`,`comments`.`product_id`,`comments`.`product_type`,CASE WHEN `comments`.`is_edited`=1 THEN `comments`.`edit_date` ELSE `comments`.`createdAt` END AS createdAt,`comments`.`is_edited`,`consumer_users`.`comment_banned` FROM `comments` INNER JOIN `consumer_users` ON `consumer_users`.`id`= `comments`.`user_id` WHERE `comments`.`user_id` = :id AND `comments`.`parent_id` IS NULL ORDER BY `comments`.`createdAt` DESC',
      {
        type: QueryTypes.SELECT,
        replacements: { id: event.requestContext.authorizer.claims.sub },
      }
    );
    let messageStructure = {};
    messageStructure.result = [];
    const promises = result.map(async (item, i) => {
      let itemObject = {};
      itemObject.message = item;
      if (item.product_type === "webinar") {
        const resultForWebinar = await sequelize.query(
          'SELECT `webinar_products`.`product_status` FROM `webinar_products` WHERE `webinar_products`.`id` = :product_id',
          {
            type: QueryTypes.SELECT,
            replacements: { product_id: item.product_id },
          }
        );
        itemObject.product_status = resultForWebinar[0].product_status;
      }
      if (item.product_type === "physical") {
        const resultForPhysical = await sequelize.query(
          'SELECT `physical_products`.`product_status` FROM `physical_products` WHERE `physical_products`.`id` = :product_id',
          {
            type: QueryTypes.SELECT,
            replacements: { product_id: item.product_id },
          }
        );
        itemObject.product_status = resultForPhysical[0].product_status;
      }

      const childs = await sequelize.query(
        'SELECT `comments`.`id`,`comments`.`comment_content`,`consumer_users`.`username`,`consumer_users`.`id` AS user_id,`comments`.`is_pinned`,`consumer_users`.`profile_picture`,CASE WHEN `comments`.`is_edited`=1 THEN `comments`.`edit_date` ELSE `comments`.`createdAt` END AS createdAt,`comments`.`is_edited`,`consumer_users`.`comment_banned` FROM `comments` INNER JOIN `consumer_users` ON `consumer_users`.`id`= `comments`.`user_id` WHERE `comments`.`parent_id`=:parent_id ORDER BY `comments`.`createdAt` ASC',
        { type: QueryTypes.SELECT, replacements: { parent_id: item.id } }
      );
      // console.log(i);
      itemObject = { ...itemObject, childs };
      return itemObject;
    });
    const resultArray = await Promise.all(promises);
    messageStructure.result = resultArray;

    return success({ data: messageStructure });
  } catch (err) {
    console.log(err);
    return failure({ message: err.message });
  }
};
