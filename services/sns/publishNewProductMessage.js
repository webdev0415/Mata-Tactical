import AWS from "aws-sdk";
import connectToDatabase from "../../libs/db";

export const main = async(event) => {
    try {
        const sns = new AWS.SNS();
        const { TopicList } = await connectToDatabase();
        console.log(event);
        if (event.service_type === "new_product") {
            var topicID = await TopicList.findOne({
                attributes: ["arn"],
                where: { notification_type: "new_products" },
            });
            let message = "";
            if (event.product_type === "physical") {
                message = `New Physical Product ${event.product_name} is added. You can view the product details at ${process.env.FRONTEND_URL}/products/physical/${event.id}`;
            } else if (event.product_type === "webinar") {
                message = `New Webinar (${event.product_name}) is added. You can view the product details at ${process.env.FRONTEND_URL}/products/webinar/${event.id}`;
            }
            console.log(message);
            var params = {
                Message: message,
                TopicArn: topicID.arn,
            };
            await sns.publish(params).promise();
        }

        return { status: "success" };
    } catch (err) {
        console.log(err);
        return { message: err.message, status: "failed" };
    }
};