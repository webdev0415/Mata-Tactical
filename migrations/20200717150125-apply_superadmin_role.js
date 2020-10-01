const AWS = require("aws-sdk");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
        region: process.env.REGION,
      });
      const admins = await cognitoProvider
        .listUsersInGroup({
          UserPoolId: process.env.USER_POOL_ID,
          GroupName: process.env.SUPER_ADMIN_GROUP,
        })
        .promise()
        .then(({ Users }) => Users);

      const permissionString = (
        await queryInterface.sequelize.query("SELECT name FROM permissions", {
          type: Sequelize.QueryTypes.SELECT,
        })
      )
        .map(({ name }) => name)
        .toString();

      const [
        adminRole,
      ] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE name = '${process.env.SUPER_ADMIN_ROLE}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      await Promise.all(
        admins.map(async ({ Username }) => {
          const attributesParams = {
            UserAttributes: [
              {
                Name: "custom:permission",
                Value: permissionString,
              },
            ],
            UserPoolId: process.env.USER_POOL_ID,
            Username,
          };
          const groupParams = {
            GroupName: adminRole.id,
            UserPoolId: process.env.USER_POOL_ID,
            Username,
          };
          await cognitoProvider.adminAddUserToGroup(groupParams).promise();
          await cognitoProvider
            .adminUpdateUserAttributes(attributesParams)
            .promise();
        })
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  down: () => {},
};
