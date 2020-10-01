import { Model, DataTypes } from "sequelize";

export class WebinarProduct extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        primary_image_id: {
          type: DataTypes.UUID,
        },
        shortDescription: {
          type: DataTypes.TEXT,
        },
        price_per_seats: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        seats: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        remainingSeats: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        category_id: {
          type: DataTypes.UUID,
        },
        product_status: {
          type: DataTypes.STRING(10),
          validate: {
            isIn: {
              args: [["inactive", "active", "soldout", "hold", "progress", "done"]],
              msg: "product_status should be inactive,active or soldout",
            },
          },
          defaultValue: "inactive",
        },
        publish_method: {
          type: DataTypes.STRING(10),
          validate: {
            isIn: {
              args: [["instant", "scheduled", "queued"]],
              msg: "publish_method should be instant or schedule",
            },
          },
          allowNull: false,
        },
        scheduled_time: {
          type: DataTypes.DATE,
        },
        webinar_type: {
          type: DataTypes.STRING(10),
          validate: {
            isIn: {
              args: [["webinar", "seats", "gifts"]],
              msg: "webinar_type should be webinar, seats or gifts",
            },
          },
          allowNull: false,
        },
        bought_for: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
        },
        webinar_link: {
          type: DataTypes.STRING(255),
        },
        soldout_date: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: "webinar_products",
      }
    );
  }
  static associate(models) {
    this.hasMany(models.ProductImageList, {
      foreignKey: "product_id",
      as: "pictures",
    });
    this.belongsTo(models.ProductImageList, {
      foreignKey: "primary_image_id",
      as: "main_image",
    });
    this.hasMany(models.WebinarProductDetail, {
      foreignKey: "webinar_id",
      as: "seats_history",
    });
    this.hasMany(models.PromoCode, {
      foreignKey: "product_id",
      as: "promo_code",
    });
    this.hasMany(models.Winners, {
      foreignKey: "webinar_id",
      as: "winners",
    });
  }
  static get scopes() {
    return [
      [
        "withImage",
        function (imageModel) {
          return {
            include: [
              {
                model: imageModel,
                as: "pictures",
                required: false,
                attributes: ["id", "image_url"],
              },
            ],
          };
        },
      ],
      [
        "withPrimaryImage",
        function (imageModel) {
          return {
            include: [
              {
                model: imageModel,
                as: "main_image",
                required: false,
                attributes: ["id", "image_url"],
              },
            ],
          };
        },
      ],
      [
        "seats_history",
        function (product_detail_model) {
          return {
            include: [
              {
                model: product_detail_model,
                as: "seats_history",
                required: false,
                attributes: ["id", "seat_status", "createdAt"],
              },
            ],
          };
        },
      ],
      [
        "withPromoCodeAndUser",
        function (modelPromoCode, modelConsumer) {
          return {
            include: [
              {
                model: modelPromoCode,
                as: "promo_code",
                include: {
                  model: modelConsumer,
                  as: "user",
                },
              },
            ],
          };
        },
      ],
      [
        "withWinners",
        function (modelWinners, modelUser, modelGift) {
          return {
            include: [
              {
                model: modelWinners,
                as: "winners",
                include: [
                  {
                    model: modelUser,
                    as: "user_data",
                  },
                  {
                    model: modelGift,
                    as: "gifts",
                  },
                ],
              },
            ],
          };
        },
      ],
      ["paginable", (limit = 100, offset = 0) => ( limit != 'all' ?  { limit: +limit, offset: +offset }: {})],
    ];
  }
}
