module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("activity_logs", "user_id"),
      queryInterface.addColumn("activity_logs", "email", {
        type: Sequelize.STRING(40),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("activity_logs", "user_id", {
        type: Sequelize.UUID,
        allowNull: false,
      }),
      queryInterface.removeColumn("activity_logs", "email"),
    ]);
  },
};
