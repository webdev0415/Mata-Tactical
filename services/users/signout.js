// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import { success, failure } from "../../libs/response-lib";
import connectToDatabase from "../../libs/db";
export const main = async(event) => {
    try {
        const { ActivityLog } = await connectToDatabase();
        await ActivityLog.update({logged_out_time: new Date()},{where: {email: JSON.parse(event.body).email, logged_out_time: null}});
        return success({message: "success"});
    } catch (err) {
        return failure({ message: err.message });
    }
};