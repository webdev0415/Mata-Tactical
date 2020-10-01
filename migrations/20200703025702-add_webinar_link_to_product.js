module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("webinar_products", "webinar_link", {
      type: Sequelize.STRING(255),
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("webinar_products", "webinar_link");
  },
};
