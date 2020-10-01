import { ModelsList } from "../../libs/db";
import { Sequelize } from "sequelize";
const {
  ShippingItem,
  PurchaseHistory,
  PhysicalProduct,
  WebinarProduct,
  ConsumerUser,
  FFLTable,
  Winners,
} = ModelsList;
export default class ShippingService {
  static async getShippingItems(event) {
    const { shipping_status } = event.query;
    const limit = event.query.limit;
    const offset = event.query.offset;
    // const is_grouped = event.query.is_grouped == "true";
    const scopes = [
      {
        method: [
          "withShippingItem",
          PurchaseHistory,
          Winners,
          PhysicalProduct,
          WebinarProduct,
          ConsumerUser,
          FFLTable,
        ],
      },
    ];
    const shipTable =
      process.env.STAGE == "local"
        ? "ShippingItem"
        : "ShippingItem_ShippingItem";
    const items = await ShippingItem.scope(...scopes).findAll({
      attributes: [
        [
          Sequelize.literal(
            "(CASE WHEN " +
              shipTable +
              ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`shipping_address` ELSE `webinar_shipping->ffl_database`.`location` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`shipping_address` ELSE `physical_shipping->ffl_database`.`location` END) END)"
          ),
          "real_shipping_address",
        ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`street_address` ELSE `webinar_shipping->ffl_database`.`street_address` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`street_address` ELSE `physical_shipping->ffl_database`.`street_address` END) END)"
        //   ),
        //   "real_street_address",
        // ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`city` ELSE `webinar_shipping->ffl_database`.`city` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`city` ELSE `physical_shipping->ffl_database`.`city` END) END)"
        //   ),
        //   "real_city",
        // ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`state` ELSE `webinar_shipping->ffl_database`.`state` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`state` ELSE `physical_shipping->ffl_database`.`state` END) END)"
        //   ),
        //   "real_state",
        // ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`zip_code` ELSE `webinar_shipping->ffl_database`.`zip_code` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`zip_code` ELSE `physical_shipping->ffl_database`.`zip_code` END) END)"
        //   ),
        //   "real_zip_code",
        // ],
        [
          Sequelize.literal(
            "(CASE WHEN " +
              shipTable +
              ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_not_required` ELSE `physical_shipping`.`ffl_not_required` END)"
          ),
          "ffl_not_required",
        ],
        [
          Sequelize.literal(
            "(CASE WHEN " +
              shipTable +
              ".product_type = 'webinar' THEN `webinar_shipping->ffl_database`.`ffl_name` ELSE `physical_shipping->ffl_database`.`ffl_name` END)"
          ),
          "real_ffl_name",
        ],
        [
          Sequelize.literal(
            "(CASE WHEN " +
              shipTable +
              ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_id` ELSE `physical_shipping`.`ffl_id` END)"
          ),
          "real_ffl_id",
        ],
        // [Sequelize.literal("(CASE WHEN `ShippingItem`.`product_type` = 'webinar' THEN `ShippingItem`.`shipping_address` ELSE 'not required' END)"),'real_shipping_address'],
        "shipping_status",
        "is_grouped",
      ],
      group: [
        "real_shipping_address",
        "shipping_status",
        "ffl_not_required",
        "is_grouped",
        "real_ffl_id",
      ],
      order: [
        ["shipping_status", "ASC"],
        [Sequelize.col("real_shipping_address"), "ASC"],
        [Sequelize.col("real_ffl_name"), "ASC"],
        [Sequelize.col("ffl_not_required"), "ASC"],
        ["is_grouped", "DESC"],
      ],
      where: shipping_status != "all" ? { shipping_status } : {},
      raw: true,
      nest: true,
    });
    console.log(items);
    let is_involve_groupd = false;
    const promises = items.map(async (item) => {
      // console.log(item);
      const items_new = await ShippingItem.scope(...scopes).findAll({
        attributes: [
          "id",
          "is_grouped",
          "shipping_status",
          "product_type",
          "book_number",
          [
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`shipping_address` ELSE `webinar_shipping->ffl_database`.`location` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`shipping_address` ELSE `physical_shipping->ffl_database`.`location` END) END)"
            ),
            "real_shipping_address",
          ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`street_address` ELSE `webinar_shipping->ffl_database`.`street_address` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`street_address` ELSE `physical_shipping->ffl_database`.`street_address` END) END)"
          //   ),
          //   "real_street_address",
          // ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`city` ELSE `webinar_shipping->ffl_database`.`city` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`city` ELSE `physical_shipping->ffl_database`.`city` END) END)"
          //   ),
          //   "real_city",
          // ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`state` ELSE `webinar_shipping->ffl_database`.`state` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`state` ELSE `physical_shipping->ffl_database`.`state` END) END)"
          //   ),
          //   "real_state",
          // ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`zip_code` ELSE `webinar_shipping->ffl_database`.`zip_code` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`zip_code` ELSE `physical_shipping->ffl_database`.`zip_code` END) END)"
          //   ),
          //   "real_zip_code",
          // ],
          [
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_not_required` ELSE `physical_shipping`.`ffl_not_required` END)"
            ),
            "ffl_not_required",
          ],
          [
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_id` ELSE `physical_shipping`.`ffl_id` END)"
            ),
            "real_ffl_id",
          ],
          [
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN `webinar_shipping->ffl_database`.`ffl_name` ELSE `physical_shipping->ffl_database`.`ffl_name` END)"
            ),
            "real_ffl_name",
          ],
        ], // [Sequelize.literal("(CASE WHEN `ShippingItem`.`product_type` = 'webinar' THEN `ShippingItem`.`shipping_address` ELSE 'not required' END)"),'real_shipping_address'],
        where: [
          Sequelize.where(
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`shipping_address` ELSE `webinar_shipping->ffl_database`.`location` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`shipping_address` ELSE `physical_shipping->ffl_database`.`location` END) END)"
            ),
            "=",
            item.real_shipping_address
          ),
          Sequelize.where(
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_not_required` ELSE `physical_shipping`.`ffl_not_required` END)"
            ),
            "=",
            item.ffl_not_required
          ),
          Sequelize.where(
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_id` ELSE `physical_shipping`.`ffl_id` END)"
            ),
            "=",
            item.real_ffl_id
          ),
          {
            is_grouped: item.is_grouped,
            shipping_status: item.shipping_status,
          },
        ],
        raw: true,
        nest: true,
      });
      if (item.is_grouped) {
        return {
          real_shipping_address: item.real_shipping_address,
          is_grouped: item.is_grouped,
          real_ffl_name: item.real_ffl_name,
          shipping_status: item.shipping_status,
          ffl_not_required: item.ffl_not_required,
          children: items_new,
        };
      } else {
        is_involve_groupd = true;
        return items_new
          .map((item_new) => {
            return {
              real_shipping_address: item_new.real_shipping_address,
              is_grouped: item_new.is_grouped,
              shipping_status: item_new.shipping_status,
              ffl_not_required: item_new.ffl_not_required,
              real_ffl_name: item_new.real_ffl_name,
              children: [item_new],
            };
          });
      }
    });
    const result_before = await Promise.all(promises);
    console.log(result_before);
    const result = is_involve_groupd ? result_before.flat() : result_before;
    return {
      result: {
        data:
          limit != "all"
            ? result.slice(parseInt(offset), parseInt(offset) + parseInt(limit))
            : result,
        count: result.length,
      },
    };
  }
  static async setGroupStatus(event) {
    if (!event.body.id) {
      throw new Error("You should input ids for the body");
    }
    if (
      typeof event.body.is_grouped === "undefined" ||
      event.body.is_grouped === null
    ) {
      throw new Error("Is_grouped field is required");
    }
    const result = await ShippingItem.findOne({ where: { id: event.body.id } });
    if (!result) {
      throw new Error("There is no such item!");
    }
    if (result.shipping_status !== "not_printed") {
      throw new Error(
        "You can't update the group status while it's on label_printed or shipped"
      );
    }
    await ShippingItem.update(
      { is_grouped: event.body.is_grouped },
      { where: { id: event.body.id } }
    );
    return { result: { message: "success" } };
  }
  static async updateBookNumber(event) {
    const shipTable =
      process.env.STAGE == "local"
        ? "ShippingItem"
        : "ShippingItem_ShippingItem";
    if (!event.body.id) {
      throw new Error("You should input ids for the body");
    }
    const { id } = event.body;
    const scopes = [
      {
        method: [
          "withShippingItem",
          PurchaseHistory,
          Winners,
          PhysicalProduct,
          WebinarProduct,
          ConsumerUser,
          FFLTable,
        ],
      },
    ];
    const result = await ShippingItem.scope(...scopes).findAll({
      attributes: [
        [
          Sequelize.literal(
            "(CASE WHEN " +
              shipTable +
              ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`shipping_address` ELSE `webinar_shipping->ffl_database`.`location` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`shipping_address` ELSE `physical_shipping->ffl_database`.`location` END) END)"
          ),
          "real_shipping_address",
        ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`street_address` ELSE `webinar_shipping->ffl_database`.`street_address` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`street_address` ELSE `physical_shipping->ffl_database`.`street_address` END) END)"
        //   ),
        //   "real_street_address",
        // ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`city` ELSE `webinar_shipping->ffl_database`.`city` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`city` ELSE `physical_shipping->ffl_database`.`city` END) END)"
        //   ),
        //   "real_city",
        // ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`state` ELSE `webinar_shipping->ffl_database`.`state` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`state` ELSE `physical_shipping->ffl_database`.`state` END) END)"
        //   ),
        //   "real_state",
        // ],
        // [
        //   Sequelize.literal(
        //     "(CASE WHEN " +
        //       shipTable +
        //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`zip_code` ELSE `webinar_shipping->ffl_database`.`zip_code` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`zip_code` ELSE `physical_shipping->ffl_database`.`zip_code` END) END)"
        //   ),
        //   "real_zip_code",
        // ],
        [
          Sequelize.literal(
            "(CASE WHEN " +
              shipTable +
              ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_not_required` ELSE `physical_shipping`.`ffl_not_required` END)"
          ),
          "ffl_not_required",
        ],
        // [Sequelize.literal("(CASE WHEN `ShippingItem`.`product_type` = 'webinar' THEN `ShippingItem`.`shipping_address` ELSE 'not required' END)"),'real_shipping_address'],
        "shipping_status",
        "is_grouped",
      ],
      where: { id },
      raw: true,
    });
    if (result.ffl_not_required) {
      throw new Error(
        "You can not set the book number while it is ffl not required"
      );
    }
    await ShippingItem.update(
      { book_number: event.body.book_number },
      { where: { id } }
    );
    return { result: { message: "success" } };
  }
  static async updateShippingStatus(event) {
    const shipTable =
      process.env.STAGE == "local"
        ? "ShippingItem"
        : "ShippingItem_ShippingItem";
    if (!event.body.id) {
      throw new Error("You should input ids for the body");
    }
    const { id } = event.body;
    const scopes = [
      {
        method: [
          "withShippingItem",
          PurchaseHistory,
          Winners,
          PhysicalProduct,
          WebinarProduct,
          ConsumerUser,
          FFLTable,
        ],
      },
    ];
    const promises = id.map(async (id_iterator) => {
      let result = await ShippingItem.scope(...scopes).findOne({
        attributes: [
          "book_number",
          [
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`shipping_address` ELSE `webinar_shipping->ffl_database`.`location` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`shipping_address` ELSE `physical_shipping->ffl_database`.`location` END) END)"
            ),
            "real_shipping_address",
          ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`street_address` ELSE `webinar_shipping->ffl_database`.`street_address` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`street_address` ELSE `physical_shipping->ffl_database`.`street_address` END) END)"
          //   ),
          //   "real_street_address",
          // ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`city` ELSE `webinar_shipping->ffl_database`.`city` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`city` ELSE `physical_shipping->ffl_database`.`city` END) END)"
          //   ),
          //   "real_city",
          // ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`state` ELSE `webinar_shipping->ffl_database`.`state` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`state` ELSE `physical_shipping->ffl_database`.`state` END) END)"
          //   ),
          //   "real_state",
          // ],
          // [
          //   Sequelize.literal(
          //     "(CASE WHEN " +
          //       shipTable +
          //       ".product_type = 'webinar' THEN (CASE WHEN `webinar_shipping`.`ffl_id` IS NULL THEN `webinar_shipping`.`zip_code` ELSE `webinar_shipping->ffl_database`.`zip_code` END) ELSE (CASE WHEN `physical_shipping`.`ffl_id` IS NULL THEN `physical_shipping`.`zip_code` ELSE `physical_shipping->ffl_database`.`zip_code` END) END)"
          //   ),
          //   "real_zip_code",
          // ],
          [
            Sequelize.literal(
              "(CASE WHEN " +
                shipTable +
                ".product_type = 'webinar' THEN `webinar_shipping`.`ffl_not_required` ELSE `physical_shipping`.`ffl_not_required` END)"
            ),
            "ffl_not_required",
          ],
          // [Sequelize.literal("(CASE WHEN `ShippingItem`.`product_type` = 'webinar' THEN `ShippingItem`.`shipping_address` ELSE 'not required' END)"),'real_shipping_address'],
          "shipping_status",
          "is_grouped",
        ],
        where: { id: id_iterator },
        raw: true,
        nest: true,
      });
      if (
        result.shipping_status === "not_printed" &&
        !result.ffl_not_required &&
        !result.book_number &&
        event.body.shipping_status &&
        (event.body.shipping_status === "shipped" ||
          event.body.shipping_status === "printed")
      ) {
        throw new Error("You should input the book number");
      }
    });
    await Promise.all(promises);
    await ShippingItem.update(
      { shipping_status: event.body.shipping_status },
      { where: { id } }
    );
    return { result: { message: "success" } };
  }
}
