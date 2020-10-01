module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('subscription_lists', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      topic_id: {
        type: Sequelize.UUID,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      subscription_arn: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    queryInterface.dropTable('subscription_lists');
  }
};
