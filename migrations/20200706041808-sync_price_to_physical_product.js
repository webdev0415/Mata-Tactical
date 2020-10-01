module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const purchase_histories = await queryInterface.sequelize.query(
        "SELECT productID, `purchase_histories`.`id` AS purchase_id,`physical_products`.`pricePerItem` FROM `purchase_histories` INNER JOIN `physical_products` ON `physical_products`.`id` = `purchase_histories`.`productID` WHERE product_type = 'product'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises = purchase_histories.map(async (purchase_history) => {
        await queryInterface.sequelize.query(
          "UPDATE purchase_histories SET price= :price WHERE purchase_histories.productID = :product_id",
          {
            type: Sequelize.QueryTypes.UPDATE,
            replacements: {
              price: purchase_history.pricePerItem,
              product_id: purchase_history.purchase_id,
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
