import { Model, DataTypes } from 'sequelize';

export class NotificationList extends Model {
    static init(sequelize){
        return super.init({
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            product_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            service_type: {
                type: DataTypes.STRING(20),
                allowNull: false,
                validate: {
                    isIn: {
                        args: [
                            ["new_product", "webinar_start", "won"]
                        ],
                        msg: "Must be Product or Webinar",
                    },
                },
            },
            product_type: {
                type: DataTypes.STRING(10),
                allowNull: false,
                validate: {
                    isIn: {
                        args: [
                            ["physical", "webinar", "gifts", "seats"]
                        ],
                        msg: "Must be Product or Webinar",
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
            webinar_link: {
                type: DataTypes.STRING(255),
            }
        }, {
            sequelize, tableName: 'notification_lists'
        });
    }
}