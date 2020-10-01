module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
            'site_settings',
            'hide_comments',
            {
                type: Sequelize.BOOLEAN
            }
        );
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.removeColumn(
            'site_settings',
            'hide_comments'
        );
    }
};