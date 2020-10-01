module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn("background_lists", "start_from", {
        type: Sequelize.DATE,
      }),
      queryInterface.changeColumn("background_lists", "end_to", {
        type: Sequelize.DATE,
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn("background_lists", "start_from", {
        type: Sequelize.DATEONLY,
      }),
      queryInterface.changeColumn("background_lists", "end_to", {
        type: Sequelize.DATEONLY,
      }),
    ]);
  },
};
