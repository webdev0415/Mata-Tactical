const { v4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const purchase_histories = await queryInterface.sequelize.query(
        "SELECT id FROM purchase_histories WHERE orderStatus ='Purchased' AND product_type = 'product'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises = purchase_histories.map(async (purchase_history) => {
        await queryInterface.sequelize.query(
          "INSERT INTO `shipping_items` (id,purchase_or_winner_id, shipping_status, product_type) VALUES (:id ,:prod_id,'label_not_printed','physical')",
          {
            type: Sequelize.QueryTypes.INSERT,
            replacements: {
              id: v4(),
              prod_id: purchase_history.id,
            },
          }
        );
      });
      await Promise.all(promises);
      const winners = await queryInterface.sequelize.query(
        "SELECT id FROM winners WHERE user_id IS NOT NULL AND product_type IN ('physical','webinar')",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises_winners = winners.map(async (winner) => {
        await queryInterface.sequelize.query(
          "INSERT INTO `shipping_items` (id,purchase_or_winner_id, shipping_status, product_type) VALUES (:id,:prod_id,'label_not_printed','webinar')",
          {
            type: Sequelize.QueryTypes.INSERT,
            replacements: {
              id: v4(),
              prod_id: winner.id,
            },
          }
        );
      });
      await Promise.all(promises_winners);
    } catch (err) {
      console.log(err);
    }
  },
  down: async () => {},
};
