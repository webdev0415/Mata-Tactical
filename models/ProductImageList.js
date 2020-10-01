import { Model, DataTypes } from "sequelize";

export class ProductImageList extends Model {
  static init(sequelize) {
    return super.init(
      {
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
              args: [["physical", "webinar"]],
              msg: "product_type must be physical or webinar",
            },
          },
        },
        image_url: {
          type: DataTypes.STRING(512),
          unique: true,
        },
      },
      {
        sequelize,
        tableName: "product_image_lists",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.PhysicalProduct, {
      foreignKey: "product_id",
      as: "physical_product",
    });
    this.belongsTo(models.WebinarProduct, {
      foreignKey: "product_id",
      as: "webinar_product",
    });
    this.hasOne(models.PhysicalProduct, {
      foreignKey: "primary_image_id",
      as: "main_image_physical",
    });
    this.hasOne(models.WebinarProduct, {
      foreignKey: "primary_image_id",
      as: "main_image_webinar",
    });
  }
}
