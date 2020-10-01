import { success, failure } from "../../libs/response-lib";

import connectToDatabase from "../../libs/db";
export const main = async (event) => {
  try {
    const { Comment, ConsumerUser } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    const user = await ConsumerUser.findOne({
      where: { id: event.requestContext.authorizer.claims.sub },
    });
    const user_role = user.user_role;
    const comment = await Comment.findOne({
      where: { id: requestBody.comment_id },
    });
    if (
      (event.requestContext.authorizer.claims.sub !== comment.user_id || comment.is_pinned === true) &&
      user_role === "consumer"
    ) {
      return failure({ message: "Permisson Denined" });
    }
    if(user_role === "consumer")
    {
    await Comment.update(
      {
        is_edited: true,
        edit_date: new Date(),
        comment_content: requestBody.comment_content,
      },
      {where:{id: requestBody.comment_id, user_id: event.requestContext.authorizer.claims.sub} }
    );
    }
    else if (user_role === "admin")
    {
      await Comment.update(
        {
          is_edited: true,
          edit_date: new Date(),
          comment_content: requestBody.comment_content,
        },
        {where:{id: requestBody.comment_id} }
      );
    }
    return success({ message: "success" });
  } catch (err) {
    return failure({ message: err.message });
  }
};
