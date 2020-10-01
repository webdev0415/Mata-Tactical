module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("shipping_items", "book_number", {
      type: Sequelize.STRING(50),
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("shipping_items", "book_number");
  },
};
