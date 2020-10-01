module.exports = {
  up: async (queryInterface, Sequelize) => {
      return queryInterface.changeColumn(
        "product_image_lists",
        "image_url",
        {
          type: Sequelize.STRING(512),
          unique: true,
        }
      );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("product_image_lists", "image_url", {
      type: Sequelize.STRING(255),
    });
  },
};
