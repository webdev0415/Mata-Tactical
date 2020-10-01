const { v4 } = require("uuid");
const permissionsList = require("../services/roles/permissionsLists");

const permissions = [
  { name: permissionsList.webinarQueueEdit, id: v4(), title: "Edit queue of webinars" },
 ];

module.exports = {
  up: async (queryInterface) => {
      return queryInterface.bulkInsert("permissions", permissions);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete("permissions", {});
  },
};
