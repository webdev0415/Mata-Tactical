import { Model, DataTypes } from "sequelize";

export class GiftCard extends Model {
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
          type: DataTypes.DOUBLE,
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
        status: {
          type: DataTypes.STRING(10),
          allowNull: false,
          defaultValue: "unused",
          validate: {
            isIn: {
              args: [["used", "unused"]],
              msg: "Must be used or unused",
            },
          },
        },
      },
      {
        sequelize,
        tableName: "gift_card",
      }
    );
  }
  static associate(models) {
    this.belongsTo(models.ConsumerUser, {
      foreignKey: "user_id",
      as: "user",
    });
  }

  static get scopes() {
    return [
      [
        "withUser",
        function (userModel) {
          return {
            include: [
              {
                model: userModel,
                as: "user",
              },
            ],
          };
        },
      ],
      ["paginable", (limit = 100, offset = 0) => ( limit != 'all' ?  { limit: +limit, offset: +offset }: {})],
    ];
  }
}
