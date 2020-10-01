// const connectToDatabase from '../../libs/db'); // initialize connection
// simple Error constructor for handling HTTP error codes
import connectToDatabase from "../../libs/db";
import { success, failure } from "../../libs/response-lib";
import Sequelize from "sequelize";
import moment from "moment";
const Op = Sequelize.Op;
export const main = async (event) => {
  try {
    const { WebinarProductDetail, WebinarProduct } = await connectToDatabase();
    const webinar_id = event.pathParameters.id;
    await WebinarProductDetail.destroy({
      where: {
        webinar_id: webinar_id,
        seat_status: "reserved",
        reserved_time: {
          [Op.lt]: moment().subtract(5, "minutes").toDate(),
        },
      },
    });
    const allSeats = await WebinarProductDetail.findAll({
      where: { webinar_id: webinar_id },
    });
    const webinar_product = await WebinarProduct.findOne({
      where: { id: webinar_id },
    });
    let status_webinar = new Array(webinar_product.seats);
    await status_webinar.fill("available", 0, webinar_product.seats);
    const promises = await allSeats.map((seat) => {
      status_webinar[seat.seatNo] = seat.seat_status;
    });
    await Promise.all(promises);

    return success({ message: status_webinar });
  } catch (err) {
    console.log(err.message);
    return failure({ message: err.message });
  }
};
