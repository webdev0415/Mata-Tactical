const { addConstraints, removeConstraints } = require('../libs/db_utils');

const constraints = {
  role_id: {
    type: 'FOREIGN KEY',
    references: {
      table: 'roles',
      field: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  permission_id: {
    type: 'FOREIGN KEY',
    references: {
      table: 'permissions',
      field: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
};


module.exports = {
  up: async (queryInterface) => {
    return addConstraints(queryInterface,'role_permissions', constraints);
  },

  down: async (queryInterface) => {
    return removeConstraints(queryInterface,'role_permissions', constraints);
  }
};
