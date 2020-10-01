module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const webinars = await queryInterface.sequelize.query(
        "SELECT id, updatedAt FROM webinar_products WHERE `webinar_products`.`product_status` IN (:status)",
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            status: ["soldout", "progress", "done"],
          },
        }
      );
      return await Promise.all(
        webinars.map(async (webinar) => {
          return await queryInterface.sequelize.query(
            "UPDATE webinar_products SET soldout_date= :date WHERE webinar_products.id = :product_id",
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: {
                date: webinar.updatedAt,
                product_id: webinar.id,
              },
            }
          );
        })
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {},
};
