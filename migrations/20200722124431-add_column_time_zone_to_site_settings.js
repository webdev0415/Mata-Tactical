module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("site_settings", "time_zone", {
      type: Sequelize.STRING(50),
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("site_settings", "time_zone");
  },
};
