// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import Sequelize from "sequelize";
import moment from "moment";
const Op = Sequelize.Op;
export const main = async (event) => {
  try {
    const { WebinarProductDetail,WebinarProduct } = await connectToDatabase();
    const requestBody = JSON.parse(event.body);
    const seats = await WebinarProduct.findOne({where:{id: requestBody.webinar_id}});
    if(seats && seats.seats < Math.max(...requestBody.seatNoArray))
    {
      return failure({message: "Reserved Seat No is larger than the seats_count"});
    }
    await WebinarProductDetail.destroy({
      where: {
        webinar_id: requestBody.webinar_id,
        seat_status: "reserved",
        reserved_time: {
          [Op.lt]: moment().subtract(5, "minutes").toDate(),
        },
      },
    });
    const reserved_seats = await WebinarProductDetail.findAll({
      where: {
        webinar_id: requestBody.webinar_id,
        seat_status: "reserved",
        user_id: event.requestContext.authorizer.claims.sub,
      }
    });
    if(reserved_seats.length>0)
    {
      return failure({message: "You should purchase or cancel reserved the seats"});
    }
    const is_seats_existing = await WebinarProductDetail.findAll({
      where: {
        seatNo: requestBody.seatNoArray,
        webinar_id: requestBody.webinar_id,
      },
    });
    let result = {};
    if (is_seats_existing.length > 0) {
      result.reserved_seats = [];
      const promises = await is_seats_existing.map((seat) => {
        result.reserved_seats.push(seat.seatNo);
      });
      await Promise.all(promises);
      return success({ data: result, status: "warning" });
    } else {
      const promises_seat = await requestBody.seatNoArray.map((seatNo) => {
        return {
          seat_status: "reserved",
          user_id: event.requestContext.authorizer.claims.sub,
          reserved_time: new Date(),
          seatNo: seatNo,
          webinar_id: requestBody.webinar_id,
        };
      });
      const input_object_arrays = await Promise.all(promises_seat);
      const created_seats = await WebinarProductDetail.bulkCreate(
        input_object_arrays
      );
      return success({ data: created_seats, status: "success" });
    }
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
