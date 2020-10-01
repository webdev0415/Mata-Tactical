// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";
const { INVOKE_ENDPOINT, SERVICE_NAME, STAGE } = process.env;
export const main = async (event) => {
  try {
    const { PurchaseHistory, PhysicalProduct } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    const productInfo = await PhysicalProduct.findOne({
      where: { id: requestBody.productID },
    });

    if (productInfo) {
      if (productInfo.amount < 1) {
        throw new Error("No stock left");
      }

      const lambda = new AWS.Lambda({ endpoint: INVOKE_ENDPOINT });
      const params = {
        FunctionName: `${SERVICE_NAME}-${STAGE}-chargeCreditCard`,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({...requestBody, user_id: event.requestContext.authorizer.claims.sub}),
      };
      const result = JSON.parse((await lambda.invoke(params).promise()).Payload);

      if (result.code === "1") {
        await PhysicalProduct.update(
          { amount: productInfo.amount - 1 },
          { where: { id: requestBody.productID } }
        );
      } else {
        throw new Error(result.message);
      }
      await PurchaseHistory.create(requestBody);
      return success({ message: "success" });
    } else {
      throw new Error("No Physical Product");
    }
  } catch (err) {
    return failure({ message: err.message });
  }
};
