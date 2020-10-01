module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('site_settings', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      instagram_media_links: {
        type: Sequelize.STRING(255),
      },
      facebook_media_links: {
        type: Sequelize.STRING(255),
      },
      contact_us_page_info: {
        type: Sequelize.TEXT,
      },
      contact_us_email_address: {
        type: Sequelize.STRING(50),
      },
      commentsOption: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      termsOption: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      backgroundOption: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      startFrom: {
        type: Sequelize.DATEONLY,
      },
      endTo: {
        type: Sequelize.DATEONLY,
      },
      headerColor: {
        type: Sequelize.STRING(8),
      },
      footerColor: {
        type: Sequelize.STRING(8),
      },
      backgroundID: {
        type: Sequelize.UUID,
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('site_settings');
  }
};
