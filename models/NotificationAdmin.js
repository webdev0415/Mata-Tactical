import { Model, DataTypes } from "sequelize";

export class NotificationAdmin extends Model {
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
          allowNull: false,
        },
        product_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            isIn: {
              args: [["physical", "webinar", "promo_code"]],
              msg: "Must be physical or webinar",
            },
          },
        },
        service_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
              isIn: {
                  args: [
                      ["new_product", "sold_out", "unused_promo_code","promo_code_sold_out"]
                  ],
                  msg: "Must be Product or Webinar",
              },
          },
        },
        status: {
          type: DataTypes.STRING(100),
          validate: {
            isIn: {
              args: [["new", "read"]],
              msg: "Must be new or read",
            },
          },
        },
        product_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        product_image: {
          type: DataTypes.STRING(512),
          allowNull: false,
        },
        prize_item_name: {
          type: DataTypes.STRING(50),
        }
      },
      {
        sequelize,
        tableName: "notification_admin",
      }
    );
  }
}
