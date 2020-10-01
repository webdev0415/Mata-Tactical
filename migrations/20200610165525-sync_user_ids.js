const AWS = require("aws-sdk");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const users = await queryInterface.sequelize.query(
        "SELECT email, id from consumer_users",
        { type: Sequelize.QueryTypes.SELECT }
      );
      const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
        region: "us-east-1",
      });

      const promises = users.map(async ({ email, id: oldId }) => {
        const params = {
          UserPoolId: process.env.USER_POOL_ID,
          Filter: `email = "${email}"`,
          Limit: 1,
        };
        const user = await cognitoProvider.listUsers(params).promise();
        if (user.Users.length !== 0) {
          const userId = user.Users[0].Username;
          const queryUsersTable = `UPDATE consumer_users SET id = '${userId}' WHERE email = '${email}'`;
          return queryInterface.sequelize.query(queryUsersTable, {
            type: Sequelize.QueryTypes.UPDATE,
          });
        } else {
          const queryUsersTable = `DELETE FROM consumer_users WHERE email = '${email}'`;
          return queryInterface.sequelize.query(queryUsersTable, {
            type: Sequelize.QueryTypes.DELETE,
          });
        }
      });

      return Promise.all(promises);
    } catch (err) {
      console.log(err);
    }
  },

  down: async () => {},
};
