import { Model, DataTypes, Op } from "sequelize";

export class PromoCode extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        code: {
          type: DataTypes.STRING(100),
          unique: true,
        },
        amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.UUID,
        },
        transaction_id: {
          type: DataTypes.UUID,
        },
        type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: "created",
          validate: {
            isIn: {
              args: [["created", "won"]],
              msg: "Must be created or won",
            },
          },
        },
        product_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            isIn: {
              args: [["physical", "webinar"]],
              msg: "Must be 'physical' or 'webinar'",
            },
          },
        },
        product_id: {
          type: DataTypes.UUID,
        },
        code_type: {
          type: DataTypes.STRING(30),
          validate: {
            isIn: {
              args: [["percent", "seat", "cost"]],
              msg: "Must be 'percent', 'seat' or 'cost'",
            },
          },
        },
        number_used: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        date_from: {
          type: DataTypes.DATE,
        },
        date_to: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: "promo_code",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.WebinarProduct, {
      foreignKey: "product_id",
      as: "webinar",
    });

    this.belongsTo(models.ConsumerUser, {
      foreignKey: "user_id",
      as: "user",
    });
  }

  static get scopes() {
    return [
      [
        "withWebinar",
        function (modelWebinar) {
          return {
            where: {
              code_type: "seat",
              number_used: {[Op.gt]: 0},
            },
            include: [
              {
                model: modelWebinar,
                as: "webinar",
              },
            ],
          };
        },
      ],
      ["paginable", (limit = 100, offset = 0) => ( limit != 'all' ?  { limit: +limit, offset: +offset }: {})],
    ];
  }
}
