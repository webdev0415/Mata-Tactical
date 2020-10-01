import { Model, DataTypes } from "sequelize";

export class Permission extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: DataTypes.UUID,
                    primaryKey: true,
                    defaultValue: DataTypes.UUIDV4,
                },
                name: {
                    type: DataTypes.STRING(100),
                    unique: true,
                    allowNull: false,
                },
                title: {
                    type: DataTypes.STRING(200),
                    unique: true,
                    allowNull: false,
                }
            },
            {
                sequelize,
                tableName: "permissions",
            }
        );
    }

    static associate(models){
        this.belongsToMany(models.Role, {
            through: 'roles_permissions',
            foreignKey: 'permission_id',
            otherKey: 'role_id'
        });
    }
}
