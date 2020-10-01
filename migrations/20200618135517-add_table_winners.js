module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("winners", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      webinar_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      ffl_id: {
        type: Sequelize.UUID,
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable("winners");
  },
};
