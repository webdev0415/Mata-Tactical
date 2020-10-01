module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('site_settings', 'terms', {
      type: Sequelize.STRING(8000)
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('site_settings', 'terms');
  }
};
