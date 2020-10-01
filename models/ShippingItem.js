import { Model, DataTypes } from "sequelize";

export class ShippingItem extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        purchase_or_winner_id: {
          type: DataTypes.UUID,
        },
        shipping_status: {
          type: DataTypes.STRING(30),
          validate: {
            isIn: {
              args: [["not_printed", "printed", "shipped"]],
              msg: "Must be validate status",
            },
          },
        },
        product_type: {
          type: DataTypes.STRING(30),
          validate: {
            isIn: {
              args: [["physical", "webinar"]],
              msg: "Must be 'physical' or 'webinar'",
            },
          },
        },
        shipping_address: {
          type: DataTypes.STRING(255),
        },
        shipped_date: {
          type: DataTypes.DATE,
        },
        tracking_number: {
          type: DataTypes.STRING(50),
        },
        book_number: {
          type: DataTypes.STRING(50),
        },
        is_grouped: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: "shipping_items",
      }
    );
  }
  static associate(models) {
    this.belongsTo(models.PurchaseHistory, {
      as: "physical_shipping",
      foreignKey: "purchase_or_winner_id",
    });
    this.belongsTo(models.Winners, {
      as: "webinar_shipping",
      foreignKey: "purchase_or_winner_id",
    });
  }
  static get scopes() {
    return [
      [
        "withShippingItem",
        function (
          purchase_model,
          winner_model,
          physicalModel,
          webinarModel,
          userModel,
          fflModel
        ) {
          return {
            include: [
              {
                model: purchase_model,
                as: "physical_shipping",
                where: { product_type: "product" },
                required: false,
                include: [
                  {
                    model: physicalModel,
                    as: "productInfo",
                    attributes: ["id", "productName"],
                  },
                  {
                    model: userModel,
                    as: "buyer",
                    attributes: [
                      "id",
                      "username",
                      "email",
                      "address",
                      "street_address",
                      "zipcode",
                      "city",
                      "state",
                      "phone_number",
                    ],
                  },
                  {
                    model: fflModel,
                    as: "ffl_database",
                    attributes: [
                      "id",
                      "ffl_no",
                      "ffl_name",
                      "location",
                      "street_address",
                      "zipcode",
                      "city",
                      "state",
                    ],
                  },
                ],
              },
              {
                model: winner_model,
                as: "webinar_shipping",
                required: false,
                where: {
                  product_type: ["physical", "webinar"],
                },
                include: [
                  {
                    model: webinarModel,
                    as: "webinar",
                    attributes: ["id", "name"],
                  },
                  {
                    model: userModel,
                    as: "user_data",
                    attributes: [
                      "id",
                      "username",
                      "email",
                      "address",
                      "street_address",
                      "zipcode",
                      "city",
                      "state",
                      "phone_number",
                    ],
                  },
                  {
                    model: fflModel,
                    as: "ffl_database",
                    attributes: [
                      "id",
                      "ffl_no",
                      "ffl_name",
                      "location",
                      "street_address",
                      "zipcode",
                      "city",
                      "state",
                    ],
                  },
                ],
              },
            ],
          };
        },
      ],
      [
        "paginable",
        (limit = 100, offset = 0) =>
          limit != "all" ? { limit: +limit, offset: +offset } : {},
      ],
    ];
  }
}
