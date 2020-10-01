const { addConstraints, removeConstraints } = require("../libs/db_utils");

const constraints = {
  user_id: {
    type: "FOREIGN KEY",
    references: {
      table: "consumer_users",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  webinar_id: {
    type: "FOREIGN KEY",
    references: {
      table: "webinar_products",
      field: "id",
    },
    onUpdate: "CASCADE",
  },
};

module.exports = {
  up: async (queryInterface) => {
    return addConstraints(
      queryInterface,
      "webinar_product_details",
      constraints
    );
  },

  down: async (queryInterface) => {
    return removeConstraints(
      queryInterface,
      "webinar_product_details",
      constraints
    );
  },
};
