import { Op } from "sequelize";
import { ModelsList } from "../../libs/db";
import NotificationAdminServices from "../NotificationAdminServices";
import moment from "moment";
import NotificationService from "../notification";
const { PromoCode, WebinarProduct, ProductImageList } = ModelsList;

export default class PromoCodeService {
  static async createPromoCode({ body }) {
    if (!body.date_from) throw new Error("The field 'date_from' is required");
    if (!body.date_to) throw new Error("The field 'date_to' is required");
    const result = await PromoCode.create(body);
    return { result };
  }

  static async getAll({ query: { limit, offset } }) {
    const scope = [{ method: ["paginable", limit, offset] }];
    const result = await PromoCode.scope(...scope).findAndCountAll({
      where: {
        type: "created",
      },
    });
    return { result };
  }

  static async createWonPromoCode({ webinar_id, seats }) {
    const updateData = {
      code_type: "seat",
      product_type: "webinar",
      product_id: webinar_id,
      number_used: 1,
      type: "won",
      amount: 1,
      code: null,
    };
    return await PromoCode.bulkCreate(Array.from({ length: seats }, () => updateData));
  }

  static async setUserPromoCode(data) {
    const webinar = await WebinarProduct.findOne({ where: { id: data[0].product_id } });
    if (webinar.product_status === "soldout" && webinar.product_status === "done" && webinar.product_status === "progress") return;
    const result = await PromoCode.bulkCreate(data, {
      updateOnDuplicate: ["user_id"],
      ignoreDuplicates: true,
    });
    return result;
  }

  static async getPromoCodeUser(req) {
    return {
      result: await PromoCode.findAll({ where: { user_id: req.requestContext.authorizer.sub } }),
    };
  }

  static async checkUsingCode(webinar_id) {
    const records = await PromoCode.count({
      where: {
        product_id: webinar_id,
        number_used: {
          [Op.gt]: 0,
        },
        user_id: {
          [Op.not]: null,
        },
      },
    });

    if (records) {
      const scope = [{ method: ["withPrimaryImage", ProductImageList] }];
      const webinar = await WebinarProduct.scope(...scope).findOne({ where: { id: webinar_id } });
      const payload = {
        product_type: "promo_code",
        service_type: "unused_promo_code",
        product_name: webinar.name,
        product_image: webinar.main_image.image_url,
      };
      await NotificationAdminServices.addNotify(payload);
      await NotificationService.sendEmails(payload);
    }
  }

  static async findPromoCod({ query: { code } }) {
    const result = await PromoCode.findOne({ where: { [Op.or]: [{ code }, { id: code }] } });

    if (!result) {
      throw new Error("Promo code not found");
    }
    if (result.date_from && result.date_to) {
      const isValid = moment().isBetween(moment(result.date_from), moment(result.date_to));

      if (!isValid) {
        throw new Error("You cannot use this promo code now.");
      }
    }

    if (result && result.number_used === 0) {
      throw new Error("You cannot use this promo code now.");
    }
    return { result };
  }
}
