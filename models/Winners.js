import { Model, DataTypes } from "sequelize";

export class Winners extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        user_id: {
          type: DataTypes.UUID,
        },
        webinar_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        product_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        product_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            isIn: {
              args: [
                [
                  "physical",
                  "gift_card",
                  "promo_code",
                  "webinar_seat",
                  "webinar",
                ],
              ],
              msg: "Must be physical, gift_card, webinar_seat or promo_code",
            },
          },
        },
        ffl_id: {
          type: DataTypes.UUID,
        },
        ffl_not_required: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        shipping_address: {
          type: DataTypes.STRING(100),
        },
        street_address: {
          type: DataTypes.STRING(150),
        },
        city: {
          type: DataTypes.STRING(50),
        },
        zipcode: {
          type: DataTypes.STRING(10),
        },
        state: {
          type: DataTypes.STRING(20),
        },
        position: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        seatNo: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: "winners",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.ConsumerUser, {
      foreignKey: "user_id",
      as: "user_data",
    });
    this.belongsTo(models.PhysicalProduct, {
      foreignKey: "product_id",
      as: "product",
    });
    this.belongsTo(models.GiftCard, {
      foreignKey: "product_id",
      as: "gifts",
    });
    this.belongsTo(models.PromoCode, {
      foreignKey: "product_id",
      as: "seats",
    });
    this.belongsTo(models.WebinarProduct, {
      foreignKey: "product_id",
      as: "webinar",
    });
    this.belongsTo(models.FFLTable, {
      foreignKey: "ffl_id",
      as: "ffl_database",
    });
    this.belongsTo(models.WebinarProduct, {
      foreignKey: "webinar_id",
      as: "webinar_parent",
    });
    this.hasOne(models.ShippingItem, {
      foreignKey: "purchase_or_winner_id",
      as: "shipping_status",
    });
  }

  static get scopes() {
    return [
      [
        "withProduct",
        function (models, alias) {
          return {
            include: [
              {
                model: models,
                as: alias,
                // required: false,
              },
            ],
          };
        },
      ],
      [
        "withShippingStatus",
        function (shippingModel) {
          return {
            include: [
              {
                model: shippingModel,
                as: "shipping_status",
                attributes: ["shipping_status", "book_number"],
                required: false,
              },
            ],
          };
        },
      ],
      [
        "withCompletedProductInfo",
        function (productModel) {
          return {
            include: [
              {
                model: productModel,
                as: "webinar_parent",
                where: {
                  product_status: "done",
                },
              },
            ],
          };
        },
      ],
      [
        "withWinner",
        function (userModel) {
          return {
            include: [
              {
                model: userModel,
                as: "user_data",
                attributes: [
                  "username",
                  "address",
                  "street_address",
                  "zipcode",
                  "city",
                  "state",
                  "phone_number",
                  "email",
                ],
                // required: false,
              },
            ],
          };
        },
      ],
      [
        "withWebinarWon",
        function (modelWebinar, modelImage) {
          return {
            include: [
              {
                model: modelWebinar,
                as: "webinar",
                attributes: [
                  "name",
                  "price_per_seats",
                  "primary_image_id",
                  "webinar_type",
                ],
                include: [
                  {
                    model: modelImage,
                    as: "main_image",
                    attributes: ["id", "image_url"],
                  },
                ],
              },
            ],
          };
        },
      ],
      [
        "withFFL",
        function (modelFFL) {
          return {
            include: [
              {
                model: modelFFL,
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
