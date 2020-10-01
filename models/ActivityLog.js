import { Model, DataTypes } from "sequelize";

export class ActivityLog extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        email: {
          type: DataTypes.STRING(40),
          allowNull: false,
          validate: {
            isEmail: true
          }
        },
        logged_in_time: {
          type: DataTypes.DATE,
        },
        logged_out_time: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: "activity_logs",
      }
    );
  }
}
