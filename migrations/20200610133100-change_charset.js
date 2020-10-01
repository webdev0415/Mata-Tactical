module.exports = {
  up: async (queryInterface, Sequelize) => {
      return Promise.all([
          queryInterface.sequelize.query('ALTER TABLE background_lists CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE comments CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE consumer_users CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE faq_lists CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE notification_lists CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE notification_states CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE physical_products CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE product_description_lists CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE purchase_histories CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE site_settings CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE subscription_lists CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE topic_lists CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE transaction_lists CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE webinar_product_details CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
          queryInterface.sequelize.query('ALTER TABLE webinar_products CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci'),
      ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE background_lists CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE comments CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE consumer_users CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE faq_lists CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE notification_lists CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE notification_states CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE physical_products CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE product_description_lists CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE purchase_histories CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE site_settings CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE subscription_lists CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE topic_lists CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE transaction_lists CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE webinar_product_details CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
      queryInterface.sequelize.query('ALTER TABLE webinar_products CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci'),
    ]);
  }
};
