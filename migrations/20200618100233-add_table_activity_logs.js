module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      logged_in_time: {
        type: Sequelize.DATE,
      },
      logged_out_time:
      {
        type:Sequelize.DATE,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('activity_logs');
  }
};
