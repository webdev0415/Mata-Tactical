module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("physical_products", "publish_method", {
        type: Sequelize.STRING(10),
        allowNull: false,
      }),
      queryInterface.addColumn("physical_products", "scheduled_time", {
        type: Sequelize.DATE,
      }),
      queryInterface.addColumn("webinar_products", "webinar_type", {
        type: Sequelize.STRING(10),
        allowNull: false,
      }),
      queryInterface.addColumn("webinar_products", "publish_method", {
        type: Sequelize.STRING(10),
        allowNull: false,
      }),
      queryInterface.addColumn("webinar_products", "scheduled_time", {
        type: Sequelize.DATE,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("physical_products", "publish_method"),
      queryInterface.removeColumn("physical_products", "scheduled_time"),
      queryInterface.removeColumn("webinar_products", "webinar_type"),
      queryInterface.removeColumn("webinar_products", "publish_method"),
      queryInterface.removeColumn("webinar_products", "scheduled_time"),
    ]);
  },
};
