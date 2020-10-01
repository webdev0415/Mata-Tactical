import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
import { QueryTypes } from "sequelize";

export const main = async (event, context) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    console.log(context);
    const { sequelize } = await connectToDatabase();
    const result = await sequelize.query(
      'SELECT `comments`.`id`,`comments`.`comment_content`,`comments`.`is_pinned`,`consumer_users`.`username`,`comments`.`is_edited`,`consumer_users`.`id` AS user_id,`consumer_users`.`profile_picture`,`comments`.`product_id`,`comments`.`product_type`,CASE WHEN `comments`.`is_edited`=1 THEN `comments`.`edit_date` ELSE `comments`.`createdAt` END AS createdAt, CASE WHEN `comments`.`is_pinned`=1 THEN `comments`.`pinned_date` ELSE "0000-00-00 00:00:00" END AS pinned_date, `consumer_users`.`comment_banned` FROM `comments` INNER JOIN `consumer_users` ON `consumer_users`.`id`= `comments`.`user_id` WHERE `comments`.`product_id` = :id AND `comments`.`parent_id` IS NULL ORDER BY `pinned_date` DESC,`comments`.`createdAt` DESC',
      {
        type: QueryTypes.SELECT,
        replacements: { id: event.pathParameters.id },
      }
    );
    let messageStructure = {};
    messageStructure.result = [];
    const promises = result.map(async (item, i) => {
      let itemObject = {};
      itemObject.message = item;

      const childs = await sequelize.query(
        'SELECT `comments`.`id`,`comments`.`comment_content`,`comments`.`is_pinned`,`consumer_users`.`username`,`comments`.`is_edited`,`consumer_users`.`id` AS user_id,`consumer_users`.`profile_picture`,CASE WHEN `comments`.`is_edited`=1 THEN `comments`.`edit_date` ELSE `comments`.`createdAt` END AS createdAt, CASE WHEN `comments`.`is_pinned`=1 THEN `comments`.`pinned_date` ELSE "0000-00-00 00:00:00" END AS pinned_date, `consumer_users`.`comment_banned` FROM `comments` INNER JOIN `consumer_users` ON `consumer_users`.`id`= `comments`.`user_id` WHERE `comments`.`parent_id`=:parent_id ORDER BY `pinned_date` DESC, `comments`.`createdAt` ASC',
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
