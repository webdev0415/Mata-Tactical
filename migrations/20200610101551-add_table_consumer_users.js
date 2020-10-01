module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("consumer_users", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(50),
        validate: {
          isEmail: true,
        },
        allowNull: false,
        unique: true,
      },
      profile_picture: {
        type: Sequelize.STRING(512),
      },
      address: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      phone_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      notify_products: {
        type: Sequelize.STRING(20),
        defaultValue: "none",
      },
      notify_webinar: {
        type: Sequelize.STRING(20),
        defaultValue: "none",
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      first_name: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      verified_method: {
        type: Sequelize.STRING(10),
      },
      user_role: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      auth_banned : {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      comment_banned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      forgot_link: {
        type: Sequelize.TEXT,
        defaultValue: ""
      },
      is_forget: {
        type: Sequelize.BOOLEAN,
        default: false
      }
    });

  },
  down: async (queryInterface) => {
    return queryInterface.dropTable('consumer_users');
  }
};
