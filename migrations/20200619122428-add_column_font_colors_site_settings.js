module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("site_settings", "menu_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "footer_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "header1_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "header2_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "table_header_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "table_content_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "form_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "paragraph_color", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("site_settings", "special_color", {
        type: Sequelize.STRING(50),
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("site_settings", "menu_color"),
      queryInterface.removeColumn("site_settings", "footer_color"),
      queryInterface.removeColumn("site_settings", "header1_color"),
      queryInterface.removeColumn("site_settings", "header2_color"),
      queryInterface.removeColumn("site_settings", "table_header_color"),
      queryInterface.removeColumn("site_settings", "table_content_color"),
      queryInterface.removeColumn("site_settings", "form_color"),
      queryInterface.removeColumn("site_settings", "paragraph_color"),
      queryInterface.removeColumn("site_settings", "special_color"),
    ]);
  },
};
