module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('physical_products', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      productName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      pricePerItem: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      shortDescription: {
        type: Sequelize.TEXT,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      imageUrl: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      categoryID: {
        type: Sequelize.UUID,
      },
      product_status: {
        type: Sequelize.STRING(10),
        defaultValue: "inactive",
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('physical_products');
  }
};
