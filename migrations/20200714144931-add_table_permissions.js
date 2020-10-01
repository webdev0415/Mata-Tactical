module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("permissions", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        unique: true,
        allowNull: false,
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable("permissions");
  },
};
