module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("transaction_lists", "promo_code_id", {
        type: Sequelize.UUID,
      }),
      queryInterface.addColumn("transaction_lists", "gift_card_amount", {
        type: Sequelize.DOUBLE,
      }),
      queryInterface.changeColumn("gift_card", "amount", {
        type: Sequelize.DOUBLE,
        allowNull: false,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("transaction_lists", "promo_code_id"),
      queryInterface.removeColumn("transaction_lists", "gift_card_amount"),
      queryInterface.changeColumn("gift_card", "amount", {
        type: Sequelize.INTEGER,
        allowNull: false,
      }),
    ]);
  },
};
