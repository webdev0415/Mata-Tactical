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
    return addConstraints(queryInterface,'transaction_lists', constraints);
  },

  down: async (queryInterface) => {
    return removeConstraints(queryInterface,'transaction_lists', constraints);
  }
};
