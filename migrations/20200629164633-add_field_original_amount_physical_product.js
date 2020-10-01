module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("physical_products", "original_amount", {
      type: Sequelize.INTEGER,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("physical_products", "original_amount");
  }
};
