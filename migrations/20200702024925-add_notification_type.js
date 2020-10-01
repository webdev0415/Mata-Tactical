
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("notification_admin","service_type",{
      type: Sequelize.STRING(20),
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("notification_admin","service_type");
  }
};
