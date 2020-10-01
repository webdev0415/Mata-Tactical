import { success, failure } from "../../libs/response-lib";

import connectToDatabase from "../../libs/db";
export const main = async(event) => {
    try {
        const { Comment } = await connectToDatabase();
        await Comment.update({is_pinned: JSON.parse(event.body).is_pinned,pinned_date: new Date()},{where:{id: JSON.parse(event.body).comment_id}});
        return success({message: "success"});
    } catch (err) {
        return failure({ message: err.message });
    }
};