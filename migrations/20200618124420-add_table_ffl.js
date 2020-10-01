module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("ffl_tables", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      ffl_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      ffl_name: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(300),
      },
      contact_name: {
        type: Sequelize.STRING(100),
      },
      contact_email: {
        type: Sequelize.STRING(50),
      },
      contact_phone: {
        type: Sequelize.STRING(50),
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable("ffl_tables");
  },
};
