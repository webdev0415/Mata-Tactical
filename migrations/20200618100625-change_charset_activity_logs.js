module.exports = {
  up: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.query('ALTER TABLE activity_logs CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci');
  },
  down: async (queryInterface, Sequelize) => {
      return queryInterface.sequelize.query('ALTER TABLE activity_logs CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci');
  }
};
