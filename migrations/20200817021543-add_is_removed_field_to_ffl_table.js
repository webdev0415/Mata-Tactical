module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("ffl_tables", "is_removed", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("ffl_tables", "is_removed");
  },
};
