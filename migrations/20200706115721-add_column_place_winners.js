module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      await queryInterface.addColumn(
        "winners",
        "position",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction }
      );
      const webinars = await queryInterface.sequelize.query(
        "SELECT DISTINCT webinar_id FROM winners",
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      if (webinars.length === 0) return await transaction.commit();

      await Promise.all(
        webinars.map(async ({ webinar_id }) => {
          const winners = await queryInterface.sequelize.query(
            "SELECT * FROM winners WHERE webinar_id = :webinar_id",
            {
              type: Sequelize.QueryTypes.SELECT,
              replacements: {
                webinar_id,
              },
            }
          );

          await Promise.all(
            winners.map(async ({ id }, i) => {
              return await queryInterface.sequelize.query(
                "UPDATE winners SET position = :position WHERE winners.id = :id",
                {
                  type: Sequelize.QueryTypes.UPDATE,
                  replacements: {
                    position: i + 1,
                    id,
                  },
                },
                { transaction }
              );
            })
          );
        })
      );
      return await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn("winners", "position");
  },
};
