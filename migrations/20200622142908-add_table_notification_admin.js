module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("notification_admin", {
       id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        product_type: {
          type: Sequelize.STRING(30),
          allowNull: false,
          validate: {
            isIn: {
              args: [["physical", "webinar"]],
              msg: "Must be physical or webinar",
            },
          },
        },
        status: {
          type: Sequelize.STRING(100),
          validate: {
            isIn: {
              args: [["new", "read"]],
              msg: "Must be new or read",
            },
          },
        },
        product_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        product_image: {
          type: Sequelize.STRING(512),
          allowNull: false,
        },
        updatedAt: Sequelize.DATE,
        createdAt: Sequelize.DATE,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("notification_admin");
  }
};
