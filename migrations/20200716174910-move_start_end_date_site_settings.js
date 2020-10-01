module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("site_settings", "startFrom"),
      queryInterface.removeColumn("site_settings", "endTo"),
      queryInterface.addColumn("background_lists", "start_from", {
        type: Sequelize.DATEONLY,
      }),
      queryInterface.addColumn("background_lists", "end_to", {
        type: Sequelize.DATEONLY,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("site_settings", "startFrom", {
        type: Sequelize.DATEONLY,
      }),
      queryInterface.addColumn("site_settings", "endTo", {
        type: Sequelize.DATEONLY,
      }),
      queryInterface.removeColumn("background_lists", "start_from"),
      queryInterface.removeColumn("background_lists", "end_to"),
    ]);
  },
};
