import AWS from "aws-sdk";
import connectToDatabase from "../../libs/db";
export const main = async (event) => {
  try {
    const { TopicList } = await connectToDatabase();
    const sns = new AWS.SNS();

    var params = {
      Name: `new-webinar-${event.id}` /* required */,
    };
    const result = await sns.createTopic(params).promise();
    const resultForDB = await TopicList.findOrCreate({
      where: {
        arn: result.TopicArn,
        notification_type: "webinar_update",
        webinar_id: event.id,
      },
      defaults: {
        arn: result.TopicArn,
        notification_type: "webinar_update",
        webinar_id: event.id,
      },
    });
    console.log(resultForDB);
    return { status: "success" };
  } catch (err) {
    console.log(err.message);
    return { message: err.message, status: "failed" };
  }
};
