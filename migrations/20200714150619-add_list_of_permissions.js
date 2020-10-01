const { v4 } = require("uuid");
const permissionsList = require("../services/roles/permissionsLists");

const permissions = [
  { name: permissionsList.dashboardView, id: v4(), title: "View dashboard data" },
  { name: permissionsList.categoryView, id: v4(), title: "View categories" },
  { name: permissionsList.categoryEdit, id: v4(), title: "Edit categories" },
  { name: permissionsList.productView, id: v4(), title: "View products" },
  { name: permissionsList.productEdit, id: v4(), title: "Edit products" },
  { name: permissionsList.webinarQueueView, id: v4(), title: "View queue of webinars" },
  { name: permissionsList.soldOutWebinarsEdit, id: v4(), title: "Start live stream" },
  { name: permissionsList.soldOutWebinarsView, id: v4(), title: "View sold out webinars" },
  { name: permissionsList.fflView, id: v4(), title: "View FFLs" },
  { name: permissionsList.fflEdit, id: v4(), title: "Create FFLs" },
  { name: permissionsList.giftCardsView, id: v4(), title: "View gift cards" },
  { name: permissionsList.giftCardsEdit, id: v4(), title: "Create gift cards" },
  { name: permissionsList.promoCodesView, id: v4(), title: "View promo codes" },
  { name: permissionsList.promoCodesEdit, id: v4(), title: "Create promo codes" },
  { name: permissionsList.faqEdit, id: v4(), title: "Edit FAQs" },
  { name: permissionsList.faqView, id: v4(), title: "View FAQs" },
  { name: permissionsList.settingsEdit, id: v4(), title: "Edit settings" },
  // { name: permissionsList.settingsEditAdvanced, id: v4(), title: "Edit advanced settings" },
  { name: permissionsList.settingsView, id: v4(), title: "View Settings" },
  { name: permissionsList.usersView, id: v4(), title: "View users" },
  { name: permissionsList.usersEdit, id: v4(), title: "Edit users" },
  { name: permissionsList.usersDelete, id: v4(), title: "Delete users" },
  { name: permissionsList.userCreateAdmin, id: v4(), title: "Create new admin users" },
  { name: permissionsList.completedWebinarsView, id: v4(), title: "View completed webinars" },
  {
    name: permissionsList.completedWebinarsEdit,
    id: v4(),
    title: "Attach ffl to completed webinars",
  },
  { name: permissionsList.rolesView, id: v4(), title: "View roles" },
  { name: permissionsList.rolesEdit, id: v4(), title: "Edit roles" },
  { name: permissionsList.seatsRefund, id: v4(), title: "Seats Refund" },
  { name: permissionsList.soldOutPhysicalView, id: v4(), title: "View sold out Physical" },
  { name: permissionsList.soldOutPhysicalEdit, id: v4(), title: "Attach ffl to physical products" },
];

module.exports = {
  up: async (queryInterface) => {
      return queryInterface.bulkInsert("permissions", permissions);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete("permissions", {});
  },
};
