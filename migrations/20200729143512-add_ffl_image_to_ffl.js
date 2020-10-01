module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("ffl_tables", "ffl_image_url", {
      type: Sequelize.STRING(255),
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("ffl_tables", "ffl_image_url");
  },
};
