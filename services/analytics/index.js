import { ModelsList } from "../../libs/db";
import Moment from "moment";
import { extendMoment } from "moment-range";
import { Op, Sequelize, QueryTypes } from "sequelize";
const moment = extendMoment(Moment);
const {
  WebinarProduct,
  WebinarProductDetail,
  PurchaseHistory,
  PhysicalProduct,
  ActivityLog,
  ProductImageList,
  ConsumerUser,
  FFLTable,
  Winners,
  ShippingItem,
  sequelize,
} = ModelsList;
export default class AnalyticsService {
  static async getRevenue(event) {
    if (
      !event.query.startTime ||
      !event.query.endTime ||
      !event.query.unit ||
      !event.query.product_type
    ) {
      throw new Error("You should input all the queries");
    }
    let result;
    switch (event.query.product_type) {
      case "physical":
        result = await AnalyticsService.getRevenueFromPhysical(
          event.query.startTime,
          event.query.endTime,
          event.query.unit
        );
        return { result };
      case "both":
        result = await AnalyticsService.getRevenueFromBoth(
          event.query.startTime,
          event.query.endTime,
          event.query.unit
        );
        return { result };
      case "webinar":
        result = await AnalyticsService.getRevenueFromWebinar(
          event.query.startTime,
          event.query.endTime,
          event.query.unit
        );
        return { result };
      default:
        throw new Error(
          "You should input product_type field webinar,physical,both"
        );
    }
  }

  static async getCategorySales(event) {
    if (
      !event.query.startTime ||
      !event.query.endTime ||
      !event.query.unit ||
      !event.query.category_id
    ) {
      throw new Error("You should input all the queries");
    }
    const { startTime, endTime, unit, category_id } = event.query;
    const range = moment.range(startTime, endTime);
    const periodList = Array.from(range.by(unit));
    const promises = periodList.map(async (period) => {
      const afterResult = await moment(period).add(1, unit + "s");
      const result = await sequelize.query(
        'SELECT SUM(`price`) AS `amount` FROM (SELECT `purchase_histories`.`createdAt` AS `createdAt`,`purchase_histories`.`price` AS `price` FROM `purchase_histories` INNER JOIN `physical_products` ON `purchase_histories`.`productID` = `physical_products`.`id`  WHERE  `purchase_histories`.`createdAt` > :startdate AND  `purchase_histories`.`createdAt` < :enddate  AND `purchase_histories`.`product_type` = "product" AND `physical_products`.`category_id` = :category_id UNION ALL SELECT `webinar_product_details`.`createdAt` AS `createdAt`,`webinar_products`.`price_per_seats` as `price` FROM `webinar_product_details` INNER JOIN `webinar_products` ON `webinar_product_details`.`webinar_id` = `webinar_products`.`id`  WHERE  `webinar_product_details`.`createdAt` > :startdate AND  `webinar_product_details`.`createdAt` < :enddate  AND `webinar_product_details`.`seat_status` = "taken" AND `webinar_products`.`category_id` = :category_id) AS `revenue` ORDER BY `createdAt`',
        {
          type: QueryTypes.SELECT,
          replacements: {
            startdate: period.toDate().toISOString(),
            enddate: afterResult.toDate().toISOString(),
            category_id,
          },
        }
      );
      return { date: period, amount: result[0].amount ? result[0].amount : 0 };
    });
    const resultPeriod = await Promise.all(promises);
    return { result: resultPeriod };
  }
  static async getActiveMembers(event) {
    if (!event.query.startTime || !event.query.endTime || !event.query.unit) {
      throw new Error("You should input all the queries");
    }
    const { startTime, endTime, unit } = event.query;
    const range = moment.range(startTime, endTime);
    const periodList = Array.from(range.by(unit));
    const promises = periodList.map(async (period) => {
      const afterResult = await moment(period).add(1, unit + "s");
      const result = await ActivityLog.count({
        distinct: true,
        col: "email",
        where: {
          logged_in_time: {
            [Op.gte]: period,
            [Op.lt]: afterResult,
          },
        },
      });
      return { date: period, amount: result };
    });
    const resultPeriod = await Promise.all(promises);
    return { result: resultPeriod };
  }

  static async getRevenueFromPhysical(startTime, endTime, unit) {
    const range = moment.range(startTime, endTime);
    const periodList = Array.from(range.by(unit));
    const promises = periodList.map(async (period) => {
      const afterResult = await moment(period).add(1, unit + "s");
      const result = await PhysicalProduct.findAll({
        attributes: [
          [
            Sequelize.fn("sum", Sequelize.col("transactiondetails.price")),
            "amount",
          ],
        ],
        raw: true,
        include: {
          model: PurchaseHistory,
          as: "transactiondetails",
          attributes: [],
          where: {
            createdAt: {
              [Op.between]: [
                period.toDate().toISOString(),
                afterResult.toDate().toISOString(),
              ],
            },
            orderStatus: "Purchased",
          },
        },
      });
      return { date: period, amount: result[0].amount ? result[0].amount : 0 };
    });
    const resultPeriod = await Promise.all(promises);
    return resultPeriod;
  }
  static async getRevenueFromBoth(startTime, endTime, unit) {
    const range = moment.range(startTime, endTime);
    const periodList = Array.from(range.by(unit));
    const promises = periodList.map(async (period) => {
      const afterResult = await moment(period).add(1, unit + "s");
      const result = await sequelize.query(
        'SELECT SUM(`price`) AS `amount` FROM (SELECT `purchase_histories`.`createdAt` AS `createdAt`,`purchase_histories`.`price` AS `price` FROM `purchase_histories` INNER JOIN `physical_products` ON `purchase_histories`.`productID` = `physical_products`.`id`  WHERE  `purchase_histories`.`createdAt` > :startdate AND  `purchase_histories`.`createdAt` < :enddate  AND `purchase_histories`.`product_type` = "product" UNION ALL SELECT `webinar_product_details`.`createdAt` AS `createdAt`,`webinar_products`.`price_per_seats` as `price` FROM `webinar_product_details` INNER JOIN `webinar_products` ON `webinar_product_details`.`webinar_id` = `webinar_products`.`id`  WHERE  `webinar_product_details`.`createdAt` > :startdate AND  `webinar_product_details`.`createdAt` < :enddate  AND `webinar_product_details`.`seat_status` = "taken") AS `revenue`',
        {
          type: QueryTypes.SELECT,
          replacements: {
            startdate: period.toDate().toISOString(),
            enddate: afterResult.toDate().toISOString(),
          },
        }
      );
      return { date: period, amount: result[0].amount ? result[0].amount : 0 };
    });
    const resultPeriod = await Promise.all(promises);
    return resultPeriod;
  }
  static async getRevenueFromWebinar(startTime, endTime, unit) {
    const range = moment.range(startTime, endTime);
    const periodList = Array.from(range.by(unit));
    const promises = periodList.map(async (period) => {
      const afterResult = await moment(period).add(1, unit + "s");
      const result = await WebinarProduct.findAll({
        attributes: [
          [Sequelize.fn("sum", Sequelize.col("price_per_seats")), "amount"],
        ],
        raw: true,
        include: {
          model: WebinarProductDetail,
          as: "seats_history",
          attributes: [],
          where: {
            createdAt: {
              [Op.between]: [
                period.toDate().toISOString(),
                afterResult.toDate().toISOString(),
              ],
            },
            seat_status: "taken",
          },
        },
      });
      return { date: period, amount: result[0].amount ? result[0].amount : 0 };
    });
    const resultPeriod = await Promise.all(promises);
    return resultPeriod;
  }
  static async getReports(event) {
    const { startDate, endDate } = event.query;
    if (!startDate || !endDate) {
      throw new Error("You should input query for start date and end date");
    }
    const physical_scope = [
      { method: ["withProductInfo", PhysicalProduct, ProductImageList] },
      { method: ["withBuyer", ConsumerUser] },
      { method: ["withFFL", FFLTable] },
      { method: ["withShippingStatus", ShippingItem] },
    ];
    const physical_db_results = await PurchaseHistory.scope(
      ...physical_scope
    ).findAll({
      where: {
        product_type: "product",
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });
    const webinar_scope = [
      { method: ["withCompletedProductInfo", WebinarProduct] },
      { method: ["withWinner", ConsumerUser] },
      { method: ["withFFL", FFLTable] },
      { method: ["withShippingStatus", ShippingItem] },
    ];
    const webinar_db_results = await Winners.scope(...webinar_scope).findAll({
      where: {
        updatedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["updatedAt", "DESC"]],
      raw: true,
      nest: true,
    });
    let physical_results = [];
    let webinar_results = [];
    if (physical_db_results) {
      physical_results = physical_db_results.map((physical_data) => {
        let result = {};
        result.column_name = "Physical Product";
        result.item_no = physical_data.productID;
        result.item_name = physical_data.productInfo.productName;
        result.buyer_name = physical_data.buyer.username;
        result.buyer_phone_number = physical_data.buyer.phone_number;
        result.bought_for = physical_data.productInfo.bought_for.toFixed(2);
        result.sale_price_and_tax = (
          physical_data.price - physical_data.shipping_price
        ).toFixed(2);
        result.tax = physical_data.tax.toFixed(2);
        result.sold_for = (
          physical_data.price -
          physical_data.shipping_price -
          physical_data.tax
        ).toFixed(2);
        result.profit = (result.sold_for - result.bought_for).toFixed(2);
        result.address =
          physical_data.ffl_database && physical_data.ffl_database.location
            ? physical_data.ffl_database.location
            : physical_data.buyer.address;
        result.street_address = result.street_address =
          physical_data.ffl_database &&
          physical_data.ffl_database.street_address
            ? physical_data.ffl_database.street_address
            : physical_data.buyer.street_address;
        result.city = result.city =
          physical_data.ffl_database && physical_data.ffl_database.city
            ? physical_data.ffl_database.city
            : physical_data.buyer.city;
        result.state = result.state =
          physical_data.ffl_database && physical_data.ffl_database.state
            ? physical_data.ffl_database.state
            : physical_data.buyer.state;
        result.zipcode = result.zipcode =
          physical_data.ffl_database && physical_data.ffl_database.zipcode
            ? physical_data.ffl_database.zipcode
            : physical_data.buyer.zipcode;

        result.ffl_database = physical_data.ffl_database;
        result.sold_date = physical_data.createdAt;
        console.log(physical_data);

        result.book_number =
          physical_data.shipping_status &&
          physical_data.shipping_status.book_number
            ? physical_data.shipping_status.book_number
            : "N/A";
        console.log(physical_data.shipping_status.book_number);

        return result;
      });
    }
    if (webinar_db_results) {
      webinar_results = webinar_db_results.map((webinar_data) => {
        let result = {};
        result.column_name = "Webinar";
        result.item_no = webinar_data.webinar_id;
        result.item_name = webinar_data.webinar_parent.name;
        result.buyer_name = webinar_data.user_data.username;
        result.buyer_phone_number = webinar_data.user_data.phone_number;
        result.bought_for = webinar_data.webinar_parent.bought_for.toFixed(2);
        result.sale_price_and_tax = (
          webinar_data.webinar_parent.price_per_seats *
          webinar_data.webinar_parent.seats
        ).toFixed(2);
        result.tax = (process.env.TEXAS_TAX_ENABLE &&
          process.env.TEXAS_TAX_ENABLE == "true" &&
          (webinar_data.user_data.state?.toLowerCase().includes("texas") ||
          webinar_data.user_data.state?.toLowerCase().includes("tx"))
          ? result.sale_price_and_tax * 0.0825
          : 0
        ).toFixed(2);
        result.sold_for = (result.sale_price_and_tax - result.tax).toFixed(2);
        result.profit = (result.sold_for - result.bought_for).toFixed(2);
        result.address =
          webinar_data.ffl_database && webinar_data.ffl_database.location
            ? webinar_data.ffl_database.location
            : webinar_data.user_data.address;
        result.street_address =
          webinar_data.ffl_database && webinar_data.ffl_database.street_address
            ? webinar_data.ffl_database.street_address
            : webinar_data.user_data.street_address;
        result.city =
          webinar_data.ffl_database && webinar_data.ffl_database.city
            ? webinar_data.ffl_database.city
            : webinar_data.user_data.city;
        result.state =
          webinar_data.ffl_database && webinar_data.ffl_database.state
            ? webinar_data.ffl_database.state
            : webinar_data.user_data.state;
        result.zipcode =
          webinar_data.ffl_database && webinar_data.ffl_database.zipcode
            ? webinar_data.ffl_database.zipcode
            : webinar_data.user_data.zipcode;

        result.ffl_database = webinar_data.ffl_database;
        result.sold_date = webinar_data.updatedAt;
        console.log(webinar_data);
        result.book_number =
          webinar_data.shipping_status &&
          webinar_data.shipping_status.book_number
            ? webinar_data.shipping_status.book_number
            : "N/A";
        return result;
      });
    }
    return { result: { physical_results, webinar_results } };
  }
}
