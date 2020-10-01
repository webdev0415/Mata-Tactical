import { ConsumerUser, Permission, Role } from "../../models";
const AWS = require("aws-sdk");
import { Op } from "sequelize";
export const permissionsList = {
  dashboardView: "dashboardView",
  categoryView: "categoryView",
  categoryEdit: "categoryEdit",
  productView: "productView",
  productEdit: "productEdit",
  webinarQueueView: "webinarQueueView",
  webinarQueueEdit: "webinarQueueEdit",
  soldOutWebinarsView: "soldOutWebinarsView",
  soldOutWebinarsEdit: "soldOutWebinarsEdit",
  soldOutPhysicalView: "soldOutPhysicalView",
  soldOutPhysicalEdit: "soldOutPhysicalEdit",
  fflView: "fflView",
  fflEdit: "fflEdit",
  giftCardsView: "giftCardsView",
  giftCardsEdit: "giftCardsEdit",
  promoCodesView: "promoCodesView",
  promoCodesEdit: "promoCodesEdit",
  faqEdit: "faqEdit",
  faqView: "faqView",
  settingsEditGeneral: "settingsEditGeneral",
  settingsEditAdvanced: "settingsEditAdvanced",
  settingsView: "settingsView",
  usersView: "usersView",
  usersEdit: "usersEdit",
  usersDelete: "usersDelete",
  userCreateAdmin: "userCreate",
  completedWebinarsView: "completedWebinarsView",
  completedWebinarsEdit: "completedWebinarsEdit",
  rolesView: "rolesView",
  rolesEdit: "rolesEdit",
  seatsRefund: "seatsRefundView",
};

export default class RolesService {
  static async permissionsList() {
    const result = await Permission.findAll();
    return { result };
  }

  static async rolesList() {
    const scopes = [{ method: ["withPermissions", Permission] }];
    return { result: { data: await Role.scope(...scopes).findAll() } };
  }

  static async addRole({ body: { name, permissionIds } }) {
    const newRole = await Role.create({ name });
    const permissions = await Permission.findAll({ where: { id: { [Op.in]: permissionIds } } });
    await newRole.setPermissions(permissions);
    const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
      region: process.env.REGION,
    });
    await cognitoProvider
      .createGroup({
        GroupName: newRole.id,
        UserPoolId: process.env.USER_POOL_ID,
        Description: name,
      })
      .promise();
    return { result: { data: newRole } };
  }

  static async getRoleById({ params: { id } }) {
    const scopes = [{ method: ["withPermissions", Permission] }];
    return { result: await Role.scope(...scopes).findOne({ where: { id } }) };
  }

  static async updateRole({ params: { id }, body: { permissionIds } }) {
    const permissions = await Permission.findAll({ where: { id: { [Op.in]: permissionIds } } });
    const role = await Role.findOne({ where: { id } });
    await role.setPermissions(permissions);
    const permissionString = permissions.map(({ dataValues: { name } }) => name).join(",");
    const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
      region: process.env.REGION,
    });
    const users = await cognitoProvider
      .listUsersInGroup({
        UserPoolId: process.env.USER_POOL_ID,
        GroupName: role.id,
      })
      .promise()
      .then(({ Users }) => Users);

    await Promise.all(
      users.map(async ({ Username }) => {
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
        await cognitoProvider.adminUpdateUserAttributes(attributesParams).promise();
      })
    );
    return { result: { message: "success" } };
  }

  static async attachRoleToUser({ params: { role_id }, body: { userData } }) {
    const scopes = [{ method: ["withPermissions", Permission] }];
    const role = await Role.scope(...scopes).findOne({
      where: { id: role_id },
    });

    if (role) {
      const { permissions, id } = role.toJSON();
      const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
        region: process.env.REGION,
      });
      const is_existing = await ConsumerUser.findOne({where: {email: userData.email}});
      if (is_existing && is_existing.is_removed)
      {
        const err = new Error("Account with this email already exist");
        err.status = 404;
        throw err;
      }
      const [user] = await ConsumerUser.findOrBuild({
        where: { email: userData.email },
        defaults: userData,
      });
      const params = {
        UserAttributes: [
          {
            Name: "custom:permission",
            Value: permissions.map(({ name }) => name).join(","),
          },
        ],
        UserPoolId: process.env.USER_POOL_ID,
        Username: user.email,
      };
      if (user.isNewRecord) {
        params.TemporaryPassword = userData.password;
        const { User } = await cognitoProvider.adminCreateUser(params).promise();
        user.setDataValue("id", User.Username);
      } else {
        if (user.role_id) {
          const removeGroup = {
            GroupName: user.role_id,
            UserPoolId: process.env.USER_POOL_ID,
            Username: user.email,
          };

          await cognitoProvider.adminRemoveUserFromGroup(removeGroup).promise();
        }
        await cognitoProvider.adminUpdateUserAttributes(params).promise();
      }

      const groupParams = {
        GroupName: id,
        UserPoolId: process.env.USER_POOL_ID,
        Username: user.email,
      };
      // For Matas support
      const adminGroupParams = {
        GroupName: process.env.SUPER_ADMIN_GROUP,
        UserPoolId: process.env.USER_POOL_ID,
        Username: user.email,
      };
      await Promise.all([
        cognitoProvider.adminAddUserToGroup(groupParams).promise(),
        cognitoProvider.adminAddUserToGroup(adminGroupParams).promise(),
      ]);

      user.setDataValue("user_role", "admin");
      user.setDataValue("role_id", id);
      await user.save();
      return { result: { data: "success" } };
    }
    const err = new Error("Role not found");
    err.status = 404;
    throw err;
  }
  static async changeUserRole({ user_id, role_id }) {
    const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
      region: process.env.REGION,
    });

    const user = await ConsumerUser.findOne({ where: { id: user_id } });

    if (user.role_id === role_id) return;

    const scopes = [{ method: ["withPermissions", Permission] }];
    const role = await Role.scope(...scopes).findOne({
      where: { id: role_id },
    });

    const { permissions } = role.toJSON();

    const newPermissions = {
      UserAttributes: [
        {
          Name: "custom:permission",
          Value: permissions.map(({ name }) => name).join(","),
        },
      ],
      UserPoolId: process.env.USER_POOL_ID,
      Username: user.email,
    };

    if (user.user_role === "consumer") {
      user.user_role = "admin";
      user.role_id = role_id;
      user.save();
      const basicGroup = {
        GroupName: process.env.SUPER_ADMIN_GROUP,
        UserPoolId: process.env.USER_POOL_ID,
        Username: user.email,
      };
      await cognitoProvider.adminAddUserToGroup(basicGroup).promise();
    }

    const newGroup = {
      GroupName: role_id,
      UserPoolId: process.env.USER_POOL_ID,
      Username: user.email,
    };

    const removeGroupParams = {
      GroupName: user.role_id,
      UserPoolId: process.env.USER_POOL_ID,
      Username: user.email,
    };
    await Promise.all([
      cognitoProvider.adminUpdateUserAttributes(newPermissions).promise(),
      cognitoProvider.adminAddUserToGroup(newGroup).promise(),
      cognitoProvider.adminRemoveUserFromGroup(removeGroupParams).promise(),
    ]);
    return;
  }
}
