module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("purchase_histories", "ffl_not_required",{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }),
      queryInterface.addColumn("winners", "ffl_not_required",{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }),
    ]);
  },

  down: async (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("purchase_histories", "ffl_not_required"),
      queryInterface.removeColumn("winners", "ffl_not_required"),
    ]);
  },
};
