module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('background_lists', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      image_url: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    });
  },
  down: async (queryInterface) => {
    return queryInterface.dropTable('background_lists');
  }
};
