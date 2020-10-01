module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("purchase_histories", "units", {
      type: Sequelize.INTEGER,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("purchase_histories", "units");
  },
};
