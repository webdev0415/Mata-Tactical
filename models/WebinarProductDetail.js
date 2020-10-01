import { Model, DataTypes } from 'sequelize';

export class WebinarProductDetail extends Model {
  static init(sequelize){
    return super.init({
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      webinar_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      seatNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      seat_status: {
        type: DataTypes.STRING(20),
        validate: {
          isIn: {
            args: [["reserved", "taken"]],
            msg: "Must be static values",
          },
        },
      },
      reserved_time: {
        type: DataTypes.DATE,
      },
    }, {
      sequelize, tableName: 'webinar_product_details'
    });
  }
  static associate(models) {
    this.belongsTo(models.WebinarProduct, {
      foreignKey: "webinar_id",
      as: "seats_history",
    });

    this.belongsTo(models.ConsumerUser, {
      foreignKey: "user_id",
      as: "user"
    });
  }

  static get scopes() {
    return [
      [
        "withUsers",
        function (userModel) {
          return {
            include: [
              {
                model: userModel,
                as: "user",
                attributes: ["id", "username", "email","first_name","last_name"]
              },
            ],
          };
        },
      ],
      ["paginable", (limit = 100, offset = 0) => ( limit != 'all' ?  { limit: +limit, offset: +offset }: {})],
    ];
  }
}
