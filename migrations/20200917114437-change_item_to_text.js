module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("site_settings", "terms", {
        type: Sequelize.TEXT,
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("site_settings", "terms", {
      type: Sequelize.STRING(8000),
    });
  }
};
