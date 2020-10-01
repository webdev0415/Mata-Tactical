import { Model, DataTypes } from 'sequelize';

export class NotificationState extends Model {
    static init(sequelize){
        return super.init({
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            notification_status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                validate: {
                    isIn: {
                        args: [
                            ["delivered", "read", "created"]
                        ],
                        msg: "Must be Product or Webinar",
                    },
                },

                defaultValue: "created",
            },
            notification_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        }, {
            sequelize, tableName: 'notification_states'
        });
    }
}