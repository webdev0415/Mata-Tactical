module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('webinar_product_details', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      webinar_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      seatNo: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      seat_status: {
        type: Sequelize.STRING(20),
      },
      reserved_time: {
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('webinar_product_details');
  }
};
