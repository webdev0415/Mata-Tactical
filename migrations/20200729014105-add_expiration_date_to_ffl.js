module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("ffl_tables", "expiration_date", {
      type: Sequelize.DATE,
      defaultValue: 0,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("ffl_tables", "expiration_date");
  },
};
