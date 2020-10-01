import { ModelsList } from "../../libs/db";
import { QueryTypes, Op, Sequelize } from "sequelize";
import NotificationService from "../notification";
import NotificationAdminService from "../NotificationAdminServices";
import TextService from "../textService";
import ScheduleService from "../schedule";
import moment from "moment";
import AWS from "aws-sdk";
import WinnersService from "../winners";
import GiftCardService from "../giftCards";
import PromoCodeService from "../promoCode";
const {
  WebinarProductDetail,
  sequelize,
  PhysicalProduct,
  PurchaseHistory,
  WebinarProduct,
  ProductImageList,
  SiteSettings,
  ConsumerUser,
  Winners,
  GiftCard,
  PromoCode,
  FFLTable,
  ShippingItem,
} = ModelsList;

export default class ProductService {
  static async cancelReservedSeats(event) {
    const requestBody = event.body;
    await WebinarProductDetail.destroy({
      where: {
        webinar_id: requestBody.webinar_id,
        user_id: event.requestContext.authorizer.sub,
        seat_status: "reserved",
      },
    });
    return { result: { message: "success" } };
  }

  static async getAllProducts(event) {
    const requestBody = event.body;
    let data = {};
    const scope = [
      { method: ["withPrimaryImage", ProductImageList] },
      { method: ["paginable", requestBody.limit, requestBody.offset] },
    ];
    switch (requestBody.product_type) {
      case "webinar":
        data = await WebinarProduct.scope(...scope).findAndCountAll({
          attributes: [
            "id",
            ["name", "product_name"],
            ["price_per_seats", "product_price"],
            ["remainingSeats", "product_count"],
            ["createdAt", "created_date"],
            [Sequelize.literal(`"webinar"`), "product_type"],
          ],
          order: [["createdAt", "DESC"]],
          where: {
            remainingSeats: { [Op.not]: [0] },
            product_status: "active",
          },
        });

        break;
      case "physical":
        data = await PhysicalProduct.scope(...scope).findAndCountAll({
          attributes: [
            "id",
            ["productName", "product_name"],
            ["pricePerItem", "product_price"],
            ["amount", "product_count"],
            ["createdAt", "created_date"],
            [Sequelize.literal(`"physical"`), "product_type"],
          ],
          order: [["createdAt", "DESC"]],
          where: { amount: { [Op.not]: [0] }, product_status: "active" },
        });
        break;

      case "both":
        if (requestBody.limit != "all") {
          data = await sequelize.query(
            'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS product_count, "physical" AS product_type,`physical_products`.`createdAt` as created_date,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id` FROM `physical_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `physical_products`.`primary_image_id` WHERE product_status = "active" AND `physical_products`.`amount` <> 0  UNION ALL SELECT `webinar_products`.`id` AS id,`webinar_products`.`name` AS product_name,`webinar_products`.`price_per_seats` AS product_price,`webinar_products`.`remainingSeats` AS product_count, "webinar" AS product_type,`webinar_products`.`createdAt` as created_date,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id` FROM `webinar_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `webinar_products`.`primary_image_id` WHERE product_status = "active" AND `webinar_products`.`remainingSeats` <> 0 ORDER BY created_date DESC LIMIT :limit OFFSET :offset',
            {
              nest: true,
              type: QueryTypes.SELECT,
              replacements: {
                limit: parseInt(requestBody.limit, 10),
                offset: parseInt(requestBody.offset, 10),
              },
            }
          );
        } else {
          data = await sequelize.query(
            'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS product_count, "physical" AS product_type,`physical_products`.`createdAt` as created_date,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id` FROM `physical_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `physical_products`.`primary_image_id` WHERE product_status = "active" AND `physical_products`.`amount` <> 0  UNION ALL SELECT `webinar_products`.`id` AS id,`webinar_products`.`name` AS product_name,`webinar_products`.`price_per_seats` AS product_price,`webinar_products`.`remainingSeats` AS product_count, "webinar" AS product_type,`webinar_products`.`createdAt` as created_date,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id` FROM `webinar_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `webinar_products`.`primary_image_id` WHERE product_status = "active" AND `webinar_products`.`remainingSeats` <> 0 ORDER BY created_date DESC',
            {
              nest: true,
              type: QueryTypes.SELECT,
            }
          );
        }
        const [{ count }] = await sequelize.query(
          'SELECT SUM(rows) AS count FROM (SELECT COUNT(*) AS rows FROM `physical_products` WHERE `physical_products`.`product_status` = "active" AND `physical_products`.`amount` <> 0  UNION ALL SELECT COUNT(*) AS rows FROM `webinar_products` WHERE `webinar_products`.`product_status` = "active"  AND `webinar_products`.`remainingSeats` <> 0) AS temp',
          {
            type: QueryTypes.SELECT,
          }
        );
        return { result: { data, count } };
      default:
        throw new Error("You should input correct type");
    }
    return { result: { data: data.rows, count: data.count } };
  }

  static async getPurchaseHistory(event) {
    const requestBody = event.body;
    const counts = await sequelize.query(
      'SELECT COUNT(*) AS count FROM (SELECT `physical_products`.`id` AS id,"physical" AS product_type, `physical_products`.`productName` AS product_name,`purchase_histories`.`createdAt` AS created_date,"" AS seat_number, `purchase_histories`.`price` AS price FROM `purchase_histories` INNER JOIN `physical_products` ON `purchase_histories`.`productID`= `physical_products`.`id` WHERE `purchase_histories`.`product_type`= :product AND `physical_products`.`productName` LIKE :filterString AND `purchase_histories`.`userID` = :user_id UNION ALL SELECT `webinar_product_details`.`id` AS id,"webinar" AS product_type,`webinar_products`.`name` as product_name,`webinar_product_details`.`createdAt` as date,  `webinar_product_details`.`seatNo` as seat_number,`webinar_products`.`price_per_seats` as price FROM `webinar_product_details`  INNER JOIN `webinar_products`   ON `webinar_products`.`id` = `webinar_product_details`.`webinar_id` WHERE `webinar_products`.`name` LIKE :filterString AND `webinar_product_details`.`user_id`=:user_id AND `webinar_product_details`.`seat_status`="taken" ORDER BY created_date DESC) AS histories',
      {
        type: QueryTypes.SELECT,
        replacements: {
          product: "product",
          filterString: `%${requestBody.filterString}%`,
          user_id: event.requestContext.authorizer.sub,
        },
      }
    );
    const physicalresult = await sequelize.query(
      'SELECT `physical_products`.`id` AS id,"physical" AS product_type, `physical_products`.`productName` AS product_name,NULL AS webinar_link,`purchase_histories`.`createdAt` AS created_date,"" AS seat_number,`purchase_histories`.`price` AS price FROM `purchase_histories` INNER JOIN `physical_products` ON `purchase_histories`.`productID`= `physical_products`.`id` WHERE `purchase_histories`.`product_type`= :product AND `physical_products`.`productName` LIKE :filterString AND `purchase_histories`.`userID` = :user_id UNION ALL SELECT `webinar_product_details`.`id` AS id,"webinar" AS product_type,`webinar_products`.`name` as product_name,`webinar_products`.`webinar_link` as webinar_link,`webinar_product_details`.`createdAt` as date,  `webinar_product_details`.`seatNo` as seat_number,`webinar_products`.`price_per_seats` as price FROM `webinar_product_details`  INNER JOIN `webinar_products`   ON `webinar_products`.`id` = `webinar_product_details`.`webinar_id` WHERE `webinar_products`.`name` LIKE :filterString AND `webinar_product_details`.`seat_status`="taken" AND `webinar_product_details`.`user_id`=:user_id ORDER BY created_date DESC LIMIT :limit OFFSET :offset',
      {
        type: QueryTypes.SELECT,
        replacements: {
          product: "product",
          filterString: `%${requestBody.filterString}%`,
          offset: (requestBody.pageNo - 1) * requestBody.limit,
          limit: requestBody.limit,
          user_id: event.requestContext.authorizer.sub,
        },
      }
    );
    return { result: { data: physicalresult, count: counts[0].count } };
  }

  static async getProduct(event) {
    const requestBody = event.body;
    let result = {};
    const scope = [
      { method: ["withImage", ProductImageList] },
      { method: ["withPrimaryImage", ProductImageList] },
    ];
    if (requestBody.product_type && requestBody.product_type === "physical") {
      result = await PhysicalProduct.scope(...scope).findOne({
        attributes: {
          exclude: [
            "bought_for",
            "category_id",
            "publish_method",
            "scheduled_time",
            "primary_image_id",
          ],
        },
        where: {
          amount: { [Op.not]: [0] },
          product_status: "active",
          id: requestBody.id,
        },
      });
      const email = event.body?.email;
      if (email) {
        const user = await ConsumerUser.findOne({
          attributes: ["address", "state"],
          where: { email },
        });
        if (
          process.env.TEXAS_TAX_ENABLE &&
          process.env.TEXAS_TAX_ENABLE == "true" &&
          (user.state?.toLowerCase().includes("tx") ||
            user.state?.toLowerCase().includes("texas")) &&
          result.taxable
        ) {
          result.setDataValue("tax", (result.pricePerItem * 0.0825).toFixed(2));
        } else {
          result.setDataValue("tax", 0.0);
        }
      }
    }
    if (requestBody.product_type === "webinar") {
      result = await WebinarProduct.scope(...scope).findOne({
        attributes: {
          exclude: [
            "bought_for",
            "category_id",
            "publish_method",
            "scheduled_time",
            "primary_image_id",
          ],
        },
        where: {
          remainingSeats: { [Op.not]: [0] },
          product_status: "active",
          id: requestBody.id,
        },
      });
    }
    return { result: { data: result } };
  }

  static async getWebinarReservedStatus(event) {
    await WebinarProductDetail.destroy({
      where: {
        webinar_id: event.params.id,
        seat_status: "reserved",
        reserved_time: {
          [Op.lt]: moment().subtract(5, "minutes").toDate(),
        },
      },
    });
    const allReservedSeats = await WebinarProductDetail.findAll({
      where: {
        webinar_id: event.params.id,
        user_id: event.requestContext.authorizer.sub,
        seat_status: "reserved",
      },
    });
    let result = {};
    if (allReservedSeats.length > 0) {
      result.is_reserved = true;
      result.reserved_date = allReservedSeats[0].reserved_time;
      result.seatNo = await allReservedSeats.map(({ seatNo }) => seatNo);
    } else {
      result.is_reserved = false;
    }
    return { result: { data: result } };
  }

  static async getWebinarSeats(event) {
    const webinar_id = event.params.id;
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
    await allSeats.map((seat) => {
      status_webinar[seat.seatNo] = seat.seat_status;
    });
    return { result: { message: status_webinar } };
  }

  static async getWebinarWinnerHistory(event) {
    const requestBody = event.body;
    const scope = [
      { method: ["withWebinarWon", WebinarProduct, ProductImageList] },
      {
        method: [
          "paginable",
          requestBody.limit,
          (requestBody.pageNo - 1) * requestBody.limit,
        ],
      },
    ];
    const result = await Winners.scope(...scope).findAndCountAll({
      raw: true,
      nest: true,
      attributes: [
        "product_type",
        ["seatNo", "seatsNo"],
        "createdAt",
        [Sequelize.col("webinar.name"), "name"],
        [Sequelize.col("webinar.price_per_seats"), "price_per_seats"],
        [Sequelize.col("webinar.main_image.image_url"), "image_url"],
      ],
      where: {
        "$webinar.name$": {
          [Op.substring]: requestBody.filterString,
        },
        user_id: event.requestContext.authorizer.sub,
      },
      order: [["createdAt", "DESC"]],
    });
    return { result: { count: result.count, data: result.rows } };
  }
  static async sendAlerts(
    product_type,
    product_id,
    service_type,
    product_name,
    product_image,
    webinar_link = null
  ) {
    await NotificationService.createNotification({
      id: product_id,
      product_type,
      service_type,
      product_name,
      product_image,
      webinar_link,
    });
    console.log('service_type', service_type, process.env.ENABLE_PHONE_NOTIFICATION);
    if (
      process.env.ENABLE_PHONE_NOTIFICATION === "true" ||
      service_type === "webinar_start"
    ) {
      console.log('TextService Before Call');
      await TextService.publishNewProductMessage({
        id: product_id,
        product_type,
        service_type,
        product_name,
        webinar_link,
      });
    }
    await NotificationService.sendEmails({
      id: product_id,
      product_type,
      service_type,
      product_name,
      webinar_link,
    });
    return;
  }

  static async purchaseWebinarTicket(event) {
    const requestBody = event.body;
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
        user_id: event.requestContext.authorizer.sub,
        seat_status: "reserved",
        webinar_id: requestBody.webinar_id,
      },
    });
    if (reserved_seats.length > 0) {
      const seatID = await reserved_seats.map((seat) => seat.id);
      const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
      const webinar_product = await WebinarProduct.scope(...scope).findOne({
        where: { id: requestBody.webinar_id },
      });
      if (!webinar_product) {
        throw new Error("We can't find the webinar product with this id");
      }
      const lambda = new AWS.Lambda({
        endpoint: process.env.INVOKE_ENDPOINT,
      });
      const params = {
        FunctionName:
          process.env.SERVICE_NAME +
          "-" +
          process.env.STAGE +
          "-" +
          "chargeCreditCard",
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          user_id: event.requestContext.authorizer.sub,
          product_type: "webinar",
          productID: requestBody.webinar_id,
          seats_count: seatID.length,
          opaqueData: requestBody.opaqueData,
        }),
      };
      const paymentresult = await lambda.invoke(params).promise();
      if (JSON.parse(paymentresult.Payload).code === "1") {
        await WebinarProduct.update(
          {
            remainingSeats:
              webinar_product.remainingSeats - reserved_seats.length,
          },
          { where: { id: requestBody.webinar_id } }
        );
        if (webinar_product.remainingSeats - reserved_seats.length < 1) {
          await WebinarProduct.update(
            {
              product_status: "soldout",
            },
            { where: { id: requestBody.webinar_id } }
          );
          if (webinar_product.publish_method === "queued") {
            await ProductService.releaseQueue();
          }
          await NotificationAdminService.addNotify({
            product_type: "webinar",
            product_name: webinar_product.name,
            service_type: "sold_out",
            product_image: webinar_product.main_image
              ? webinar_product.main_image.image_url
                ? webinar_product.main_image.image_url
                : ""
              : "",
          });
          await NotificationAdminService.sendEmails({
            product_type: "webinar",
            product_name: webinar_product.name,
            service_type: "sold_out",
          });
        }
        await WebinarProductDetail.update(
          { seat_status: "taken" },
          { where: { id: seatID } }
        );
        await TextService.createSubscription({
          id: event.requestContext.authorizer.sub,
          webinar_id: requestBody.webinar_id,
          method: "webinar",
        });
        return { result: { message: "success" } };
      } else {
        console.log(
          "------------payment error webinar----------",
          paymentresult
        );
        throw new Error(paymentresult.Payload);
      }
    } else {
      throw new Error("There are no reserved seats");
    }
  }

  static async releaseQueue() {
    const limit_result = await SiteSettings.findAll({});
    const queued_limit = limit_result[0];
    const existing_count = await WebinarProduct.count({
      where: { publish_method: "queued", product_status: "active" },
    });
    const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
    console.log(queued_limit);
    const queued_webinar_limit = queued_limit.queued_webinar_limit
      ? queued_limit.queued_webinar_limit
      : 1;
    if (existing_count < queued_webinar_limit) {
      const diff = queued_webinar_limit - existing_count;
      const inactive_products = await WebinarProduct.scope(...scope).findAll({
        where: { publish_method: "queued", product_status: "inactive" },
        order: [["createdAt", "ASC"]],
        limit: diff,
      });
      if (inactive_products && inactive_products.length > 0) {
        const promises = inactive_products.map(async (product) => {
          await ProductService.sendAlerts(
            "webinar",
            product.id,
            "new_product",
            product.name,
            product.main_image
              ? product.main_image.image_url
                ? product.main_image.image_url
                : ""
              : ""
          );
          return product.id;
        });
        const ids = await Promise.all(promises);
        if (ids) {
          await WebinarProduct.update(
            { product_status: "active" },
            { where: { id: ids } }
          );
        }
      }
    }
    return;
  }

  static async updateProduct(event) {
    console.log(event.body);
    const requestBody = event.body;
    if (
      requestBody.publish_method &&
      requestBody.publish_method === "scheduled" &&
      !requestBody.scheduled_time
    ) {
      throw new Error("Scheduled Time is required when you set the schedule");
    }
    const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
    switch (event.body.product_type) {
      case "webinar":
        const webinarProduct = await WebinarProduct.findOne({
          where: { id: requestBody.product_id },
        });
        delete requestBody.remainingSeats;
        let hold_queued_case = false;
        if (
          (requestBody.product_status &&
            requestBody.product_status === "soldout") ||
          webinarProduct.product_status === "soldout"
        ) {
          throw new Error("You can't update sold out products");
        }
        if (
          (requestBody.product_status &&
            requestBody.product_status === "progress") ||
          webinarProduct.product_status === "progress"
        ) {
          throw new Error("You can't update progressive products");
        }
        // Correct
        // if (
        //   requestBody.product_status &&
        //   requestBody.product_status === "active" &&
        //   webinarProduct.product_status === "inactive"
        // ) {
        //   requestBody.scheduled_time = new Date();
        //   requestBody.publish_method = "instant";
        // }
        //Active To Hold Case
        if (
          requestBody.product_status &&
          requestBody.product_status === "inactive" &&
          requestBody.publish_method &&
          requestBody.publish_method === "instant"
        ) {
          throw new Error("You can't use inactive and instant in one query");
        }
        if (
          requestBody.publish_method &&
          requestBody.publish_method !== webinarProduct.publish_method &&
          webinarProduct.product_status === "active"
        ) {
          throw new Error("You can't change the publish method while active");
        }
        if (
          requestBody.product_status &&
          (requestBody.product_status === "inactive" ||
            requestBody.product_status === "hold") &&
          webinarProduct.product_status === "active"
        ) {
          if (webinarProduct.publish_method === "queued") {
            hold_queued_case = true;
          }
          requestBody.product_status = "hold";
          requestBody.publish_method = "instant";
          requestBody.scheduled_time = null;
        }
        if (
          (webinarProduct.product_status === "inactive" ||
            webinarProduct.product_status === "hold") &&
          requestBody.product_status &&
          requestBody.product_status === "active" &&
          !(
            requestBody.publish_method &&
            requestBody.publish_method === "instant"
          )
        ) {
          throw new Error(
            "You can't use the product status to activate the product. Use the publish method instead"
          );
        }
        if (requestBody.product_status === "hold") {
          requestBody.publish_method = "instant";
          requestBody.scheduled_time = null;
        }
        // Can't change webinar seats and price when the product is alive
        if (
          webinarProduct.product_status === "active" &&
          ((requestBody.seats && webinarProduct.seats !== requestBody.seats) ||
            (requestBody.price_per_seats &&
              webinarProduct.price_per_seats != requestBody.price_per_seats))
        ) {
          throw new Error(
            "You can't change seats and price while the product is active"
          );
        }
        // Can't change seats and price if any seat is sold
        if (
          webinarProduct.remainingSeats !== webinarProduct.seats &&
          ((requestBody.remainingSeats &&
            requestBody.remainingSeats !== webinarProduct.remainingSeats) ||
            (requestBody.seats && requestBody.seats !== webinarProduct.seats))
        ) {
          throw new Error(
            "You can't change seats and price if any seat is sold"
          );
        }
        if (
          requestBody.seats &&
          webinarProduct.remainingSeats === webinarProduct.seats
        )
        {
          requestBody.remainingSeats = requestBody.seats;
        }
        //set remaining seats to seats
        //Add To Queue
        if (
          requestBody.publish_method &&
          requestBody.publish_method === "queued" &&
          webinarProduct.publish_method === "scheduled"
        ) {
          const limit_result = await SiteSettings.findAll({
            attributes: ["queued_webinar_limit"],
          });
          const queued_limit = limit_result[0].queued_webinar_limit;
          const existing_count = await WebinarProduct.count({
            where: { publish_method: "queued", product_status: "active" },
          });
          requestBody.product_status =
            existing_count < queued_limit ? "active" : "inactive";
          requestBody.scheduled_time = null;
        }
        if (
          requestBody.publish_method &&
          requestBody.publish_method === "scheduled" &&
          !requestBody.scheduled_time
        ) {
          throw new Error("You should set scheduled time");
        }
        //Hold To 3 methods
        if (webinarProduct.product_status === "hold") {
          if (
            requestBody.publish_method === "instant" &&
            requestBody.product_status === "active"
          ) {
            requestBody.scheduled_time = new Date();
            requestBody.product_status = "active";
          }
          if (requestBody.publish_method === "scheduled") {
            requestBody.product_status = "inactive";
          }
          if (requestBody.publish_method === "queued") {
            requestBody.product_status = "inactive";
            requestBody.scheduled_time = null;
            hold_queued_case = true;
          }
        }
        if (webinarProduct.product_status === "inactive") {
          if (
            requestBody.publish_method === "instant" &&
            !(
              requestBody.product_status &&
              requestBody.product_status === "hold"
            )
          ) {
            requestBody.scheduled_time = new Date();
            requestBody.product_status = "active";
          }
        }
        //Queued - Scheduled Case
        //
        await WebinarProduct.update(requestBody, {
          where: { id: requestBody.product_id },
        });
        if (
          requestBody.publish_method == "scheduled" ||
          webinarProduct.publish_method == "scheduled"
        ) {
          await ScheduleService.watchScheduleProductEvent();
        }
        const update_result = await WebinarProduct.scope(...scope).findOne({
          where: { id: requestBody.product_id },
        });
        if (
          (webinarProduct.product_status === "hold" ||
            webinarProduct.product_status === "inactive") &&
          update_result.product_status === "active"
        ) {
          await ProductService.sendAlerts(
            "webinar",
            update_result.id,
            "new_product",
            update_result.name,
            update_result.main_image
              ? update_result.main_image.image_url
                ? update_result.main_image.image_url
                : ""
              : ""
          );
        }
        if (hold_queued_case) await ProductService.releaseQueue();
        break;
      case "physical":
        const physicalProduct = await PhysicalProduct.findOne({
          where: { id: requestBody.product_id },
        });
        if (
          requestBody.product_status &&
          requestBody.product_status === "soldout"
        ) {
          throw new Error("You can't update sold out products");
        }
        if (
          requestBody.product_status &&
          requestBody.product_status === "inactive" &&
          requestBody.publish_method &&
          requestBody.publish_method === "instant"
        ) {
          throw new Error("You can't use inactive and instant in one query");
        }
        if (physicalProduct.product_status === "active") {
          if (
            requestBody.publish_method &&
            physicalProduct.publish_method !== requestBody.publish_method
          ) {
            throw new Error(
              "You can't change publish method while the product is active"
            );
          }
        }
        if (
          (physicalProduct.product_status === "inactive" ||
            physicalProduct.product_status === "hold") &&
          requestBody.product_status &&
          requestBody.product_status === "active" &&
          !(
            requestBody.publish_method &&
            requestBody.publish_method === "instant"
          )
        ) {
          throw new Error(
            "You can't use the product status to activate the product. Use the publish method instead"
          );
        }
        if (physicalProduct.product_status === "hold") {
          if (
            requestBody.publish_method &&
            requestBody.publish_method === "instant"
          ) {
            requestBody.scheduled_time = new Date();
            requestBody.product_status = "active";
            if (
              physicalProduct.amount === 0 &&
              ((requestBody.amount && requestBody.amount === 0) ||
                !requestBody.amount)
            ) {
              throw new Error(
                "You can't activate the product when the amount is empty"
              );
            }
          }
          if (
            requestBody.publish_method &&
            requestBody.publish_method === "scheduled"
          ) {
            if (!requestBody.scheduled_time)
              throw new Error(
                "You can't update the product without the Scheduled Time"
              );
            requestBody.product_status = "inactive";
            requestBody.publish_method = "scheduled";
          }
        }
        if (requestBody.product_status === "hold") {
          requestBody.publish_method = "instant";
          requestBody.scheduled_time = null;
          requestBody.product_status = "hold";
        }
        if (physicalProduct.product_status === "inactive") {
          if (
            requestBody.publish_method === "instant" &&
            !(
              requestBody.product_status &&
              requestBody.product_status === "hold"
            )
          ) {
            requestBody.scheduled_time = new Date();
            requestBody.product_status = "active";
            if (
              physicalProduct.amount === 0 &&
              ((requestBody.amount && requestBody.amount === 0) ||
                !requestBody.amount)
            ) {
              throw new Error(
                "You can't activate the product when the amount is empty"
              );
            }
          }
        }
        if (requestBody.amount && requestBody.amount === 0) {
          requestBody.product_status = "hold";
          requestBody.publish_method = "instant";
          requestBody.scheduled_time = null;
        }
        delete requestBody.original_amount;
        await PhysicalProduct.update(requestBody, {
          where: { id: requestBody.product_id },
        });
        if (
          requestBody.publish_method == "scheduled" ||
          physicalProduct.publish_method == "scheduled"
        ) {
          await ScheduleService.watchScheduleProductEvent();
        }
        const update_result_physical = await PhysicalProduct.scope(
          ...scope
        ).findOne({
          where: { id: requestBody.product_id },
        });
        if (
          (physicalProduct.product_status === "hold" ||
            physicalProduct.product_status === "inactive") &&
          update_result_physical.product_status === "active"
        ) {
          await ProductService.sendAlerts(
            "physical",
            update_result_physical.id,
            "new_product",
            update_result_physical.productName,
            update_result_physical.main_image
              ? update_result_physical.main_image.image_url
                ? update_result_physical.main_image.image_url
                : ""
              : ""
          );
        }
        break;
      default:
        throw new Error("The product type is invalidated");
    }
    return { result: { message: "success" } };
  }
  static async registerPhysicalProduct(event) {
    const requestBody = event.body;
    if (
      requestBody.publish_method &&
      requestBody.publish_method === "scheduled" &&
      !requestBody.scheduled_time
    ) {
      throw new Error("Scheduled Time is required when you set the schedule");
    }
    if (requestBody.imageLists && requestBody.imageLists.length > 10) {
      throw new Error("You can only upload images up to 10 for one product");
    }
    switch (requestBody.publish_method) {
      case "instant":
        requestBody.scheduled_time = new Date();
        requestBody.product_status = "active";
        break;
      case "scheduled":
        const nowTime = new Date();
        requestBody.product_status =
          requestBody.scheduled_time <= nowTime ? "active" : "inactive";
        break;
      default:
        throw new Error("Incorrect Publish Method Parameter");
    }
    requestBody.original_amount = requestBody.amount;
    const product = await PhysicalProduct.create(requestBody);
    let product_image_url = "";
    if (requestBody.imageLists && requestBody.imageLists.length > 0) {
      const uploadImages = await requestBody.imageLists.map((image) => {
        return {
          product_id: product.id,
          product_type: "physical",
          image_url: image,
        };
      });
      await ProductImageList.bulkCreate(uploadImages);
      if (requestBody.mainImage) {
        const main_image_id = await ProductImageList.findOne({
          where: {
            image_url: requestBody.mainImage,
            product_id: product.id,
            product_type: "physical",
          },
        });
        if (main_image_id) {
          product_image_url = main_image_id.image_url;
          await PhysicalProduct.update(
            { primary_image_id: main_image_id.id },
            { where: { id: product.id } }
          );
        }
      }
    }
    if (product.publish_method === "scheduled") {
      await ScheduleService.watchScheduleProductEvent();
    }
    if (product.product_status === "active") {
      await ProductService.sendAlerts(
        "physical",
        product.id,
        "new_product",
        product.productName,
        product_image_url
      );
    }
    return { result: { message: "success" } };
  }

  static async purchasePhysicalProduct(event) {
    const requestBody = event.body;
    const productInfo = await PhysicalProduct.findOne({
      where: { id: requestBody.productID },
    });
    console.log(productInfo);
    if (productInfo) {
      if (productInfo.amount < 1) {
        throw new Error("No stock left");
      }

      const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
      const params = {
        FunctionName: `${process.env.SERVICE_NAME}-${process.env.STAGE}-chargeCreditCard`,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          ...requestBody,
          user_id: event.requestContext.authorizer.sub,
        }),
      };
      const result = JSON.parse(
        (await lambda.invoke(params).promise()).Payload
      );

      if (result.code === "1") {
        if (productInfo.amount - 1 < 1) {
          await PhysicalProduct.update(
            {
              amount: productInfo.amount - 1,
              product_status: "hold",
              publish_method: "instant",
              scheduled_time: null,
            },
            { where: { id: requestBody.productID } }
          );
        } else {
          await PhysicalProduct.update(
            { amount: productInfo.amount - 1 },
            { where: { id: requestBody.productID } }
          );
        }
      } else {
        console.log("---------------payment error-----------", result);
        throw new Error(result.message);
      }
      await PurchaseHistory.create({
        ...requestBody,
        price: productInfo.pricePerItem,
      });
      return { result: { message: "success" } };
    } else {
      throw new Error("No Physical Product");
    }
  }

  static async registerWebinarProduct(event) {
    const requestBody = event.body;
    if (
      requestBody.publish_method &&
      requestBody.publish_method === "scheduled" &&
      !requestBody.scheduled_time
    ) {
      throw new Error("Scheduled Time is required when you set the schedule");
    }
    if (requestBody.imageLists && requestBody.imageLists.length > 10) {
      throw new Error("You can only upload images up to 10 for one product");
    }

    if (!requestBody.webinar_type) {
      throw new Error("You need send 'webinar_type'");
    }

    if (requestBody.webinar_type === "seats") {
      const { remainingSeats } = await WebinarProduct.findOne({
        where: {
          id: requestBody.prize.webinar_id,
        },
      });

      if (remainingSeats - requestBody.prize.seats < 0)
        throw new Error(
          "There are not enough free places in the selected webinar"
        );
    }
    if (
      requestBody.webinar_type === "gifts" &&
      requestBody.prize.length > requestBody.seats
    ) {
      throw new Error("Gifts count should not be greater than seats count!");
    }
    switch (requestBody.publish_method) {
      case "instant":
        requestBody.scheduled_time = new Date();
        requestBody.product_status = "active";
        break;
      case "queued":
        const limit_result = await SiteSettings.findAll({
          attributes: ["queued_webinar_limit"],
        });
        const queued_limit = limit_result[0].queued_webinar_limit;
        const existing_count = await WebinarProduct.count({
          where: { publish_method: "queued", product_status: "active" },
        });
        requestBody.scheduled_time = null;
        requestBody.product_status =
          existing_count < queued_limit ? "active" : "inactive";
        break;
      case "scheduled":
        const nowTime = new Date();
        requestBody.product_status =
          requestBody.scheduled_time <= nowTime ? "active" : "inactive";
        break;
      default:
        throw new Error("Incorrect Publish Method Parameter");
    }
    // delete requestBody.mainImage;
    // delete requestBody.imageLists;
    const webinar = await WebinarProduct.create({
      ...requestBody,
      remainingSeats: requestBody.seats,
    });
    console.log("-------------", event.body);
    let product_image_url = "";
    if (requestBody.imageLists && requestBody.imageLists.length > 0) {
      const uploadImages = await requestBody.imageLists.map((image) => {
        return {
          product_id: webinar.id,
          product_type: "webinar",
          image_url: image,
        };
      });
      await ProductImageList.bulkCreate(uploadImages);
      if (requestBody.mainImage) {
        const main_image_id = await ProductImageList.findOne({
          where: {
            image_url: requestBody.mainImage,
            product_id: webinar.id,
            product_type: "webinar",
          },
        });
        if (main_image_id) {
          product_image_url = main_image_id.image_url;
          await WebinarProduct.update(
            { primary_image_id: main_image_id.id },
            { where: { id: webinar.id } }
          );
        }
      }
    }
    if (webinar.publish_method === "scheduled") {
      await ScheduleService.watchScheduleProductEvent();
    }
    switch (requestBody.webinar_type) {
      case "webinar":
        await WinnersService.registerNormalWebinar(webinar);
        break;
      case "seats":
        await WinnersService.registerSeatsWebinar(
          requestBody.prize,
          webinar.id
        );
        break;
      case "gifts":
        await WinnersService.registerGiftsWebinar(
          requestBody.prize,
          webinar.id
        );
        break;
    }
    const lambda = new AWS.Lambda({ endpoint: process.env.INVOKE_ENDPOINT });
    const params = {
      FunctionName:
        process.env.SERVICE_NAME +
        "-" +
        process.env.STAGE +
        "-" +
        "createtopic",
      InvocationType: "Event",
      Payload: JSON.stringify({ id: webinar.id }),
    };
    await lambda.invoke(params).promise();
    if (webinar.product_status === "active") {
      await ProductService.sendAlerts(
        "webinar",
        webinar.id,
        "new_product",
        webinar.name,
        product_image_url
      );
    }
    return { result: { message: "success" } };
  }

  static async reserveWebinarTicket(event) {
    const requestBody = event.body;
    const seats = await WebinarProduct.findOne({
      where: { id: requestBody.webinar_id },
    });
    if (seats && seats.seats < Math.max(...requestBody.seatNoArray)) {
      throw new Error("Reserved Seat No is larger than the seats_count");
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
        user_id: event.requestContext.authorizer.sub,
      },
    });
    if (reserved_seats.length > 0) {
      throw new Error("You should purchase or cancel reserved the seats");
    }
    const is_seats_existing = await WebinarProductDetail.findAll({
      where: {
        seatNo: requestBody.seatNoArray,
        webinar_id: requestBody.webinar_id,
      },
    });
    let result = {};
    if (is_seats_existing.length > 0) {
      result.reserved_seats = is_seats_existing.map((seat) => seat.seatNo);
      return { result: { data: result, status: "warning" } };
    } else {
      const input_object_arrays = await requestBody.seatNoArray.map(
        (seatNo) => {
          return {
            seat_status: "reserved",
            user_id: event.requestContext.authorizer.sub,
            reserved_time: new Date(),
            seatNo: seatNo,
            webinar_id: requestBody.webinar_id,
          };
        }
      );
      const created_seats = await WebinarProductDetail.bulkCreate(
        input_object_arrays
      );
      return { result: { data: created_seats, status: "success" } };
    }
  }

  // static async uploadImagesToGallery({ body }) {
  //   const count = await ProductImageList.count({
  //     where: { product_type: body.product_type, product_id: body.product_id },
  //   });
  //   if (count + body.imageLists.length > 10) {
  //     throw new Error("You can only upload up to 10 images for one product");
  //   }
  //   const inputArrys = await body.imageLists.map((image) => {
  //     return {
  //       image_url: image,
  //       product_type: body.product_type,
  //       product_id: body.product_id,
  //     };
  //   });
  //   await ProductImageList.bulkCreate(inputArrys);
  //   const imageArrays = await ProductImageList.findAll({
  //     where: { product_type: body.product_type, product_id: body.product_id },
  //   });
  //   return { result: imageArrays };
  // }

  static async uploadImagesToGallery({ body }) {
    console.log(body);
    const count = await ProductImageList.count({
      where: { product_type: body.product_type, product_id: body.product_id },
    });
    console.log(count);
    if (count + body.imageLists.length > 10) {
      throw new Error("You can only upload up to 10 images for one product");
    }
    const inputArrys = await body.imageLists.map((image) => {
      return {
        image_url: image,
        product_type: body.product_type,
        product_id: body.product_id,
      };
    });
    await ProductImageList.bulkCreate(inputArrys);
    const imageArrays = await ProductImageList.findAll({
      where: { product_type: body.product_type, product_id: body.product_id },
    });
    return { result: { data: imageArrays } };
  }

  static async removeImagesFromGallery({ body }) {
    if (body.product_type === "physical") {
      await PhysicalProduct.update(
        { primary_image_id: null },
        {
          where: { id: body.product_id, primary_image_id: body.imageListIds },
        }
      );
    }
    if (body.product_type === "webinar") {
      await WebinarProduct.update(
        { primary_image_id: null },
        {
          where: { id: body.product_id, primary_image_id: body.imageListIds },
        }
      );
    }
    const imageUrls = await ProductImageList.findAll({
      where: { id: body.imageListIds },
      attributes: ["image_url"],
    });
    const s3 = new AWS.S3();
    const promises = await imageUrls.map(async (imageUrl) => {
      var params = {
        Bucket: process.env.S3_IMAGE_BUCKET,
        Key: `${imageUrl}`,
      };
      await s3.deleteObject(params).promise();
      var thumbParams = {
        Bucket: process.env.S3_IMAGE_BUCKET,
        Key: `thumbnail-${imageUrl}`,
      };
      await s3.deleteObject(thumbParams).promise();
    });
    await Promise.all(promises);
    await ProductImageList.destroy({
      where: { id: body.imageListIds },
    });
    return { result: { message: "success" } };
  }

  static async getImageGallery(event) {
    if (!event.query.id || !event.query.product_type) {
      throw new Error("You should filter with id and product_type");
    }
    if (
      event.query.product_type !== "webinar" &&
      event.query.product_type !== "physical"
    ) {
      throw new Error("You should input correct product_type");
    }
    const result = await ProductImageList.findAll({
      where: {
        product_id: event.query.id,
        product_type: event.query.product_type,
      },
    });
    let mainImage;
    if (event.query.product_type === "webinar") {
      mainImage = await WebinarProduct.findOne({
        where: {
          id: event.query.id,
        },
      });
    } else {
      mainImage = await PhysicalProduct.findOne({
        where: {
          id: event.query.id,
        },
      });
    }
    return {
      result: {
        gallery: result,
        mainImage: mainImage.imageUrl ? mainImage.imageUrl : null,
      },
    };
  }

  static async getProductForAdmin(event) {
    // I should add gallery
    if (!event.query.id || !event.query.product_type) {
      throw new Error("You should filter with id and product_type");
    }
    if (
      event.query.product_type !== "webinar" &&
      event.query.product_type !== "physical"
    ) {
      throw new Error("You should input correct product_type");
    }
    let product = {};
    const scope = [
      { method: ["withImage", ProductImageList] },
      { method: ["withPrimaryImage", ProductImageList] },
    ];
    if (event.query.product_type === "webinar") {
      product = await WebinarProduct.scope(...scope).findOne({
        where: {
          id: event.query.id,
        },
        attributes: {
          include: [[Sequelize.literal(`"webinar"`), "product_type"]],
        },
      });
    } else {
      product = await PhysicalProduct.scope(...scope).findOne({
        where: {
          id: event.query.id,
        },
        attributes: {
          include: [[Sequelize.literal(`"physical"`), "product_type"]],
        },
      });
    }
    return { result: product };
  }
  static async getProductsForListingOptions(event) {
    let result = {};
    console.log(event.query);
    if (
      !event.query.filterByStatus ||
      !event.query.product_type ||
      !event.query.limit ||
      !event.query.offset
    )
      throw new Error(
        "filterByStatus , product_type, limit, offset is required"
      );
    let filter;
    switch (event.query.filterByStatus) {
      case "all":
        filter = ["active", "inactive", "hold"];
        break;
      case "active":
        filter = ["active"];
        break;
      case "inactive":
        filter = ["inactive", "hold"];
        break;
      case "hold":
        filter = ["hold"];
        break;
      default:
        throw new Error("You should input the filter!");
    }
    const scope = [
      { method: ["withPrimaryImage", ProductImageList] },
      {
        method: ["paginable", event.query.limit, event.query.offset],
      },
    ];
    const filterString = event.query.filterString
      ? event.query.filterString
      : "";
    const total_live_count = await WebinarProduct.count({
      where: { product_status: "active" },
    });
    switch (event.query.product_type) {
      case "webinar":
        result = await WebinarProduct.scope(...scope).findAndCountAll({
          attributes: [
            "id",
            "product_status",
            "shortDescription",
            "scheduled_time",
            ["name", "product_name"],
            ["price_per_seats", "product_price"],
            ["createdAt", "created_date"],
            ["remainingSeats", "Quantity"],
            "publish_method",
            [Sequelize.literal(`"Webinar"`), "product_type"],
          ],
          order: [["createdAt", "DESC"]],
          where: {
            [Op.or]: [
              {
                product_status: filter,
                publish_method: ["instant", "scheduled"],
              },
              (event.query.filterByStatus === "all" ||
                event.query.filterByStatus === "active") && {
                product_status: "active",
                publish_method: ["queued"],
              },
            ],
            name: {
              [Op.like]: `%${filterString}%`,
            },
          },
        });
        return { result: { ...result, total_live_count } };
      case "physical":
        result = await PhysicalProduct.scope(...scope).findAndCountAll({
          attributes: [
            "id",
            "product_status",
            "shortDescription",
            "scheduled_time",
            ["productName", "product_name"],
            ["pricePerItem", "product_price"],
            ["createdAt", "created_date"],
            ["amount", "Quantity"],
            [Sequelize.literal(`"Physical"`), "product_type"],
            "publish_method",
          ],
          order: [["createdAt", "DESC"]],
          where: {
            product_status: filter,
            publish_method: ["instant", "scheduled"],
            productName: {
              [Op.like]: `%${filterString}%`,
            },
          },
        });
        console.log(result);
        return { result: { ...result, total_live_count } };
      case "both":
        if (
          event.query.filterByStatus === "active" ||
          event.query.filterByStatus === "all"
        ) {
          let replacements;
          if (event.query.limit !== "all") {
            replacements = {
              filter: filter,
              method: ["instant", "scheduled"],
              limit: parseInt(event.query.limit, 10),
              offset: parseInt(event.query.offset, 10),
              filterString: `%${filterString}%`,
            };
            result = await sequelize.query(
              'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS Quantity,`physical_products`.`scheduled_time`, "Physical" AS product_type,`physical_products`.`createdAt` as created_date,`physical_products`.`product_status` AS product_status,`physical_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`physical_products`.`publish_method` FROM `physical_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `physical_products`.`primary_image_id` WHERE product_status IN(:filter)  AND `physical_products`.`publish_method` IN(:method) AND `physical_products`.`productName` LIKE :filterString  UNION ALL SELECT `webinar_products`.`id` AS id,`webinar_products`.`name` AS product_name,`webinar_products`.`price_per_seats` AS product_price,`webinar_products`.`remainingSeats` AS Quantity,`webinar_products`.`scheduled_time`, "Webinar" AS product_type,`webinar_products`.`createdAt` as created_date,`webinar_products`.`product_status` AS product_status,`webinar_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`webinar_products`.`publish_method` FROM `webinar_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `webinar_products`.`primary_image_id` WHERE ((product_status IN(:filter)  AND `webinar_products`.`publish_method` IN(:method)) OR (product_status = "active" AND publish_method = "queued")) AND `webinar_products`.`name` LIKE :filterString ORDER BY created_date DESC LIMIT :limit OFFSET :offset',
              {
                nest: true,
                type: QueryTypes.SELECT,
                replacements,
              }
            );
          } else {
            replacements = {
              filter: filter,
              method: ["instant", "scheduled"],
              filterString: `%${filterString}%`,
            };
            result = await sequelize.query(
              'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS Quantity,`physical_products`.`scheduled_time`, "Physical" AS product_type,`physical_products`.`createdAt` as created_date,`physical_products`.`product_status` AS product_status,`physical_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`physical_products`.`publish_method` FROM `physical_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `physical_products`.`primary_image_id` WHERE product_status IN(:filter)  AND `physical_products`.`publish_method` IN(:method) AND `physical_products`.`productName` LIKE :filterString  UNION ALL SELECT `webinar_products`.`id` AS id,`webinar_products`.`name` AS product_name,`webinar_products`.`price_per_seats` AS product_price,`webinar_products`.`remainingSeats` AS Quantity,`webinar_products`.`scheduled_time`, "Webinar" AS product_type,`webinar_products`.`createdAt` as created_date,`webinar_products`.`product_status` AS product_status,`webinar_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`webinar_products`.`publish_method` FROM `webinar_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `webinar_products`.`primary_image_id` WHERE ((product_status IN(:filter)  AND `webinar_products`.`publish_method` IN(:method)) OR (product_status = "active" AND publish_method = "queued")) AND `webinar_products`.`name` LIKE :filterString ORDER BY created_date DESC',
              {
                nest: true,
                type: QueryTypes.SELECT,
                replacements,
              }
            );
          }
          const [{ count }] = await sequelize.query(
            'SELECT SUM(rows) AS count FROM (SELECT COUNT(*) AS rows FROM `physical_products` WHERE `physical_products`.`product_status` IN(:filter) AND `physical_products`.`publish_method` IN(:method) AND `physical_products`.`productName` LIKE :filterString  UNION ALL SELECT COUNT(*) AS rows FROM `webinar_products` WHERE ((product_status IN(:filter)  AND `webinar_products`.`publish_method` IN(:method)) OR (product_status = "active" AND publish_method = "queued")) AND `webinar_products`.`name` LIKE :filterString) AS temp',
            {
              type: QueryTypes.SELECT,
              replacements: {
                filter: filter,
                method: ["instant", "scheduled"],
                filterString: `%${filterString}%`,
              },
            }
          );
          return { result: { rows: result, count: count, total_live_count } };
        } else {
          let replacements;
          if (event.query.limit !== "all") {
            replacements = {
              filter: filter,
              method: ["instant", "scheduled"],
              limit: parseInt(event.query.limit, 10),
              offset: parseInt(event.query.offset, 10),
              filterString: `%${filterString}%`,
            };
            result = await sequelize.query(
              'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS Quantity,`physical_products`.`scheduled_time`, "Physical" AS product_type,`physical_products`.`createdAt` as created_date,`physical_products`.`product_status` AS product_status,`physical_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`physical_products`.`publish_method` FROM `physical_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `physical_products`.`primary_image_id` WHERE product_status IN(:filter)  AND `physical_products`.`publish_method` IN(:method) AND `physical_products`.`productName` LIKE :filterString  UNION ALL SELECT `webinar_products`.`id` AS id,`webinar_products`.`name` AS product_name,`webinar_products`.`price_per_seats` AS product_price,`webinar_products`.`remainingSeats` AS Quantity,`webinar_products`.`scheduled_time`, "Webinar" AS product_type,`webinar_products`.`createdAt` as created_date,`webinar_products`.`product_status` AS product_status,`webinar_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`webinar_products`.`publish_method` FROM `webinar_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `webinar_products`.`primary_image_id` WHERE product_status IN(:filter)  AND `webinar_products`.`publish_method` IN(:method) AND `webinar_products`.`name` LIKE :filterString ORDER BY created_date DESC LIMIT :limit OFFSET :offset',
              {
                nest: true,
                type: QueryTypes.SELECT,
                replacements,
              }
            );
          } else {
            replacements = {
              filter: filter,
              method: ["instant", "scheduled"],
              filterString: `%${filterString}%`,
            };
            result = await sequelize.query(
              'SELECT `physical_products`.`id` AS id,`physical_products`.`productName` AS product_name,`physical_products`.`pricePerItem` AS product_price,`physical_products`.`amount` AS Quantity,`physical_products`.`scheduled_time`, "Physical" AS product_type,`physical_products`.`createdAt` as created_date,`physical_products`.`product_status` AS product_status,`physical_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`physical_products`.`publish_method` FROM `physical_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `physical_products`.`primary_image_id` WHERE product_status IN(:filter)  AND `physical_products`.`publish_method` IN(:method) AND `physical_products`.`productName` LIKE :filterString  UNION ALL SELECT `webinar_products`.`id` AS id,`webinar_products`.`name` AS product_name,`webinar_products`.`price_per_seats` AS product_price,`webinar_products`.`remainingSeats` AS Quantity,`webinar_products`.`scheduled_time`, "Webinar" AS product_type,`webinar_products`.`createdAt` as created_date,`webinar_products`.`product_status` AS product_status,`webinar_products`.`shortDescription`,`product_image_lists`.`image_url` AS `main_image.image_url`,`product_image_lists`.`id` AS `main_image.id`,`webinar_products`.`publish_method` FROM `webinar_products` LEFT JOIN `product_image_lists` ON `product_image_lists`.`id` = `webinar_products`.`primary_image_id` WHERE product_status IN(:filter)  AND `webinar_products`.`publish_method` IN(:method) AND `webinar_products`.`name` LIKE :filterString ORDER BY created_date DESC',
              {
                nest: true,
                type: QueryTypes.SELECT,
                replacements,
              }
            );
          }
          const [{ count }] = await sequelize.query(
            "SELECT SUM(rows) AS count FROM (SELECT COUNT(*) AS rows FROM `physical_products` WHERE `physical_products`.`product_status` IN(:filter) AND `physical_products`.`publish_method` IN(:method) AND `physical_products`.`productName` LIKE :filterString  UNION ALL SELECT COUNT(*) AS rows FROM `webinar_products` WHERE `webinar_products`.`product_status` IN(:filter)  AND `webinar_products`.`publish_method` IN(:method) AND `webinar_products`.`name` LIKE :filterString) AS temp",
            {
              type: QueryTypes.SELECT,
              replacements: {
                filter: filter,
                method: ["instant", "scheduled"],
                filterString: `%${filterString}%`,
              },
            }
          );
          return { result: { rows: result, count: count, total_live_count } };
        }

      default:
        throw new Error("Wrong Product Type Filter!");
    }
  }

  static async getQueueList(event) {
    if (
      !event.query.queue_type ||
      !(
        event.query.queue_type === "queued" ||
        event.query.queue_type === "scheduled"
      )
    )
      throw new Error("You should input queue type correctly!");
    const filterString = event.query.filterString
      ? event.query.filterString
      : "";
    const scope = [
      { method: ["withPrimaryImage", ProductImageList] },
      {
        method: ["paginable", event.query.limit, event.query.offset],
      },
    ];
    const result = await WebinarProduct.scope(...scope).findAndCountAll({
      attributes: [
        "id",
        "name",
        "shortDescription",
        "price_per_seats",
        "seats",
        "publish_method",
        "scheduled_time",
        "webinar_type",
      ],
      where: {
        publish_method: event.query.queue_type,
        product_status: "inactive",
        name: { [Op.like]: `%${filterString}%` },
      },
      order: [["createdAt", "DESC"]],
    });
    const limit_result = await SiteSettings.findAll({
      attributes: ["queued_webinar_limit"],
    });
    const queued_limit = limit_result[0];
    return {
      result: {
        ...result,
        webinar_queue_limit: queued_limit.queued_webinar_limit,
      },
    };
  }

  static async getWebinarSoldOut(event) {
    const filterString = event.query.filterString
      ? event.query.filterString
      : "";
    const scope = [
      { method: ["withPrimaryImage", ProductImageList] },
      {
        method: ["paginable", event.query.limit, event.query.offset],
      },
    ];
    const result = await WebinarProduct.scope(...scope).findAndCountAll({
      attributes: [
        "id",
        "name",
        "shortDescription",
        ["price_per_seats", "price"],
        "webinar_type",
        "seats",
        "product_status",
      ],
      where: {
        product_status: ["soldout", "progress"],
        name: { [Op.like]: `%${filterString}%` },
      },
      order: [["createdAt", "DESC"]],
    });
    return { result };
  }

  static async startLiveStream(event) {
    if (!event.body.webinar_link)
      throw new Error("You should input webinar link!");
    if (!event.query.product_id) {
      throw new Error("You should input product_id in the query");
    }
    const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
    const result = await WebinarProduct.scope(...scope).findOne({
      where: { id: event.query.product_id },
    });
    if (!result) {
      throw new Error("There is no such product!");
    }
    if (result.product_status !== "soldout") {
      throw new Error("You can't start webinar product which is not sold out");
    }
    await WebinarProduct.update(
      { webinar_link: event.body.webinar_link, product_status: "progress" },
      {
        where: { id: event.query.product_id },
      }
    );
    const message = `${event.body.webinar_link} ${event.body.start_date || ""}`;
    await ProductService.sendAlerts(
      "webinar",
      result.id,
      "webinar_start",
      result.name,
      result.main_image
        ? result.main_image.image_url
          ? result.main_image.image_url
          : ""
        : "",
      message
    );
    return { result: { message: "success" } };
  }
  static async getSoldPhysicalForAdmin(event) {
    const { filterString, offset, limit } = event.query;
    const scope = [
      { method: ["withProductInfo", PhysicalProduct, ProductImageList] },
      { method: ["withBuyer", ConsumerUser] },
      { method: ["withFFL", FFLTable] },
      { method: ["withShippingStatus", ShippingItem] },
      { method: ["paginable", limit, offset] },
    ];

    const result = await PurchaseHistory.scope(...scope).findAndCountAll({
      where: {
        product_type: "product",
        [Op.or]: [
          {
            "$buyer.username$": {
              [Op.substring]: filterString,
            },
          },
          {
            "$buyer.email$": {
              [Op.substring]: filterString,
            },
          },
          {
            "$buyer.address$": {
              [Op.substring]: filterString,
            },
          },
          {
            "$buyer.phone_number$": {
              [Op.substring]: filterString,
            },
          },
          {
            "$productInfo.productName$": {
              [Op.substring]: filterString,
            },
          },
          {
            price: {
              [Op.substring]: filterString,
            },
          },
        ],
      },
      order: [
        ["ffl_id", "ASC"],
        ["ffl_not_required", "ASC"],
        ["createdAt", "DESC"],
      ],
    });
    const ffl_data = await FFLTable.findAll({ where: { is_removed: false } });
    return { result: { ...result, ffl_data } };
  }

  static async setFFLToPhysical(event) {
    const { purchase_id, ffl_id, ffl_not_required } = event.body;
    if (!ffl_id && !ffl_not_required) {
      throw new Error("You can not disable ffl selection");
    }
    const scope = [{ method: ["withShippingStatus", ShippingItem] }];
    const previousResult = await PurchaseHistory.scope(...scope).findOne({
      where: { id: purchase_id },
    });
    if (
      previousResult.shipping_status &&
      previousResult.shipping_status.shipping_status != "not_printed"
    ) {
      throw new Error(
        "You can't update the FFL while the shipping item is in printed or shipped status"
      );
    }
    const updateQuery = ffl_not_required
      ? { ffl_id: null, ffl_not_required }
      : { ffl_id, ffl_not_required: false };
    await PurchaseHistory.update(updateQuery, { where: { id: purchase_id } });
    if (!previousResult.ffl_not_required && previousResult.ffl_id === null) {
      await ShippingItem.create({
        purchase_or_winner_id: purchase_id,
        shipping_status: "not_printed",
        product_type: "physical",
        is_grouped: true,
      });
    }
    return { result: { message: "success" } };
  }
  static async getCompletedWebinarsForAdmin(event) {
    const { limit, offset, filterString } = event.query;
    const scope = [
      { method: ["withWebinarWon", WebinarProduct, ProductImageList] },
      { method: ["withFFL", FFLTable] },
      { method: ["withWinner", ConsumerUser] },
      { method: ["withShippingStatus", ShippingItem] },
    ];
    if (limit != "all") {
      scope.push({ method: ["paginable", limit, offset] });
    }

    const result = await Winners.scope(...scope).findAndCountAll({
      order: [
        ["ffl_id", "ASC"],
        ["ffl_not_required", "ASC"],
        ["createdAt", "DESC"],
      ],
      where: {
        user_id: {
          [Op.not]: null,
        },
        [Op.or]: [
          {
            "$user_data.username$": {
              [Op.substring]: filterString,
            },
          },
          {
            "$webinar.name$": {
              [Op.substring]: filterString,
            },
          },
          {
            "$user_data.address$": {
              [Op.substring]: filterString,
            },
          },
        ],
      },
    });
    const ffl_data = await FFLTable.findAll({ where: { is_removed: false } });
    return { result: { ...result, ffl_data } };
  }

  static async getCompletedWebinarsWithPromoCode({ query: { limit, offset } }) {
    const scope = [
      { method: ["withPrimaryImage", ProductImageList] },
      { method: ["paginable", limit, offset] },
    ];

    const result = await WebinarProduct.scope(...scope).findAndCountAll({
      where: {
        product_status: "done",
      },
      include: [
        {
          model: Winners,
          as: "winners",
          include: [
            {
              model: ConsumerUser,
              as: "user_data",
            },
            {
              model: GiftCard,
              as: "gifts",
            },
            {
              model: PromoCode,
              as: "seats",
              include: [
                {
                  model: WebinarProduct,
                  as: "webinar",
                },
              ],
            },
          ],
        },
      ],
      distinct: true,
      order: [["updatedAt", "DESC"]],
    });

    const ffl = await FFLTable.findAll({ where: { is_removed: false } });

    return {
      result: {
        result,
        ffl,
      },
    };
  }

  static async setFFLToWinner(event) {
    const { winner_id, ffl_id, ffl_not_required } = event.body;
    if (!ffl_id && !ffl_not_required) {
      throw new Error("You can not disable ffl selection");
    }
    const scope = [{ method: ["withShippingStatus", ShippingItem] }];
    const previousResult = await Winners.scope(...scope).findOne({
      where: { id: winner_id },
    });
    if (
      previousResult.shipping_status &&
      previousResult.shipping_status.shipping_status != "not_printed"
    ) {
      throw new Error(
        "You can't update the FFL while the shipping item is in printed or shipped status"
      );
    }
    const updateQuery = ffl_not_required
      ? { ffl_id: null, ffl_not_required }
      : { ffl_id, ffl_not_required: false };
    await Winners.update(updateQuery, {
      where: { id: winner_id, product_type: ["webinar", "physical"] },
    });
    if (!previousResult.ffl_not_required && previousResult.ffl_id === null) {
      await ShippingItem.create({
        purchase_or_winner_id: winner_id,
        shipping_status: "not_printed",
        product_type: "webinar",
        is_grouped: true,
      });
    }
    return { result: { message: "success" } };
  }
  static async getUserForWebinar({
    params: { webinar_id },
    query: { limit, offset, filterString },
  }) {
    const scope = [
      { method: ["withUsers", ConsumerUser] },
      { method: ["paginable", limit, offset] },
    ];
    const filterParam = filterString || "";
    const users = await WebinarProductDetail.scope(...scope).findAndCountAll({
      where: [
        { webinar_id, seat_status: "taken" },
        Sequelize.where(
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("user.first_name"),
            " ",
            Sequelize.col("user.last_name")
          ),
          {
            [Op.substring]: filterParam,
          }
        ),
      ],
      order: [["seatNo", "ASC"]],
    });
    const won_scope = [
      { method: ["withProduct", PromoCode, "seats"] },
      { method: ["withProduct", GiftCard, "gifts"] },
      { method: ["withProduct", WebinarProduct, "webinar"] },
    ];

    const won_item = await Winners.scope(...won_scope).findAll({
      where: { webinar_id },
      order: ["position"],
    });

    return { result: { users, won_item } };
  }

  static async setWinnersToWonItem({
    body: { webinar_type, gifts, webinar_id },
  }) {
    switch (webinar_type) {
      case "gifts":
        GiftCardService.setUserToCard(gifts);
        break;
      case "seats":
        PromoCodeService.setUserPromoCode(gifts);
        break;
      case "webinar":
        break;
      default:
        throw new Error("Send 'webinar_type'");
    }
    await WinnersService.setWinners(gifts, webinar_id, webinar_type);
    await WebinarProduct.update(
      { product_status: "done" },
      { where: { id: webinar_id } }
    );
    return { result: { message: "success" } };
  }

  static async getTakenSeatsWebinar({
    query: { limit, offset },
    params: { id },
  }) {
    const scope = [{ method: ["paginable", limit, offset] }];
    const result = await PurchaseHistory.scope(...scope).findAndCountAll({
      where: {
        productID: id,
        product_type: "webinar",
        orderStatus: "Purchased",
      },
      include: [
        {
          model: ConsumerUser,
          as: "buyer",
          attributes: ["username", "first_name", "last_name", "email"],
        },
        {
          model: WebinarProduct,
          as: "webinar_product",
          attributes: ["price_per_seats"],
        },
      ],
    });
    return { result };
  }
}
