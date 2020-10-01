module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("consumer_users", "role_id", {
      type: Sequelize.UUID,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("consumer_users", "role_id");
  },
};
