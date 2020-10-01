import { Model, DataTypes } from 'sequelize';

export class SubscriptionList extends Model {
    static init(sequelize){
        return super.init({
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            topic_id: {
                type: DataTypes.UUID,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            subscription_arn: {
                type: DataTypes.STRING(200),
                allowNull: false,
            },
        }, {
            sequelize, tableName: 'subscription_lists'
        });
    }
}