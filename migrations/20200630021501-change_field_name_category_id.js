module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('physical_products', 'categoryID', 'category_id');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('physical_products', 'category_id', 'categoryID');
  }
};