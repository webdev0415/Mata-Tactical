import { Model, DataTypes } from "sequelize";

export class PhysicalProduct extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        productName: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        pricePerItem: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        shortDescription: {
          type: DataTypes.TEXT,
        },
        original_amount: {
          type: DataTypes.INTEGER,
        },
        amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        primary_image_id: {
          type: DataTypes.UUID,
        },
        category_id: {
          type: DataTypes.UUID,
        },
        product_status: {
          type: DataTypes.STRING(10),
          validate: {
            isIn: {
              args: [["inactive", "active", "soldout", "hold"]],
              msg: "product_status should be inactive,active or soldout",
            },
          },
          defaultValue: "inactive",
        },
        publish_method: {
          type: DataTypes.STRING(10),
          validate: {
            isIn: {
              args: [["instant", "scheduled"]],
              msg: "publish_method should be instant or schedule",
            },
          },
          allowNull: false,
        },
        scheduled_time: {
          type: DataTypes.DATE,
        },
        shipping_price: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
        },
        bought_for: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
        },
        taxable: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        }
      },
      {
        sequelize,
        tableName: "physical_products",
      }
    );
  }

  static associate(models) {
    this.hasMany(models.ProductImageList, {
      foreignKey: "product_id",
      as: "pictures",
    });
    this.hasMany(models.PurchaseHistory, {
      foreignKey: "productID",
      as: "transactiondetails",
    });
    this.belongsTo(models.ProductImageList, {
      foreignKey: "primary_image_id",
      as: "main_image",
    });
  }
  static get scopes() {
    return [
      [
        "withImage",
        function (imageModel) {
          return {
            include: [
              {
                model: imageModel,
                as: "pictures",
                required: false,
                attributes: ["id", "image_url"],
              },
            ],
          };
        },
      ],
      [
        "withPrimaryImage",
        function (imageModel) {
          return {
            include: [
              {
                model: imageModel,
                as: "main_image",
                required: false,
                attributes: ["id", "image_url"],
              },
            ],
          };
        },
      ],
      ["paginable", (limit = 100, offset = 0) => ( limit != 'all' ?  { limit: +limit, offset: +offset }: {})],
    ];
  }
}
