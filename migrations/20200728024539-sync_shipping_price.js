module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const purchase_histories = await queryInterface.sequelize.query(
        "SELECT productID, `purchase_histories`.`id` AS purchase_id,`physical_products`.`shipping_price` as shipping_price FROM `purchase_histories` INNER JOIN `physical_products` ON `physical_products`.`id` = `purchase_histories`.`productID` WHERE product_type = 'product'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log(purchase_histories);
      const promises = purchase_histories.map(async (purchase_history) => {
        await queryInterface.sequelize.query(
          "UPDATE purchase_histories SET shipping_price= :price WHERE purchase_histories.productID = :product_id",
          {
            type: Sequelize.QueryTypes.UPDATE,
            replacements: {
              price: purchase_history.shipping_price,
              product_id: purchase_history.productID,
            },
          }
        );
      });
      return Promise.all(promises);
    } catch (err) {
      console.log(err);
    }
  },
  down: async () => {},
};
