module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('physical_products','pricePerItem',{
        type: Sequelize.FLOAT
      }),
      queryInterface.changeColumn('physical_products','shipping_price',{
        type: Sequelize.FLOAT,
        defaultValue: 0,
      }),
      queryInterface.changeColumn('purchase_histories','price',{
        type: Sequelize.FLOAT,
        defaultValue: 0,
      }),
      queryInterface.changeColumn('transaction_lists','amount',{
        type: Sequelize.FLOAT,
      }),
      queryInterface.changeColumn('webinar_products','price_per_seats',{
        type: Sequelize.FLOAT,
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('physical_products','pricePerItem',{
        type: Sequelize.INTEGER
      }),
      queryInterface.changeColumn('physical_products','shipping_price',{
        type: Sequelize.INTEGER,
        defaultValue: 0,
      }),
      queryInterface.changeColumn('purchase_histories','price',{
        type: Sequelize.INTEGER,
        defaultValue: 0,
      }),
      queryInterface.changeColumn('transaction_lists','amount',{
        type: Sequelize.INTEGER,
      }),
      queryInterface.changeColumn('webinar_products','price_per_seats',{
        type: Sequelize.INTEGER,
      })
    ]);
  }
};
