module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("purchase_histories", "shipping_price", {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("purchase_histories", "shipping_price");
  },
};
