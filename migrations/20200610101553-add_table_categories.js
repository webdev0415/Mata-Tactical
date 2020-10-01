module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.createTable('categories', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4,
            },
            category_name: {
                type: Sequelize.STRING(50),
                unique: true,
                allowNull: false,
            }
        });
    },
    down: async (queryInterface) => {
        return queryInterface.dropTable('categories');
    }
};
