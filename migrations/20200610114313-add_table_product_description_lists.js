module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('product_description_lists', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_type: {
        type: Sequelize.STRING(10),
      },
      kind_list: {
        type: Sequelize.STRING(255),
      },
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('product_description_lists');
  }
};
