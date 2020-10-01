import { Model, DataTypes, Op } from "sequelize";

export class ConsumerUser extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        username: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(50),
          validate: {
            isEmail: true,
          },
          allowNull: false,
          unique: true,
        },
        profile_picture: {
          type: DataTypes.STRING(512),
        },
        address: {
          type: DataTypes.STRING(150),
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
        phone_number: {
          type: DataTypes.STRING(50),
        },
        notify_products: {
          type: DataTypes.STRING(20),
          validate: {
            isIn: {
              args: [["email", "phone", "none", "email and phone"]],
              msg: "Must use valid args in notify_products field",
            },
          },
          defaultValue: "none",
        },
        notify_webinar: {
          type: DataTypes.STRING(20),
          validate: {
            isIn: {
              args: [["email", "phone", "none", "email and phone"]],
              msg: "Must use valid args in notify_webinar field",
            },
          },
          defaultValue: "none",
        },
        is_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        is_email_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        is_phone_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        first_name: {
          type: DataTypes.STRING(40),
        },
        last_name: {
          type: DataTypes.STRING(40),
        },
        verified_method: {
          type: DataTypes.STRING(10),
          validate: {
            isIn: {
              args: [["email", "phone"]],
              msg: "Must use email or phoneNumber",
            },
          },
        },
        user_role: {
          type: DataTypes.STRING(20),
          validate: {
            isIn: {
              args: [["consumer", "admin"]],
              msg: "Must input consumer or admin",
            },
          },
          allowNull: false,
        },
        auth_banned: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        comment_banned: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        forgot_link: {
          type: DataTypes.TEXT,
          defaultValue: "",
        },
        is_forget: {
          type: DataTypes.BOOLEAN,
          default: false,
        },
        is_removed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        role_id: {
          type: DataTypes.UUID,
        },
      },
      {
        sequelize,
        tableName: "consumer_users",
      }
    );
  }
  static associate(models) {
    this.hasMany(models.PurchaseHistory, {
      foreignKey: "userID",
      as: "purchase_history",
    });
    this.hasMany(models.TransactionList, {
      foreignKey: "user_id",
      as: "transactions",
    });
    this.hasMany(models.Winners, {
      foreignKey: "user_id",
      as: "winner_history",
    });
    this.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });
  }
  static get scopes() {
    return [
      [
        "with_role",
        function (modelRole) {
          return {
            include: [
              {
                model: modelRole,
                as: "role",
              },
            ],
          };
        },
      ],
      [
        "searchUsers",
        function (query_search) {
          return {
            where: {
              [Op.or]: [
                {
                  email: {
                    [Op.substring]: query_search,
                  },
                },
                {
                  first_name: {
                    [Op.substring]: query_search,
                  },
                },
                {
                  last_name: {
                    [Op.substring]: query_search,
                  },
                },
              ],
            },
          };
        },
      ],
      [
        "with_winner_history",
        function (winner_model, webinar_model) {
          return {
            include: [
              {
                model: winner_model,
                as: "winner_history",
                attributes: ["id", "seatNo", "product_type", "createdAt"],
                required: false,
                include: [
                  {
                    model: webinar_model,
                    as: "webinar",
                    attributes: ["id", "name", "price_per_seats", "webinar_type"],
                  },
                ],
              },
            ],
          };
        },
      ],
      [
        "with_physical",
        function (purchase_model, physical_model, webinar_model) {
          return {
            include: [
              {
                model: purchase_model,
                as: "purchase_history",
                attributes: ["id", "createdAt", "productID", "price", "product_type"],
                required: false,
                include: [
                  {
                    model: physical_model,
                    as: "productInfo",
                    attributes: ["id", "productName"],
                  },
                  {
                    model: webinar_model,
                    as: "webinar_product",
                    attributes: ["id", ["name", "productName"]],
                  },
                ],
              },
            ],
          };
        },
      ],
      [
        "withTransactions",
        function (
          modelTransaction,
          modelPromoCode,
          modelPurchaseHistory,
          modelWebinarProduct,
          modelPhysicalProduct,
          imageModel
        ) {
          return {
            include: [
              {
                model: modelTransaction,
                as: "transactions",
                attributes: ["id", "gift_card_amount", "amount"],
                include: [
                  {
                    model: modelPromoCode,
                    as: "promoCode",
                    attributes: ["type", "amount"],
                  },
                  {
                    model: modelPurchaseHistory,
                    as: "purchase",
                    include: [
                      {
                        model: modelPhysicalProduct,
                        as: "productInfo",
                        attributes: ["productName", "pricePerItem"],
                        include: [
                          {
                            model: imageModel,
                            as: "main_image",
                            attributes: ["image_url"],
                          },
                        ],
                      },
                      {
                        model: modelWebinarProduct,
                        as: "webinar_product",
                        attributes: ["name", "price_per_seats"],
                        include: [
                          {
                            model: imageModel,
                            as: "main_image",
                            attributes: ["image_url"],
                          },
                        ],
                      },
                    ],
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
