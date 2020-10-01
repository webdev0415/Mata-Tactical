module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("webinar_products", "soldout_date", {
      type: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("webinar_products", "soldout_date");
  },
};
