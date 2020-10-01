module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("notification_admin", "prize_item_name", {
      type: Sequelize.STRING(50),
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("purchase_histories", "prize_item_name");
  },
};
