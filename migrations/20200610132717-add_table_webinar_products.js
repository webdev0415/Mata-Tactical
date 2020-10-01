module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('webinar_products', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      imageUrl: {
        type: Sequelize.STRING(255),
      },
      shortDescription: {
        type: Sequelize.TEXT,
      },
      price_per_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      remainingSeats: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      category_id: {
        type: Sequelize.UUID,
      },
      product_status: {
        type: Sequelize.STRING(10),
        defaultValue: "inactive",
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('webinar_products');
  }
};
