module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("purchase_histories", "shipping_address",{
        type: Sequelize.STRING(100),
      }),
      queryInterface.addColumn("winners", "shipping_address",{
        type: Sequelize.STRING(100),
       }),
    ]);
  },

  down: async (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("purchase_histories", "shipping_address"),
      queryInterface.removeColumn("winners", "shipping_address"),
    ]);
  },
};
