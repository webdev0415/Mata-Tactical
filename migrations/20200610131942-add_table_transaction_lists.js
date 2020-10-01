module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('transaction_lists', {
      product_type: {
        type: Sequelize.STRING(20),
      },
      status: {
        type: Sequelize.STRING(10),
        defaultValue: "failed",
      },
      product_id: {
        type: Sequelize.UUID,
      },
      user_id: {
        type: Sequelize.UUID,
      },
      amount: {
        type: Sequelize.INTEGER,
      },
      units: {
        type: Sequelize.INTEGER,
      },
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('transaction_lists');
  }
};
