module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("product_image_lists", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("product_image_lists");
   }
};
