module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('notification_lists', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      service_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      product_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      product_image: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('notifications_lists');
  }
};
