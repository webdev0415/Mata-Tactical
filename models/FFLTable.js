import { Model, DataTypes } from "sequelize";

export class FFLTable extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        ffl_no: {
          type: DataTypes.STRING(100),
          unique: true,
          allowNull: false,
        },
        ffl_name: {
          type: DataTypes.STRING(300),
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING(300),
        },
        street_address: {
          type: DataTypes.STRING(150),
        },
        city: {
          type: DataTypes.STRING(50),
        },
        zipcode: {
          type: DataTypes.STRING(10),
        },
        state: {
          type: DataTypes.STRING(20),
        },
        contact_name: {
          type: DataTypes.STRING(100),
        },
        contact_email: {
          type: DataTypes.STRING(50),
        },
        ffl_image_url: {
          type: DataTypes.STRING(255),
        },
        expiration_date: {
          type: DataTypes.DATE,
        },
        contact_phone: {
          type: DataTypes.STRING(50),
        },
        is_removed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        }
      },
      {
        sequelize,
        tableName: "ffl_tables",
      }
    );
  }
  static associate(models){
      this.hasMany(models.Winners, {
          foreignKey: 'ffl_id',
          as: 'winners'
      });
      this.hasMany(models.PurchaseHistory, {
        foreignKey: 'ffl_id',
        as: 'ffl_products'
      });
  }
  static get scopes(){
      return [
        [
          "withWinners",
          function (winnerModel, userModel, productModel, purchaseModel, physicalModel) {
            return {
              include: [
                {
                  model: winnerModel,
                  as: "winners",
                  where: {
                    product_type: "webinar",
                  },
                  required: false,
                  attributes: ["id"],
                  include: [
                    {
                      model: userModel,
                      as: "user_data",
                      attributes: ["username", "email", "phone_number"],
                    },
                    {
                      model: productModel,
                      as: "webinar",
                      attributes: ["name", "primary_image_id"],
                    },
                  ],
                },
                {
                  model: purchaseModel,
                  as: "ffl_products",
                  include: [
                    {
                      model: userModel,
                      as: "buyer",
                    },
                    {
                      model: physicalModel,
                      as: "productInfo",
                    },
                  ],
                },
              ],
            };
          },
        ],
        ["paginable", (limit = 100, offset = 0) => ( limit != 'all' ?  { limit: +limit, offset: +offset }: {})],
      ];
  }
}
