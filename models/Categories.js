import { Model, DataTypes } from "sequelize";

export class Category extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        category_name: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
        },
        product_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            isIn: {
              args: [["Physical", "Webinar", "Both"]],
              msg: "Must be Physical, Webinar or Both",
            },
          },
        },
      },
      {
        sequelize,
        tableName: "categories",
      }
    );
  }
}
