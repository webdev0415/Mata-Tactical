const AWS = require("aws-sdk");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
        region: process.env.REGION,
      });

      const users = await queryInterface.sequelize.query(
        `SELECT * FROM consumer_users WHERE user_role = 'admin'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const promises = users.map(async (user) => {
        var params = {
          UserPoolId: process.env.USER_POOL_ID,
          Username: user.email,
        };
        console.log(params);
        const listGroups = await cognitoProvider
          .adminListGroupsForUser(params)
          .promise()
          .then(({ Groups }) => Groups);
        console.log("---------list groups-------", params, listGroups);
        console.log("---------list groups length-------", listGroups.length);
        if (!listGroups.length) return;
        const customGroups = listGroups.filter(
          (user) => user.GroupName !== process.env.SUPER_ADMIN_GROUP
        );
        console.log(customGroups);
        if (customGroups.length > 1) {
          const currentGroup = customGroups[0];
          const needRemoveGroup = customGroups.filter(
            (group) => group.GroupName !== currentGroup.GroupName
          );
          await Promise.all(
            needRemoveGroup.map(async (removeGroup) => {
              const removeGroupParams = {
                GroupName: removeGroup.GroupName,
                UserPoolId: process.env.USER_POOL_ID,
                Username: user.email,
              };
              return await cognitoProvider
                .adminRemoveUserFromGroup(removeGroupParams)
                .promise();
            })
          );

          const permissionString = (
            await queryInterface.sequelize.query(
              "SELECT * FROM role_permissions as RolePermissions JOIN permissions as Permission ON `Permission`.`id` = `RolePermissions`.`permission_id` WHERE RolePermissions.role_id = :roleID",
              {
                type: Sequelize.QueryTypes.SELECT,
                replacements: {
                  roleID: currentGroup.GroupName,
                },
              }
            )
          )
            .map(({ name }) => name)
            .toString();
          const attributesParams = {
            UserAttributes: [
              {
                Name: "custom:permission",
                Value: permissionString,
              },
            ],
            UserPoolId: process.env.USER_POOL_ID,
            Username: user.email,
          };
          console.log(attributesParams);
          const result = await cognitoProvider
            .adminUpdateUserAttributes(attributesParams)
            .promise();
          console.log(result);
          await queryInterface.sequelize.query(
            `UPDATE consumer_users SET role_id = :roleID WHERE id = :userID`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: {
                roleID: currentGroup.GroupName,
                userID: user.id,
              },
            }
          );
        } else if (customGroups.length) {
          const result = await queryInterface.sequelize.query(
            `UPDATE consumer_users SET role_id = :roleID WHERE id = :userID`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: {
                roleID: customGroups[0].GroupName,
                userID: user.id,
              },
            }
          );
          console.log("update_--result", result);
        }
      });
      return await Promise.all(promises);
    } catch (err) {
      console.log("err", err);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {},
};
