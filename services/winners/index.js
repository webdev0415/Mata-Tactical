import { ModelsList } from "../../libs/db";
import GiftCardService from "../giftCards";
import PromoCodeService from "../promoCode";
import NotificationService from "../notification";
import { PurchaseHistory } from "../../models";
import AWS from "aws-sdk";
import NotificationAdminServices from "../NotificationAdminServices";
const {
  Winners,
  WebinarProduct,
  ProductImageList,
  GiftCard,
  PromoCode,
  NotificationList,
  NotificationState,
} = ModelsList;

export default class WinnersService {
  static async addWinners({ body }) {
    const data = await Winners.bulkCreate(body);
    return { result: { data } };
  }

  static async updateWinners({ body }) {
    const data = await Winners.bulkCreate(body, {
      updateOnDuplicate: ["ffl_id"],
    });
    return { result: { data } };
  }

  static async registerNormalWebinar({ id }) {
    Winners.create({
      product_id: id,
      webinar_id: id,
      product_type: "webinar",
      position: 1,
    });
  }

  static async registerGiftsWebinar(cards, webinar_id) {
    const items = await GiftCardService.createWonCards(cards);
    const data = {
      product_type: "gift_card",
      webinar_id,
    };
    return await Winners.bulkCreate(
      items.map((item, i) => ({
        ...data,
        product_id: item.id,
        position: i + 1,
      }))
    );
  }

  static async registerSeatsWebinar(prize, webinar_id) {
    const items = await PromoCodeService.createWonPromoCode(prize);
    const data = {
      product_type: "promo_code",
      webinar_id,
    };
    return await Winners.bulkCreate(
      items.map((item, i) => ({
        ...data,
        product_id: item.id,
        position: i + 1,
      }))
    );
  }

  static async setWinners(prize, webinar_id, product_type) {
    await Promise.all(
      prize.map(async ({ user_id, id, seatNo, product_id }) => {
        const purchase_info = await PurchaseHistory.findOne({
          attributes: ["shipping_address","street_address","zipcode","city","state"],
          where: {
            seatsNo: seatNo,
            productID: webinar_id,
            product_type: "webinar",
          },
        });
        console.log(purchase_info);
        return await Winners.update(
          {
            user_id,
            seatNo,
            shipping_address: purchase_info.shipping_address,
            zipcode: purchase_info.zipcode,
            city: purchase_info.city,
            state: purchase_info.state,
            street_address: purchase_info.street_address
          },
          { where: { product_id: id } }
        );
      })
    );

    if (product_type === "seats") {
      const webinar = await WebinarProduct.findOne({
        where: { id: prize[0].product_id },
      });
      const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
      const original_webinar = await WebinarProduct.scope(...scope).findOne({
        where: { id: webinar_id },
      });
      console.log("webinar", webinar);
      if (webinar.product_status === "done" && webinar.product.status === 'soldout' && webinar.product.status === 'progress') {
        console.log("service");
        const lambda = new AWS.Lambda({
          endpoint: process.env.INVOKE_ENDPOINT,
        });
        const emailparams = {
          FunctionName:
            process.env.SERVICE_NAME +
            "-" +
            process.env.STAGE +
            "-" +
            "sendemails",
          InvocationType: "Event",
          Payload: JSON.stringify({
            product_type: "webinar",
            service_type: "promo_code_sold_out",
            product_name: original_webinar.name,
            sold_out_product_name: webinar.name,
          }),
        };
        await lambda.invoke(emailparams).promise();
        await NotificationAdminServices.addNotify({
          product_type: "webinar",
          product_name: original_webinar.name,
          product_image: original_webinar.main_image
            ? original_webinar.main_image.image_url
              ? original_webinar.main_image.image_url
              : ""
            : "",
          service_type: "promo_code_sold_out",
          prize_item_name: webinar.name,
        });
        return;
      }
    }

    await Promise.all(
      prize.map(async (el) => {
        let product_name = "";
        let beforeName = "";
        switch (product_type) {
          case "seats":
            product_name = "id";
            beforeName = "promo code";
            break;
          case "gifts":
            product_name = "amount";
            beforeName = "$ gift card";
            break;
          case "webinar":
            product_name = "name";
            break;
        }
        let notify = {};
        if (product_type === "webinar") {
          const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
          const result = await WebinarProduct.scope(...scope).findOne({
            where: {
              id: el.id,
            },
          });
          notify = {
            product_id: el.id,
            product_type,
            service_type: "won",
            product_name: result.name,
            product_image: result.main_image
              ? result.main_image.image_url
                ? result.main_image.image_url
                : ""
              : "",
          };
        } else {
          notify = {
            product_id: el.id,
            product_type,
            service_type: "won",
            product_name: `${el[product_name]} ${beforeName}`,
            product_image: "",
          };
        }
        const savedNotify = await NotificationList.create(notify);

        return await NotificationState.create({
          user_id: el.user_id,
          notification_id: savedNotify.id,
          notification_status: "created",
        });
      })
    );

    await NotificationService.sendEmails({
      id: webinar_id,
      product_type,
      service_type: "won",
    });

    return;
  }

  static async getWonItem(req) {
    const user_id = req.requestContext.authorizer.sub;
    const scope = [
      { method: ["withWebinarWon", WebinarProduct, ProductImageList] },
    ];
    const wonItem = await Winners.scope(...scope).findAll({
      where: { user_id, product_type: "webinar" },
    });
    return { result: wonItem.map((el) => el.webinar) };
  }
  static async getRewards(req) {
    const user_id = req.requestContext.authorizer.sub;
    const gifts = await GiftCard.findAll({
      where: { user_id },
      order: [["createdAt", "DESC"]],
    });
    const promoCode_scope = [{ method: ["withWebinar", WebinarProduct] }];
    const promoCode = await PromoCode.scope(...promoCode_scope).findAll({
      where: { user_id },
    });
    return { result: { gifts, promoCode } };
  }
}
