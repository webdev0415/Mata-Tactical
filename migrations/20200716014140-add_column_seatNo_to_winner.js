module.exports = {
  up: async (queryInterface, Sequelize) => {
   return queryInterface.addColumn('winners','seatNo',{
     type: Sequelize.INTEGER,
     defaultValue: 0,
   });
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('winners','seatNo');
  }
};
