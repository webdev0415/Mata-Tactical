module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('purchase_histories', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      orderNo: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      orderStatus: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      userID: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      productID: {
        type: Sequelize.UUID,
      },
      seatsNo: {
        type: Sequelize.INTEGER,
      },
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('purchase_histories');
  }
};
