import { Model, DataTypes } from 'sequelize';

export class ProductDescriptionList extends Model {
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
            product_type: {
                type: DataTypes.STRING(10),
                validate: {
                    isIn: {
                        args: [
                            ["product", "webinar"]
                        ],
                        msg: "product_type must be product or webinar",
                    },
                },
            },
            kind_list: {
                type: DataTypes.STRING(255),
            },
        }, {
            sequelize, tableName: 'product_description_lists'
        });
    }
}