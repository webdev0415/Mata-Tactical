module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("notification_lists", "webinar_link", {
      type: Sequelize.STRING(255),
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("notification_lists", "webinar_link");
  },
};
