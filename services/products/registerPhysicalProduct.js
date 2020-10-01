// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";
export const main = async(event) => {
    try {
        const {
            PhysicalProduct,
        } = await connectToDatabase();
        const requestBody = JSON.parse(event.body);
        const product = await PhysicalProduct.create(requestBody);

        const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
        const params = {
            FunctionName: process.env.SERVICE_NAME +
                "-" +
                process.env.STAGE +
                "-" +
                "registernotification",
            InvocationType: "Event",
            Payload: JSON.stringify({
                id: product.id,
                product_type: "physical",
                service_type: "new_product",
                product_name: product.productName,
                product_image: product.imageUrl,
            }),
        };
        const result1 = await lambda.invoke(params).promise();
        console.log(result1);
        const newparams = {
            FunctionName: process.env.SERVICE_NAME +
                "-" +
                process.env.STAGE +
                "-" +
                "publishnewproductmessage",
            InvocationType: "Event",
            Payload: JSON.stringify({
                id: product.id,
                product_type: "physical",
                service_type: "new_product",
                product_name: product.productName,
            }),
        };
        const result2 = await lambda.invoke(newparams).promise();
        console.log(result2);
        const emailparams = {
            FunctionName: process.env.SERVICE_NAME + "-" + process.env.STAGE + "-" + "sendemails",
            InvocationType: "Event",
            Payload: JSON.stringify({
                id: product.id,
                product_type: "physical",
                service_type: "new_product",
                product_name: product.productName,
            }),
        };
        await lambda.invoke(emailparams).promise();
        return success(product);
    } catch (err) {
        console.log(err.message);
        return failure({ message: err.message });
    }
};