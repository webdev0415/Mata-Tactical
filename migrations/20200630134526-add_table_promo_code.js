module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("promo_code", {
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
      product_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
        validate: {
          isIn: {
            args: [["physical", "webinar"]],
            msg: "Must be 'physical' or 'webinar'",
          },
        },
      },
      product_id: {
        type: Sequelize.UUID,
      },
      code_type: {
        type: Sequelize.STRING(30),
        validate: {
          isIn: {
            args: [["percent", "seat", "cost"]],
            msg: "Must be 'percent', 'seat' or 'cost'",
          },
        },
      },
      number_used: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      date_from: {
        type: Sequelize.DATE,
      },
      date_to: {
        type: Sequelize.DATE,
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable("promo_code");
  },
};
