module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('notification_states', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      notification_status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "created",
      },
      notification_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('notification_states');
  }
};
