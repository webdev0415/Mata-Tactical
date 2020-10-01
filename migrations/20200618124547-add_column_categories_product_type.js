module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
            'categories',
            'product_type',
            {
                type: Sequelize.STRING(50)
            }
        );
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.removeColumn(
            'categories',
            'product_type'
        );
    }
};