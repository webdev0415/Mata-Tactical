import { Model, DataTypes } from 'sequelize';

export class TopicList extends Model {
    static init(sequelize){
        return super.init({
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            arn: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            notification_type: {
                type: DataTypes.STRING(20),
                allowNull: false,
                validate: {
                    isIn: {
                        args: [
                            ["new_products", "webinar_update"]
                        ],
                        msg: "Must use valid args in notification_type field",
                    },
                },
                defaultValue: "none",
            },
            webinar_id: {
                type: DataTypes.STRING(255),
                defaultValue: "none",
            },
        }, {
            sequelize, tableName: 'topic_lists'
        });
    }
}