module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("physical_products", "shipping_price", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn("physical_products", "shipping_price");
  },
};
