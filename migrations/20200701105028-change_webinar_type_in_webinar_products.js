module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("webinar_products", "webinar_type", {
      type: Sequelize.STRING(10),
      validate: {
        isIn: {
          args: [["webinar", "seats", "gifts"]],
          msg: "webinar_type should be webinar, seats or gifts",
        },
      },
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
      return queryInterface.changeColumn("webinar_products", "webinar_type", {
        type: Sequelize.STRING(10),
        validate: {
          isIn: {
            args: [["webinar"]],
            msg: "webinar_type should be webinar",
          },
        },
        allowNull: false,
      });
  },
};
