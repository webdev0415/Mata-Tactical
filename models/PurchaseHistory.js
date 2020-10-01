import { Model, DataTypes } from "sequelize";

export class PurchaseHistory extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        orderNo: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
        },
        orderStatus: {
          type: DataTypes.STRING(10),
          allowNull: false,
          validate: {
            isIn: {
              args: [["Pending", "Purchased", "Refund"]],
              msg: "Must be Pending or Purchased",
            },
          },
        },
        userID: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        product_type: {
          type: DataTypes.STRING(10),
          allowNull: false,
          validate: {
            isIn: {
              args: [["product", "webinar"]],
              msg: "Must be Product or Webinar",
            },
          },
        },
        price: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
        },
        shipping_price: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
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
        tax: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
        },
        productID: {
          type: DataTypes.UUID,
        },
        seatsNo: {
          type: DataTypes.INTEGER,
        },
        ffl_id: {
          type: DataTypes.UUID,
        },
        ffl_not_required: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        units: {
          type: DataTypes.INTEGER,
        },
      },
      {
        sequelize,
        tableName: "purchase_histories",
      }
    );
  }
  static associate(models) {
    this.belongsTo(models.PhysicalProduct, {
      foreignKey: "productID",
      as: "productInfo",
    });
    this.belongsTo(models.WebinarProduct, {
      foreignKey: "productID",
      as: "webinar_product",
    });
    this.belongsTo(models.ConsumerUser, {
      foreignKey: "userID",
      as: "buyer",
    });
    this.belongsTo(models.FFLTable, {
      foreignKey: "ffl_id",
      as: "ffl_database",
    });
    this.belongsTo(models.TransactionList, {
      foreignKey: "orderNo",
      as: "transaction_detail",
    });
    this.hasOne(models.ShippingItem, {
      foreignKey: "purchase_or_winner_id",
      as: "shipping_status",
    });
  }

  static get scopes() {
    return [
      [
        "withBuyer",
        function (userModel) {
          return {
            include: [
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
              },
            ],
          };
        },
      ],
      [
        "withProductInfo",
        function (physicalModel, modelImage) {
          return {
            include: [
              {
                model: physicalModel,
                as: "productInfo",
                attributes: [
                  "id",
                  "productName",
                  "primary_image_id",
                  "bought_for",
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
        "withTransaction",
        function (transactionModel) {
          return {
            include: [
              {
                model: transactionModel,
                as: "transaction_detail",
                attributes: [
                  "payment_id",
                  "consumer_profile_id",
                  "payment_profile_id",
                ],
              },
            ],
          };
        },
      ],
      [
        "withFFL",
        function (fflModel) {
          return {
            include: [
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
