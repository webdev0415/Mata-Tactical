import { success, failure } from "../../libs/response-lib";

import connectToDatabase from "../../libs/db";
export const main = async(event) => {
    try {
        const { ConsumerUser } = await connectToDatabase();
        await ConsumerUser.update({comment_banned: JSON.parse(event.body).comment_banned},{where: {id: JSON.parse(event.body).user_id}});
        return success({message: "success"});
    } catch (err) {
        return failure({ message: err.message });
    }
};