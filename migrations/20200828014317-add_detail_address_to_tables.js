module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      return Promise.all([
        queryInterface.addColumn("consumer_users", "street_address", {
          type: Sequelize.STRING(150),
        }),
        queryInterface.addColumn("consumer_users", "city", {
          type: Sequelize.STRING(50),
        }),
        queryInterface.addColumn("consumer_users", "state", {
          type: Sequelize.STRING(20),
        }),
        queryInterface.addColumn("consumer_users", "zipcode", {
          type: Sequelize.STRING(10),
        }),
        queryInterface.addColumn("ffl_tables", "street_address", {
          type: Sequelize.STRING(150),
        }),
        queryInterface.addColumn("ffl_tables", "city", {
          type: Sequelize.STRING(50),
        }),
        queryInterface.addColumn("ffl_tables", "state", {
          type: Sequelize.STRING(20),
        }),
        queryInterface.addColumn("ffl_tables", "zipcode", {
          type: Sequelize.STRING(10),
        }),
        queryInterface.addColumn("purchase_histories", "street_address", {
          type: Sequelize.STRING(150),
        }),
        queryInterface.addColumn("purchase_histories", "city", {
          type: Sequelize.STRING(50),
        }),
        queryInterface.addColumn("purchase_histories", "state", {
          type: Sequelize.STRING(20),
        }),
        queryInterface.addColumn("purchase_histories", "zipcode", {
          type: Sequelize.STRING(10),
        }),
        queryInterface.addColumn("winners", "street_address", {
          type: Sequelize.STRING(150),
        }),
        queryInterface.addColumn("winners", "city", {
          type: Sequelize.STRING(50),
        }),
        queryInterface.addColumn("winners", "state", {
          type: Sequelize.STRING(20),
        }),
        queryInterface.addColumn("winners", "zipcode", {
          type: Sequelize.STRING(10),
        }),
      ]);
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  down: async (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("consumer_users", "street_address"),
      queryInterface.removeColumn("consumer_users", "city"),
      queryInterface.removeColumn("consumer_users", "state"),
      queryInterface.removeColumn("consumer_users", "zipcode"),
      queryInterface.removeColumn("ffl_tables", "street_address"),
      queryInterface.removeColumn("ffl_tables", "city"),
      queryInterface.removeColumn("ffl_tables", "state"),
      queryInterface.removeColumn("ffl_tables", "zipcode"),
      queryInterface.removeColumn("purchase_histories", "street_address"),
      queryInterface.removeColumn("purchase_histories", "city"),
      queryInterface.removeColumn("purchase_histories", "state"),
      queryInterface.removeColumn("purchase_histories", "zipcode"),
      queryInterface.removeColumn("winners", "street_address"),
      queryInterface.removeColumn("winners", "city"),
      queryInterface.removeColumn("winners", "state"),
      queryInterface.removeColumn("winners", "zipcode"),
    ]);
  },
};
