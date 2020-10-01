module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("purchase_histories", "tax", {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("purchase_histories", "tax");
  },
};
