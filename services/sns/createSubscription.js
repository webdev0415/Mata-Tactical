import AWS from "aws-sdk";
import connectToDatabase from "../../libs/db";

export const main = async (event) => {
  try {
    const sns = new AWS.SNS();
    const requestBody = event;
    const {
      SubscriptionList,
      TopicList,
      ConsumerUser,
    } = await connectToDatabase();
    console.log(requestBody);
    if (
      requestBody.filterPolicy &&
      requestBody.filterPolicy.newProducts === true &&
      requestBody.method === "physical"
    ) {
      var topicID = await TopicList.findOne({
        attributes: ["id", "arn"],
        where: { notification_type: "new_products" },
      });
      if (!topicID) {
        topicID = await TopicList.create({
          notification_type: "new_products",
          arn: process.env.TOPIC_ARN,
        });
      }
      var params = {
        Protocol: "sms" /* required */,
        TopicArn: topicID.arn /* required */,
        Endpoint: requestBody.phoneNumber,
      };
      var subscribePromise = await sns.subscribe(params).promise();
      await SubscriptionList.create({
        topic_id: topicID.id,
        subscription_arn: subscribePromise.SubscriptionArn,
        user_id: requestBody.id,
      });
    }
    if (requestBody.method && requestBody.method === "webinar") {
      const user = await ConsumerUser.findOne({
        where: { id: requestBody.id },
      });
      if (user.notify_webinar != "none" && user.notify_webinar != "email") {
        const topicinfo = await TopicList.findOne({
          where: { webinar_id: requestBody.webinar_id },
        });
        var params1 = {
          Protocol: "sms" /* required */,
          TopicArn: topicinfo.arn /* required */,
          Endpoint: user.phone_number,
        };
        console.log(params1);
        var subscribePromise1 = await sns.subscribe(params1).promise();
        const result = await SubscriptionList.findOne({
          where: {
            topicID: topicinfo.id,
            user_id: requestBody.id,
          },
        });
        if (!result) {
          await SubscriptionList.create({
            topic_id: topicinfo.id,
            user_id: requestBody.id,
            subscription_arn: subscribePromise1.SubscriptionArn,
          });
        }
      }
    }
    return { status: "success" };
  } catch (err) {
    console.log(err);
    return { message: err.message, status: "failed" };
  }
};
