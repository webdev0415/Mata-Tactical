module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("purchase_histories", "price", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("purchase_histories", "price");
  },
};
