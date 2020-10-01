module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('comments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      comment_content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.UUID,
        defaultValue: "",
      },
      product_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      edit_date: {
        type: Sequelize.DATE,
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      pinned_date: {
        type: Sequelize.DATE,
      }
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('comments');
  }
};
