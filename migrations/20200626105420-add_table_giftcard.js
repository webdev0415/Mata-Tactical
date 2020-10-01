module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("gift_card", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      code: {
        type: Sequelize.STRING(100),
        unique: true,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
      },
      transaction_id: {
        type: Sequelize.UUID,
      },
      type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "created",
        validate: {
          isIn: {
            args: [["created", "won"]],
            msg: "Must be created or won",
          },
        },
      },
      status: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "unused",
        validate: {
          isIn: {
            args: [["used", "unused"]],
            msg: "Must be used or unused",
          },
        },
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("gift_card");
  },
};
