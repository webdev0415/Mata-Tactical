const { v4 } = require('uuid');
const AWS = require("aws-sdk");

module.exports = {
  up: async (queryInterface, Sequelize) => {
      const now = Sequelize.fn('now');
      const timestamps = { createdAt: now, updatedAt: now };
      const role_id = v4();
      await queryInterface.bulkInsert('roles', [
        { id: role_id, name: process.env.SUPER_ADMIN_ROLE, ...timestamps }
      ]);
      const permissions = (await queryInterface.sequelize.query(
          'SELECT id FROM permissions', { type: Sequelize.QueryTypes.SELECT }
      )).map(({ id }) => ({ role_id, permission_id: id}));
      await queryInterface.bulkInsert('role_permissions', permissions);
      const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
          region: process.env.REGION,
      });
      await cognitoProvider.createGroup({
          GroupName: role_id,
          UserPoolId: process.env.USER_POOL_ID,
          Description: 'Super admin role with all permissions'
      }).promise();
  },

  down: () => {
  }
};
