module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("purchase_histories", "ffl_id", {
      type: Sequelize.UUID,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("purchase_histories", "ffl_id");
  },
};
