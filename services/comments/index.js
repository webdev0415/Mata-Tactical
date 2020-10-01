import { ModelsList } from "../../libs/db";
import { QueryTypes } from "sequelize";
const { Comment, ConsumerUser, sequelize, SiteSettings } = ModelsList;

export default class CommentService {
  static async addComment(event) {
    const site_settings = await SiteSettings.findOne({
      attributes: ["hide_comments", "commentsOption"],
    });
    if (site_settings && site_settings.hide_comments) {
      throw new Error("The comment system is off now!");
    }
    const userattributes = await ConsumerUser.findOne({
      where: { id: event.requestContext.authorizer.sub },
    });
    if (userattributes.comment_banned === true) {
      throw new Error("You have been banned to comment");
    }
    const comment = event.body;
    comment.parent_id = comment.parent_id || null;
    comment.user_id = event.requestContext.authorizer.sub;
    if (
      userattributes.user_role !== "admin" &&
      site_settings &&
      site_settings.commentsOption &&
      (comment.parent_id || (comment.parent_id && comment.parent_id != ""))
    ) {
      throw new Error(
        "You can't comment because the comment system is blocked with the consumers"
      );
    }
    const result = await Comment.create(comment);
    return {
      result: {
        id: result.id,
        is_pinned: result.is_pinned,
        user_id: result.user_id,
        product_id: result.product_id,
        parent_id: result.parent_id,
        comment_content: result.comment_content,
        product_type: result.product_type,
        updatedAt: result.updatedAt,
        createdAt: result.createdAt,
        username: userattributes.username,
        profile_picture: userattributes.profile_picture,
      },
    };
  }
  static async updateComment(event) {
    const requestBody = event.body;
    const site_settings = await SiteSettings.findOne({
      attributes: ["hide_comments", "commentsOption"],
    });
    if (site_settings && site_settings.hide_comments) {
      throw new Error("The comment system is off now!");
    }
    const user = await ConsumerUser.findOne({
      where: { id: event.requestContext.authorizer.sub },
    });
    const user_role = user.user_role;
    const comment = await Comment.findOne({
      where: { id: requestBody.comment_id },
    });
    if (
      (event.requestContext.authorizer.sub !== comment.user_id ||
        comment.is_pinned === true) &&
      user_role === "consumer"
    ) {
      throw new Error("Permisson Denined");
    }
    if (user_role === "consumer") {
      await Comment.update(
        {
          is_edited: true,
          edit_date: new Date(),
          comment_content: requestBody.comment_content,
        },
        {
          where: {
            id: requestBody.comment_id,
            user_id: event.requestContext.authorizer.sub,
          },
        }
      );
    } else if (user_role === "admin") {
      await Comment.update(
        {
          is_edited: true,
          edit_date: new Date(),
          comment_content: requestBody.comment_content,
        },
        { where: { id: requestBody.comment_id } }
      );
    }
    return { result: { message: "success" } };
  }
  static async getUserComments(event) {
    const site_settings = await SiteSettings.findOne({
      attributes: ["hide_comments", "commentsOption"],
    });
    if (site_settings && site_settings.hide_comments) {
      throw new Error("The comment system is off now!");
    }
    const result = await sequelize.query(
      "SELECT `comments`.`id`,`comments`.`comment_content`,`consumer_users`.`username`,`consumer_users`.`id` AS user_id,`consumer_users`.`profile_picture`,`comments`.`is_pinned`,`comments`.`product_id`,`comments`.`product_type`,CASE WHEN `comments`.`is_edited`=1 THEN `comments`.`edit_date` ELSE `comments`.`createdAt` END AS createdAt,`comments`.`is_edited`,`consumer_users`.`comment_banned` FROM `comments` INNER JOIN `consumer_users` ON `consumer_users`.`id`= `comments`.`user_id` WHERE `comments`.`user_id` = :id AND `comments`.`parent_id` IS NULL ORDER BY `comments`.`createdAt` DESC",
      {
        type: QueryTypes.SELECT,
        replacements: { id: event.requestContext.authorizer.sub },
      }
    );
    let messageStructure = {};
    messageStructure.result = [];
    const promises = result.map(async (item, i) => {
      let itemObject = {};
      itemObject.message = item;
      if (item.product_type === "webinar") {
        const resultForWebinar = await sequelize.query(
          "SELECT `webinar_products`.`product_status` FROM `webinar_products` WHERE `webinar_products`.`id` = :product_id",
          {
            type: QueryTypes.SELECT,
            replacements: { product_id: item.product_id },
          }
        );
        console.log(resultForWebinar);
        if (resultForWebinar && resultForWebinar.length > 0) {
          itemObject.product_status = resultForWebinar[0].product_status;
        }
        else
        {
          itemObject.product_status = "deleted";
        }
      }
      if (item.product_type === "physical") {
        const resultForPhysical = await sequelize.query(
          "SELECT `physical_products`.`product_status` FROM `physical_products` WHERE `physical_products`.`id` = :product_id",
          {
            type: QueryTypes.SELECT,
            replacements: { product_id: item.product_id },
          }
        );
        console.log(resultForPhysical);
        if (resultForPhysical && resultForPhysical.length > 0) {
          itemObject.product_status = resultForPhysical[0].product_status;
        }
        else
        {
          itemObject.product_status = "deleted";
        }
      }

      const childs = await sequelize.query(
        "SELECT `comments`.`id`,`comments`.`comment_content`,`consumer_users`.`username`,`consumer_users`.`id` AS user_id,`comments`.`is_pinned`,`consumer_users`.`profile_picture`,CASE WHEN `comments`.`is_edited`=1 THEN `comments`.`edit_date` ELSE `comments`.`createdAt` END AS createdAt,`comments`.`is_edited`,`consumer_users`.`comment_banned` FROM `comments` INNER JOIN `consumer_users` ON `consumer_users`.`id`= `comments`.`user_id` WHERE `comments`.`parent_id`=:parent_id ORDER BY `comments`.`createdAt` ASC",
        { type: QueryTypes.SELECT, replacements: { parent_id: item.id } }
      );
      itemObject = { ...itemObject, childs };
      return itemObject;
    });
    const resultArray = await Promise.all(promises);
    messageStructure.result = resultArray;

    return { result: { data: messageStructure } };
  }
  static async getProductComments(event) {
    const site_settings = await SiteSettings.findOne({
      attributes: ["hide_comments", "commentsOption"],
    });
    if (site_settings && site_settings.hide_comments) {
      return { result: { data: [] } };
    }
    const result = await sequelize.query(
      'SELECT `comments`.`id`,`comments`.`comment_content`,`comments`.`is_pinned`,`consumer_users`.`username`,`comments`.`is_edited`,`consumer_users`.`id` AS user_id,`consumer_users`.`profile_picture`,`comments`.`product_id`,`comments`.`product_type`,CASE WHEN `comments`.`is_edited`=1 THEN `comments`.`edit_date` ELSE `comments`.`createdAt` END AS createdAt, CASE WHEN `comments`.`is_pinned`=1 THEN `comments`.`pinned_date` ELSE "0000-00-00 00:00:00" END AS pinned_date, `consumer_users`.`comment_banned` FROM `comments` INNER JOIN `consumer_users` ON `consumer_users`.`id`= `comments`.`user_id` WHERE `comments`.`product_id` = :id AND `comments`.`parent_id` IS NULL ORDER BY `pinned_date` DESC,`comments`.`createdAt` DESC',
      {
        type: QueryTypes.SELECT,
        replacements: { id: event.params.id },
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

    return { result: { data: messageStructure } };
  }

  static async pinComment(event) {
    const site_settings = await SiteSettings.findOne({
      attributes: ["hide_comments", "commentsOption"],
    });
    if (site_settings && site_settings.hide_comments) {
      throw new Error("The comment system is off now!");
    }
    await Comment.update(
      { is_pinned: event.body.is_pinned, pinned_date: new Date() },
      { where: { id: event.body.comment_id } }
    );
    return { result: { message: "success" } };
  }

  static async deleteComment(event) {
    const site_settings = await SiteSettings.findOne({
      attributes: ["hide_comments", "commentsOption"],
    });
    if (site_settings && site_settings.hide_comments) {
      throw new Error("The comment system is off now!");
    }
    const result = await Comment.findOne({
      where: { id: event.params.id },
    });
    if (!result.parent_id) {
      await Comment.destroy({ where: { parent_id: event.params.id } });
    }
    await Comment.destroy({ where: { id: event.params.id } });
    return { result: { message: "success" } };
  }
}
