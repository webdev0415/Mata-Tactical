import { Model, DataTypes } from "sequelize";

export class TransactionList extends Model {
  static init(sequelize) {
    return super.init(
      {
        product_type: {
          type: DataTypes.STRING(20),
          validate: {
            isIn: {
              args: [["product", "webinar"]],
              msg: "Must be Product or Webinar",
            },
          },
        },
        status: {
          type: DataTypes.STRING(10),
          validate: {
            isIn: {
              args: [["failed", "success"]],
              msg: "Must be failed or success",
            },
          },
          defaultValue: "failed",
        },
        product_id: {
          type: DataTypes.UUID,
        },
        user_id: {
          type: DataTypes.UUID,
        },
        amount: {
          type: DataTypes.DOUBLE,
        },
        units: {
          type: DataTypes.INTEGER,
        },
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        payment_id: {
          type: DataTypes.STRING(50),
        },
        promo_code_id: {
          type: DataTypes.UUID,
        },
        gift_card_amount: {
          type: DataTypes.DOUBLE,
        },
        consumer_profile_id: {
          type: DataTypes.STRING(30),
        },
        payment_profile_id: {
          type: DataTypes.STRING(30),
        },
      },
      {
        sequelize,
        tableName: "transaction_lists",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.PromoCode, {
      foreignKey: "promo_code_id",
      as: "promoCode",
    });
    this.hasMany(models.PurchaseHistory, {
      foreignKey: "orderNo",
      as: "purchase",
    });
  }
}
