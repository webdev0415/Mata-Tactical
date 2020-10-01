import { success, failure } from "../../libs/response-lib";

import connectToDatabase from "../../libs/db";
export const main = async (event) => {
  try {
    const { Comment, ConsumerUser } = await connectToDatabase();
    const userattributes = await ConsumerUser.findOne({
      where: { id: event.requestContext.authorizer.claims.sub },
    });
    if (userattributes.comment_banned === true) {
      return failure({ message: "You have been banned to comment" });
    }
    const comment = JSON.parse(event.body);
    comment.parent_id = comment.parent_id || null;
    const result = await Comment.create(comment);
    return success({
      data: {
        id: result.id,
        is_pinned: result.is_pinned,
        user_id: result.user_id,
        product_id: result.product_id,
        parent_id: result.parent_id,
        comment_content: result.comment_content,
        product_type: result.product_type,
        updatedAt: result.updatedAt,
        createdAt: result.createdAt,
        username: userattributes.username,
        profile_picture: userattributes.profile_picture,
      },
    });
  } catch (err) {
    return failure({ message: err.message });
  }
};
