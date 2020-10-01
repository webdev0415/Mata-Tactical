const { addConstraints, removeConstraints } = require('../libs/db_utils');

const constraints = {
  user_id: {
    type: 'FOREIGN KEY',
    references: {
      table: 'consumer_users',
      field: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
};

module.exports = {
  up: async (queryInterface) => {
    try {
    const result = await addConstraints(queryInterface,'activity_logs', constraints);
      return result;
  }
    catch (err)
    {
      console.log(err);
    }
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: async (queryInterface) => {
    return removeConstraints(queryInterface,'activity_logs', constraints);
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
