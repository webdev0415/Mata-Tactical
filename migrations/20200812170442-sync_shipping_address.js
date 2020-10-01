module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const purchase_histories = await queryInterface.sequelize.query(
        "SELECT `purchase_histories`.`id` AS purchase_id,`consumer_users`.`address` as shipping_address FROM `purchase_histories` INNER JOIN `consumer_users` ON `consumer_users`.`id` = `purchase_histories`.`userID`",
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log(purchase_histories);
      const promises = purchase_histories.map(async (purchase_history) => {
        await queryInterface.sequelize.query(
          "UPDATE purchase_histories SET shipping_address= :address WHERE purchase_histories.id = :purchase_id",
          {
            type: Sequelize.QueryTypes.UPDATE,
            replacements: {
              address: purchase_history.shipping_address,
              purchase_id: purchase_history.purchase_id,
            },
          }
        );
      });
      await Promise.all(promises);
      const winner_histories = await queryInterface.sequelize.query(
        "SELECT `winners`.`id` AS winner_id,`consumer_users`.`address` as shipping_address FROM `winners` INNER JOIN `consumer_users` ON `consumer_users`.`id` = `winners`.`user_id`",
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log(winner_histories);
      const winner_promises = winner_histories.map(async (winner_history) => {
        await queryInterface.sequelize.query(
          "UPDATE winners SET shipping_address= :address WHERE winners.id = :winner_id",
          {
            type: Sequelize.QueryTypes.UPDATE,
            replacements: {
              address: winner_history.shipping_address,
              winner_id: winner_history.winner_id,
            },
          }
        );
      });
      await Promise.all(winner_promises);
    } catch (err) {
      console.log(err);
    }
  },
  down: async () => {},
};
