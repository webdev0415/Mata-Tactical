
const permissionsList = require("../services/roles/permissionsLists");

module.exports = {
  up: async (queryInterface,Sequelize) => {
    try {
    const [permission_id] = await queryInterface.sequelize.query(
      "SELECT id FROM `permissions` WHERE name=:permission",
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          permission: permissionsList.webinarQueueEdit,
        },
      }
    );
    const [role_id] = await queryInterface.sequelize.query(
      "SELECT id FROM `roles` WHERE name=:admin_role",
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          permission: permissionsList.webinarQueueEdit,
          admin_role: process.env.SUPER_ADMIN_ROLE,
        },
      }
    );
    const role_permissions = [{permission_id: permission_id.id, role_id: role_id.id}];
    await queryInterface.bulkInsert("role_permissions", role_permissions);
    } catch (err)
    {
      console.log(err);
      throw err;
    }
  },

  down: async () => {
  },
};
