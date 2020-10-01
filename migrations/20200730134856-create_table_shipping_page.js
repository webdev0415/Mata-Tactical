module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('shipping_items', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      purchase_or_winner_id: {
        type: Sequelize.UUID,
      },
      shipping_status: {
        type: Sequelize.STRING(30),
        validate: {
          isIn: {
            args: [["label_not_printed", "label_printed","shipped"]],
            msg: "Must be validate status",
          },
        },
      },
      product_type: {
        type: Sequelize.STRING(30),
        validate: {
          isIn: {
            args: [["physical", "webinar"]],
            msg: "Must be 'physical' or 'webinar'",
          },
        },
      },
      shipping_address:
      {
        type: Sequelize.STRING(255),
      },
      shipped_date: {
        type: Sequelize.DATE,
      },
      tracking_number: {
        type: Sequelize.STRING(50),
      },
      is_grouped : {
        type : Sequelize.BOOLEAN,
        defaultValue: true,
      },
      updatedAt: Sequelize.DATE,
      createdAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('shipping_items');
  }
};
