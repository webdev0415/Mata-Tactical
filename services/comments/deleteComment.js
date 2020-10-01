import { success, failure } from "../../libs/response-lib";

import connectToDatabase from "../../libs/db";
export const main = async(event) => {
    try {
        const { Comment } = await connectToDatabase();
        const result = await Comment.findOne({where: {id: JSON.parse(event.body).comment_id}});
        if(!result.parent_id)
        {
            await Comment.destroy({where: {parent_id: JSON.parse(event.body).comment_id}});
        }
        await Comment.destroy({where: {id: JSON.parse(event.body).comment_id }});
        return success({message: "success"});
    } catch (err) {
        return failure({ message: err.message });
    }
};