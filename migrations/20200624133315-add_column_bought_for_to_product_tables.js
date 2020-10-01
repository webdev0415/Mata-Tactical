module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("physical_products", "bought_for", {
        type: Sequelize.INTEGER,
      }),
      queryInterface.addColumn("webinar_products", "bought_for",{
        type: Sequelize.INTEGER,
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("physical_products", "bought_for"),
      queryInterface.removeColumn("webinar_products", "bought_for"),
    ]);
  },
};
