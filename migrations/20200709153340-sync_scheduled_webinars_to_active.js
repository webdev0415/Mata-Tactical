module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query(
        'UPDATE `physical_products` SET product_status="active",scheduled_time = NOW() WHERE publish_method="scheduled" AND product_status = "inactive" AND scheduled_time < NOW()',
        { type: Sequelize.QueryTypes.UPDATE }
      ),
      queryInterface.sequelize.query(
        'UPDATE `webinar_products` SET product_status="active",scheduled_time = NOW() WHERE publish_method="scheduled" AND product_status = "inactive" AND scheduled_time < NOW()',
        { type: Sequelize.QueryTypes.UPDATE }
      ),
      queryInterface.sequelize.query(
        'UPDATE `physical_products` SET scheduled_time = null WHERE product_status = "hold"',
        { type: Sequelize.QueryTypes.UPDATE }
      ),
    ]);
  },
  down: async () => {},
};
