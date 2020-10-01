module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("site_settings", "queued_webinar_limit", {
      type: Sequelize.INTEGER,
      defaultValue: 5,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("site_settings", "queued_webinar_limit");
  }
};
