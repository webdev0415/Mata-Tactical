const { addConstraints, removeConstraints } = require('../libs/db_utils');

const constraints = {
  userID: {
    type: 'FOREIGN KEY',
    references: {
      table: 'consumer_users',
      field: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
};


module.exports = {
  up: async (queryInterface) => {
    return addConstraints(queryInterface,'purchase_histories', constraints);
  },

  down: async (queryInterface) => {
    return removeConstraints(queryInterface,'purchase_histories', constraints);
  }
};
