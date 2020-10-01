// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
export const login = async(event) => {
    try {
        const { ConsumerUser,ActivityLog } = await connectToDatabase();
        const requestBody = JSON.parse(event.body);
        const user = await ConsumerUser.findOne({
            where: {
                id: event.requestContext.authorizer.claims.sub,
            },
        });
        if (event.body && requestBody.login)
        {
            await ActivityLog.create({user_id : event.requestContext.authorizer.claims.sub, logged_in_time: new Date()});
        }
        return success(user);
    } catch (err) {
        return failure({ message: err.message });
    }
};