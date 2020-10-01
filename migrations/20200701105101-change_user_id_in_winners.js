module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("winners", "user_id", {
      type: Sequelize.UUID,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("winners", "user_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },
};
