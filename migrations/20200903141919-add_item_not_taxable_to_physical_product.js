module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("physical_products", "taxable", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("physical_products", "taxable");
  },
};
