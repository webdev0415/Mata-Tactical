const AWS = require("aws-sdk");
const { v4 } = require("uuid");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const sns = new AWS.SNS({ region: process.env.REGION });
      console.log(process.env.TOPIC_ARN);
      var params = {
        Name: process.env.NOTIFICATION_TOPIC /* required */,
      };
      const result = await sns.createTopic(params).promise();
      console.log("---------Result-------,", result);
      const resultDB = await queryInterface.sequelize.query(
        `SELECT * FROM topic_lists WHERE notification_type = "new_products"`,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      let id;
      if (resultDB.length < 1) {
        id = v4();
        const insertResult = await queryInterface.sequelize.query(
          `INSERT INTO topic_lists (id,arn,notification_type,webinar_id) VALUES (:id,:arn,"new_products","none")`,
          {
            type: Sequelize.QueryTypes.INSERT,
            replacements: {
              id: v4(),
              arn: result.TopicArn,
            },
          }
        );
        console.log(insertResult);
      } else {
        id = resultDB[0].id;
      }
      const consumers = await queryInterface.sequelize.query(
        "SELECT * FROM consumer_users WHERE notify_products IN ('phone','email and phone')",
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      console.log(id);
      console.log(consumers);
      const promise = consumers.map(async (el) => {
        if (el.phone_number) {
          var subscribePromise = await sns
            .subscribe({
              Protocol: "sms" /* required */,
              TopicArn: result.TopicArn /* required */,
              Endpoint: el.phone_number,
            })
            .promise();
          console.log(subscribePromise);
          const result_subscribe = await queryInterface.sequelize.query(
            "SELECT * FROM subscription_lists WHERE topic_id=:id AND user_id = :user_id AND subscription_arn = :arn",
            {
              type: Sequelize.QueryTypes.SELECT,
              replacements: {
                id: id,
                user_id: el.id,
                arn: subscribePromise.SubscriptionArn,
              },
            }
          );
          if (result_subscribe.length < 1) {
            const sns_subscribe = await sns
              .subscribe({
                Protocol: "sms" /* required */,
                TopicArn: result.TopicArn /* required */,
                Endpoint: el.phone_number,
              })
              .promise();
            await queryInterface.sequelize.query(
              "INSERT INTO subscription_lists (id, user_id, topic_id, subscription_arn) VALUES (:id, :user_id, :topic_id, :arn)",
              {
                type: Sequelize.QueryTypes.INSERT,
                replacements: {
                  id: v4(),
                  user_id: el.id,
                  arn: sns_subscribe.SubscriptionArn,
                  topic_id: id,
                },
              }
            );
          }
        }
      });
      await Promise.all(promise);
      console.log(consumers);
      console.log(id);
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
};
