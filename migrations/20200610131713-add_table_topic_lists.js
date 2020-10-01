module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('topic_lists', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      arn: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      notification_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "none",
      },
      webinar_id: {
        type: Sequelize.STRING(255),
        defaultValue: "none",
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('topic_lists');
  }
};
