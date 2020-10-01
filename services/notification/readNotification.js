import { success, failure } from "../../libs/response-lib";

import connectToDatabase from "../../libs/db";
export const main = async (event) => {
  try {
    const { NotificationState } = await connectToDatabase();
    const notification_id = event.pathParameters.id;
    const updateResult = await NotificationState.update(
      { notification_status: "read" },
      { where: { id: notification_id } }
    );
    console.log(updateResult);
    return success({ message: "success" });
  } catch (err) {
    console.log(err);
    return failure({ message: err.message });
  }
};
