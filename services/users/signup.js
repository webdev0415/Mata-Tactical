import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
import AWS from "aws-sdk";
export const signup = async(event) => {
    try {
        const { ConsumerUser } = await connectToDatabase();
        const requestJSON = JSON.parse(event.body);
        const user = await ConsumerUser.create(requestJSON);
        console.log(process.env.INVOKE_ENDPOINT);
        const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
        let filterPolicy = {};
        if (user.notify_products != "none" && user.notify_products != "email") {
            filterPolicy.newProducts = true;
        } else {
            filterPolicy.newProducts = false;
        }
        if (user.notify_webinar != "none" && user.notify_webinar != "email") {
            filterPolicy.webinarUpdate = true;
        } else {
            filterPolicy.webinarUpdate = false;
        }
        console.log(
            process.env.SERVICE_NAME +
            "-" +
            process.env.STAGE +
            "-" +
            "createsubscription"
        );
        const params = {
            FunctionName: process.env.SERVICE_NAME +
                "-" +
                process.env.STAGE +
                "-" +
                "createsubscription",
            InvocationType: "Event",
            Payload: JSON.stringify({
                phoneNumber: user.phone_number,
                filterPolicy,
                id: user.id,
                method: "physical"
            }),
        };
        await lambda.invoke(params).promise();
        // console.log(result);
        // console.log(subscriptionARN);
        // const newUser = await ConsumerUser.update({notification_arn:subscriptionARN},{where: {id : user.id}});

        return success({ message: "success" });
    } catch (err) {
        console.log(err);
        return failure({ message: err.message });
    }
};