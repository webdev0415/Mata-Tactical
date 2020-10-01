module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("role_permissions", {
      permission_id: {
        type: Sequelize.UUID,
      },
      role_id: {
        type: Sequelize.UUID,
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable("role_permissions");
  },
};
