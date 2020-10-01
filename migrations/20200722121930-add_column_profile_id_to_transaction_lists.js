module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("transaction_lists", "consumer_profile_id", {
        type: Sequelize.STRING(30),
      }),
      queryInterface.addColumn("transaction_lists", "payment_profile_id", {
        type: Sequelize.STRING(30),
      }),
    ]);
  },

  down: async (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("transaction_lists", "consumer_profile_id"),
      queryInterface.removeColumn("transaction_lists", "payment_profile_id"),
    ]);
  },
};
