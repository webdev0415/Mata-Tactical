import { Model, DataTypes } from 'sequelize';

export class Comment extends Model {
    static init(sequelize){
        return super.init({
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            comment_content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            product_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            parent_id: {
                type: DataTypes.UUID,
                defaultValue: "",
            },
            product_type: {
                type: DataTypes.STRING(10),
                allowNull: false,
                validate: {
                    isIn: {
                        args: [
                            ["physical", "webinar"]
                        ],
                        msg: "Must be Physical or Webinar",
                    },
                },
            },
            is_pinned: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            edit_date: {
                type: DataTypes.DATE,
            },
            is_edited: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            pinned_date: {
                type: DataTypes.DATE,
            }
        }, {
            sequelize, tableName: 'comments'
        });
    }
}