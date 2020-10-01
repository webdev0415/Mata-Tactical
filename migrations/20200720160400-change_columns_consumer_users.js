module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn(
        "consumer_users",
        "address",
        {
          type: Sequelize.STRING(150),
          allowNull: true,
        }
      ),
      queryInterface.changeColumn(
          "consumer_users",
          "phone_number",
          {
            type: Sequelize.STRING(50),
            allowNull: true,
          }
      ),
      queryInterface.changeColumn(
          "consumer_users",
          "first_name",
          {
            type: Sequelize.STRING(40),
            allowNull: true,
          }
      ),
      queryInterface.changeColumn(
          "consumer_users",
          "last_name",
          {
            type: Sequelize.STRING(40),
            allowNull: true,
          }
      ),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn(
          "consumer_users",
          "address",
          {
            type: Sequelize.STRING(150),
            allowNull: false,
          }
      ),
      queryInterface.changeColumn(
          "consumer_users",
          "phone_number",
          {
            type: Sequelize.STRING(50),
            allowNull: false,
          }
      ),
      queryInterface.changeColumn(
          "consumer_users",
          "first_name",
          {
            type: Sequelize.STRING(40),
            allowNull: false,
          }
      ),
      queryInterface.changeColumn(
          "consumer_users",
          "last_name",
          {
            type: Sequelize.STRING(40),
            allowNull: false,
          }
      ),
    ]);
  }
};
