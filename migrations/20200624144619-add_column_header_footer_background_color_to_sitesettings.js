module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("site_settings", "header_background_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "footer_background_color",{
        type: Sequelize.STRING(50),
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("site_settings", "header_background_color"),
      queryInterface.removeColumn("site_settings", "footer_background_color"),
    ]);
  },
};
