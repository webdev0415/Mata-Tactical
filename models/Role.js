import { Model, DataTypes } from "sequelize";

export class Role extends Model {
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
                }
            },
            {
                sequelize,
                tableName: "roles",
            }
        );
    }

    static associate(models){
        this.belongsToMany(models.Permission, {
            as: "permissions",
            through: 'role_permissions',
            foreignKey: 'role_id',
            otherKey: 'permission_id'
        });
    }

    static get scopes(){
        return [
            [
                "withPermissions",
                function (permissionModel) {
                    return {
                        include: [
                            {
                                model: permissionModel,
                                as: "permissions"
                            },
                        ],
                    };
                },
            ]
        ];
    }
}
