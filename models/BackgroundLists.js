import { Model, DataTypes } from "sequelize";

export class BackgroundList extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        image_url: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        start_from: {
          type: DataTypes.DATE,
        },
        end_to: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: "background_lists",
      }
    );
  }
}
