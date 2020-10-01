import { Model, DataTypes } from 'sequelize';

export class FAQList extends Model {
  static init(sequelize){
    return super.init({
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    }, {
      sequelize, tableName: 'faq_lists'
    });
  }
}
