module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("site_settings", "headerColor"),
      queryInterface.removeColumn("site_settings", "footerColor"),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("site_settings", "headerColor", {
        type: Sequelize.STRING(8),
      }),
      queryInterface.addColumn("site_settings", "footerColor", {
        type: Sequelize.STRING(8),
      }),
    ]);
  },
};
