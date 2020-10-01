module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("transaction_lists", "payment_id", {
      type: Sequelize.STRING(50),
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("transaction_lists", "payment_id");
  },
};

