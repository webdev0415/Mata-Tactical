
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('consumer_users','is_removed',{
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('consumer_users','is_removed');
  }
};
