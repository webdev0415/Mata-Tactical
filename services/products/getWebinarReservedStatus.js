// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import Sequelize from "sequelize";
import moment from "moment";
const Op = Sequelize.Op;
export const main = async (event) => {
  try {
    const { WebinarProductDetail } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    await WebinarProductDetail.destroy({
      where: {
        webinar_id: requestBody.webinar_id,
        seat_status: "reserved",
        reserved_time: {
          [Op.lt]: moment().subtract(5, "minutes").toDate(),
        },
      },
    });
    const allReservedSeats = await WebinarProductDetail.findAll({
      where: {
        webinar_id: requestBody.webinar_id,
        user_id: event.requestContext.authorizer.claims.sub,
        seat_status: "reserved",
      },
    });
    let result = {};
    if (allReservedSeats.length > 0) {
      result.is_reserved = true;
      result.seatNo = [];
      result.reserved_date = allReservedSeats[0].reserved_time;
      await allReservedSeats.map(async (seat) => {
        await result.seatNo.push(seat.seatNo);
      });
     } else {
      result.is_reserved = false;
    }
    return success({ data: result });
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
