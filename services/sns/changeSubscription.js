import AWS from "aws-sdk";
import connectToDatabase from "../../libs/db";
import { QueryTypes } from "sequelize";

export const main = async (event) => {
  try {
    const sns = new AWS.SNS();
    const { sequelize, SubscriptionList, TopicList } = await connectToDatabase();

    const requestBody = event;
    let filterPolicy = {};
    const previoususer = requestBody.previousUser;
    if (
      previoususer.notify_products != "none" &&
      previoususer.notify_products != "email"
    ) {
      filterPolicy.newProducts = true;
    } else {
      filterPolicy.newProducts = false;
    }
    if (
      previoususer.notify_webinar != "none" &&
      previoususer.notify_webinar != "email"
    ) {
      filterPolicy.webinarUpdate = true;
    } else {
      filterPolicy.webinarUpdate = false;
    }
    if (
      filterPolicy.webinarUpdate === true &&
      requestBody.filterPolicy.webinarUpdate === false
    ) {
      const subscriptionList = await sequelize.query(
        'SELECT `subscription_lists`.`subscription_arn` FROM `subscription_lists` INNER JOIN `topic_lists` ON `topic_lists`.`id`=`subscription_lists`.`topic_id` WHERE `subscription_lists`.`user_id` = :id AND `topic_lists`.`notification_type` = "webinar_update" ',
        { type: QueryTypes.SELECT, replacements: { id: requestBody.id } }
      );
      const promises = await subscriptionList.map(async (subscription) => {
        await sns
          .unsubscribe({
            SubscriptionArn: subscription.subscription_arn,
          })
          .promise();
        await SubscriptionList.destroy({
          where: { subscription_arn: subscription.subscription_arn },
        });
      });
      await Promise.all(promises);
    }
    if (
      filterPolicy.webinarUpdate === false &&
      requestBody.filterPolicy.webinarUpdate === true
    ) {
      const topicLists = await sequelize.query(
        'SELECT DISTINCT `topic_lists`.`arn`,`topic_lists`.`id` FROM `topic_lists` INNER JOIN `webinar_product_details` ON `topic_lists`.`webinar_id` = `webinar_product_details`.`webinar_id` INNER JOIN `webinar_products` ON `webinar_products`.`id` = `topic_lists`.`webinar_id` WHERE `webinar_product_details`.`user_id` = :id AND `webinar_products`.`product_status` NOT IN ("progress","done")',
        { type: QueryTypes.SELECT, replacements: { id: requestBody.id } }
      );
      const promisestopics = await topicLists.map(async (topicList) => {
        var subscribePromise = await sns
          .subscribe({
            Protocol: "sms" /* required */,
            TopicArn: topicList.arn /* required */,
            Endpoint: requestBody.phoneNumber,
          })
          .promise();
        await SubscriptionList.create({
          topic_id: topicList.id,
          user_id: requestBody.id,
          subscription_arn: subscribePromise.SubscriptionArn,
        });
      });
      await Promise.all(promisestopics);
    }
    if (
      filterPolicy.webinarUpdate === true &&
      requestBody.filterPolicy.webinarUpdate === true &&
      requestBody.previousUser.phone_number !== requestBody.phoneNumber
    ) {
      const change_subscribe_lists = await sequelize.query(
        "SELECT `topic_lists`.`arn`,`subscription_lists`.`id`, `subscription_lists`.`subscription_arn` FROM `subscription_lists` INNER JOIN `topic_lists` ON `topic_lists`.`id` = `subscription_lists`.`topic_id` WHERE `subscription_lists`.`user_id` = :id",
        { type: QueryTypes.SELECT, replacements: { id: requestBody.id } }
      );
      const change_tasks = await change_subscribe_lists.map(
        async (subscribe_list) => {
          await sns
            .unsubscribe({
              SubscriptionArn: subscribe_list.subscription_arn,
            })
            .promise();
          var new_subscribe_result = await sns
            .subscribe({
              Protocol: "sms" /* required */,
              TopicArn: subscribe_list.arn /* required */,
              Endpoint: requestBody.phoneNumber,
            })
            .promise();
          await SubscriptionList.update(
            { subscription_arn: new_subscribe_result.SubscriptionArn },
            { where: { id: subscribe_list.id } }
          );
        }
      );
      await Promise.all(change_tasks);
    }
    var topicID = null;
    if (
      !(
        filterPolicy.newProducts === true &&
        requestBody.filterPolicy.newProducts === true &&
        requestBody.previousUser.phone_number === requestBody.phoneNumber
      )
    ) {
      topicID = await TopicList.findOne({
        attributes: ["id","arn"],
        where: { notification_type: "new_products" },
      });
      if (!topicID) {
        topicID = await TopicList.create({
          notification_type: "new_products",
          arn: process.env.TOPIC_ARN,
        });
      }
    }
    if (
      filterPolicy.newProducts === false &&
      requestBody.filterPolicy.newProducts === true
    ) {
      var newParams1 = {
        Protocol: "sms" /* required */,
        TopicArn: process.env.TOPIC_ARN /* required */,
        Endpoint: requestBody.phoneNumber,
      };
      var newSubscription1 = await sns.subscribe(newParams1).promise();
      console.log(newSubscription1);
      const newsubscribe = await SubscriptionList.create({
        subscription_arn: newSubscription1.SubscriptionArn,
        topic_id: topicID.id,
        user_id: requestBody.id,
      });
      console.log(newsubscribe);
    }
    if (
      filterPolicy.newProducts === true &&
      requestBody.filterPolicy.newProducts === false
    ) {
      const subscribeDataPhysicalProduct = await SubscriptionList.findAll({
        where: { topic_id: topicID.id, user_id: requestBody.id },
        attributes: ["subscription_arn"],
      });
      const params = {
        SubscriptionArn: subscribeDataPhysicalProduct[0].subscription_arn,
      };
      await sns.unsubscribe(params).promise();
      await SubscriptionList.destroy({
        where: { subscription_arn: subscribeDataPhysicalProduct[0].subscription_arn },
      });
    }
    if (
      filterPolicy.newProducts === true &&
      requestBody.filterPolicy.newProducts === true &&
      requestBody.previousUser.phone_number !== requestBody.phoneNumber
    ) {
      const subscribeDataPhysicalProduct = await SubscriptionList.findAll({
        where: { topic_id: topicID.id, user_id: requestBody.id },
        attributes: ["subscription_arn"],
      });
      const params = {
        SubscriptionArn: subscribeDataPhysicalProduct[0].subscription_arn,
      };
      await sns.unsubscribe(params).promise();
      var newParams = {
        Protocol: "sms" /* required */,
        TopicArn: process.env.TOPIC_ARN /* required */,
        Endpoint: requestBody.phoneNumber,
      };
      var newSubscription = await sns.subscribe(newParams).promise();
      await SubscriptionList.update(
        { subscription_arn: newSubscription.SubscriptionArn },
        { where: { topic_id: topicID.id, user_id: requestBody.id } }
      );
    }
    //   const params = {
    //       SubscriptionArn: requestBody.subscriptionArn,
    //   }
    //   var subscribePromise = await sns.getSubscriptionAttributes(params).promise();

    // let filterPolicy = JSON.parse(subscribePromise.Attributes.FilterPolicy);
    //     filterPolicy.webinarUpdate = requestBody.filterPolicy.webinarUpdate;
    //     filterPolicy.newProducts = requestBody.filterPolicy.newProducts;

    //   if(subscribePromise.Endpoint === requestBody.phoneNumber)
    //   {
    //     returnSubscriptionArn = requestBody.subscriptionArn;
    //     var changeParams = {
    //       AttributeName: 'FilterPolicy',
    //       SubscriptionArn: returnSubscriptionArn,
    //       AttributeValue: JSON.stringify(filterPolicy),
    //     }
    //     var changeSubscription = await sns.setSubscriptionAttributes(changeParams).promise();

    //   }
    //   else {
    //     const deleteParams = {
    //       SubscriptionArn : requestBody.subscriptionArn,
    //     }

    //     const responseDelete = await sns.unsubscribe(deleteParams).promise();

    //     var createParams = {
    //       Protocol: 'sms', /* required */
    //       TopicArn: process.env.TOPIC_ARN, /* required */
    //       Endpoint: requestBody.phoneNumber,
    //       Attributes: {
    //         FilterPolicy: JSON.stringify(filterPolicy)
    //       }
    //     };
    //     var responseCreateNew = await sns.subscribe(createParams).promise();
    //     returnSubscriptionArn = responseCreateNew.SubscriptionArn;

    //   }
    return { status: "success" };
  } catch (err) {
    console.log(err);
    return { message: err.message, status: "failed" };
  }
};
