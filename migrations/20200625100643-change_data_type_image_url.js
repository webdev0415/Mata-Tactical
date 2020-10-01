module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn("physical_products", "imageUrl", {
        type: Sequelize.UUID,
      }),
      queryInterface.changeColumn("webinar_products", "imageUrl", {
        type: Sequelize.UUID,
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn("physical_products", "imageUrl", {
        type: Sequelize.STRING(255),
        allowNull: false,
      }),
      queryInterface.changeColumn("webinar_products", "imageUrl", {
        type: Sequelize.STRING(255),
        allowNull: false,
      }),
    ]);
  },
};
